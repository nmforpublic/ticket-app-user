'use server';
import { LineUser } from "@/types/user";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import {
  initializeBackendSupabase,
} from "./supabase";
import {
  getUserByLineId,
  saveUser
} from "@/actions/user";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
  language: string;
  statusMessage?: string;
}

const verifyLineToken = async (accessToken: string): Promise<void> => {
  try {
    const channelId = process.env.LINE_CHANNEL_ID;
    console.log("[DEBUG] Verifying LINE token with channelId:", channelId);
    const response = await fetch(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      const data: { error_description: string; error: string } =
        await response.json();
      throw new Error(
        `[LINE Token Verification] ${data.error}: ${data.error_description}`
      );
    }
    const data: { client_id: string; expires_in: number } =
      await response.json();
    console.log("[DEBUG] Token verification result:", data);
    if (data.client_id !== channelId) {
      throw new Error(
        `Line client_id does not match:liffID : ${channelId}  client_id : ${data.client_id}`
      );
    }
    if (data.expires_in < 0) {
      throw new Error(`Line access token is expired: ${data.expires_in}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`[LINE Token Verification] ${error.message}`);
    }
    throw new Error("[LINE Token Verification] Unknown error occurred");
  }
};

const getLineProfile = async (accessToken: string): Promise<LineProfile> => {
  try {
    const response = await fetch("https://api.line.me/v2/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const data: { error_description: string; error: string } =
        await response.json();
      throw new Error(
        `[LINE Profile Fetch] ${data.error}: ${data.error_description}`
      );
    }
    // 型を指定せずに一旦rawデータを取得
    const rawData = await response.json();
    console.log("[DEBUG] LINE profile raw data:", rawData);
    return rawData as LineProfile;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`[LINE Profile Fetch] ${error.message}`);
    }
    throw new Error("[LINE Profile Fetch] Unknown error occurred");
  }
};

const createUserObject = (profile: LineProfile, userId: string): LineUser => ({
  id: userId,
  displayName: profile.displayName,
  lineId: profile.userId,
  pictureUrl: profile.pictureUrl,
  statusMessage: profile.statusMessage ?? "",
});

// Create user for auth, which is not our custom user table.
async function CreateUser(
  supabase: SupabaseClient,
  profile: LineProfile
): Promise<string> {
  console.log("[DEBUG] Creating new user:", profile);
  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: `${profile.userId}@line.com`,
      email_confirm: true,
      password: profile.userId,
      user_metadata: {
        line_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        language: profile.language,
        status_message: profile.statusMessage,
      },
      app_metadata: { provider: "line" },
    });

  if (createError || !createdUser?.user) {
    console.error("[ERROR] Failed to create user:", createError);
    throw new Error("Failed to create user");

  }

  const user = createUserObject(profile, createdUser.user.id);
  const { error: saveError } = await saveUser(user);
  if (saveError) throw new Error(`[User Save] ${saveError.message}`);

  return createdUser.user.id;
}

export const POST = async (req: NextRequest) => {
  try {
    console.log("[DEBUG] API login called - Initializing Supabase");
    const supabase = await initializeBackendSupabase();
    console.log("[DEBUG] Supabase initialized successfully");
    
    // ボディからデータを取得
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("[DEBUG] requestBody 全体:", JSON.stringify(requestBody, null, 2));
      console.log("[DEBUG] Request body parsed successfully:", { 
        hasAccessToken: !!requestBody.accessToken 
      });
    } catch (jsonError) {
      console.error("[ERROR] Failed to parse request JSON:", jsonError);
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 }
      );
    }
    
    const { accessToken } = requestBody as { accessToken: string };
    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    let profile: LineProfile;
    console.log("[DEBUG] Environment:", process.env.NODE_ENV);

    console.log("[DEBUG] Verifying LINE token");
    try {
      await verifyLineToken(accessToken);
      profile = await getLineProfile(accessToken);
      console.log("[DEBUG] LINE token verified successfully");
      // 型変換前のデータはgetLineProfile内で出力済み
      console.log("[DEBUG] LINE profile (interface適用後):", profile);
    } catch (lineError) {
      console.error("[ERROR] LINE API error:", lineError);
      return NextResponse.json(
        { error: lineError instanceof Error ? lineError.message : "LINE API error" },
        { status: 401 }
      );
    }

    try {
      console.log("[DEBUG] Checking if user exists:", profile.userId);
      const userData = await getUserByLineId(profile.userId);

      if (!userData) {
        console.log("[DEBUG] User not found, creating new user");
        await CreateUser(supabase, profile);
        console.log("[DEBUG] New user created successfully");
      } else {
        console.log("[DEBUG] Existing user found:", userData.id);
      }
    } catch (userError) {
      console.error("[ERROR] User management error:", userError);
      return NextResponse.json(
        { error: userError instanceof Error ? userError.message : "User creation failed" },
        { status: 500 }
      );
    }

    try {
      console.log("[DEBUG] Signing in with password");
      // following auth code is simple signInWithPassword for sample code.
      // Please replace method when you use production.
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: `${profile.userId}@line.com`,
          password: profile.userId,
        });

      if (signInError) {
        console.error("[ERROR] Auth sign in error:", signInError);
        throw new Error(`[Auth Sign In] ${signInError.message}`);
      }

      console.log("[DEBUG] Authentication successful");
      return NextResponse.json({
        sessionToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      });
    } catch (authError) {
      console.error("[ERROR] Authentication error:", authError);
      return NextResponse.json(
        { error: authError instanceof Error ? authError.message : "Authentication failed" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("[ERROR] Uncaught server error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error 
            ? `Server error: ${error.message}` 
            : "Unknown server error occurred",
      },
      { status: 500 }
    );
  }
};
