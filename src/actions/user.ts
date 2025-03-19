'use server';

import { db } from '@/db/drizzle';
import { users, userAuths } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from './error';
import { LineUser } from '@/types/user';

// UserAuthsの型定義
export type UserAuthsInfo = {
  id: number;
  user_id: number;
  provider: 'google' | 'line';
  provider_identifier: string;
  profile: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

/**
 * Supabase認証IDを使用してユーザーの認証情報を取得する
 * @param supabaseAuthId Supabaseの認証ID (UUID)
 * @returns ユーザーの認証情報一覧
 */
export async function getUserAuthsBySupabaseId(
  supabaseAuthId: string
): Promise<ActionResponse<UserAuthsInfo>> {
  try {
    // 1. auth_idからユーザーを検索
    const userResults = await db.select()
      .from(users)
      .where(eq(users.auth_id, supabaseAuthId));
    
    // ユーザーが見つからない場合
    if (userResults.length === 0) {
      return createErrorResponse(
        'ユーザーが見つかりませんでした',
        createError(ErrorCode.NOT_FOUND, 'Supabase認証IDに一致するユーザーが存在しません', { supabaseAuthId })
      );
    }
    
    const userId = userResults[0].id;
    
    // 2. ユーザーIDに関連するすべての認証情報を取得
    const userAuthsResults = await db.select()
      .from(userAuths)
      .where(eq(userAuths.user_id, userId));
    
    if (userAuthsResults.length === 0) {
      return createErrorResponse(
        'ユーザー認証情報が見つかりませんでした',
        createError(ErrorCode.NOT_FOUND, 'ユーザーに関連する認証情報が存在しません', { userId })
      );
    }
    
    return createSuccessResponse(
      'ユーザー認証情報を取得しました', 
      userAuthsResults[0] as UserAuthsInfo
    );
  } catch (error) {
    console.error('ユーザー認証情報取得エラー:', error);
    return createErrorResponse(
      'ユーザー認証情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, 'ユーザー認証情報の取得中にエラーが発生しました', error)
    );
  }
}

/** 
 * LINEの userId (例: "Uxxxx") に紐づく user_auths.provider_identifier を検索し、
 * Drizzleの `users` レコードもJOINして返す
 */
export async function getUserByLineId(lineId: string) {
  // 1. user_auths(provider='line', provider_identifier=lineId) を探す
  const auth = await db
    .select()
    .from(userAuths)
    .where(
      and(eq(userAuths.provider, "line"), eq(userAuths.provider_identifier, lineId))
    );

  if (auth.length === 0) {
    // 見つからなかった
    return null;
  }
  const userAuthRow = auth[0];

  // 2. 紐づく users レコードを取得
  const u = await db.select().from(users).where(eq(users.id, userAuthRow.user_id));

  if (u.length === 0) {
    // user_auths があるのに users が見つからない (DB不整合?)
    return null;
  }
  const userRow = u[0];

  // 必要に応じてレスポンス整形
  return {
    id: userRow.id,
    authId: userRow.auth_id,
    name: userRow.name,
    // ...
    lineId: userAuthRow.provider_identifier,
    lineProfile: userAuthRow.profile, // JSONB
  };
}

/** 
 * Drizzle定義の `users` / `user_auths` をアップサート
 *
 * (サンプルでは "User"型を { id, displayName, lineId, ... } などで受け取る想定)
 */
export async function saveUser(user: LineUser) {
  try {
    // 1. `users` テーブルを Upsert: `auth_id = user.id` とかに紐づけても良い
    //  (サンプルでは user.id を "Supabase Auth の UUID" として扱うイメージ)
    const [existing] = await db.select().from(users).where(eq(users.auth_id, user.id));

    if (!existing) {
      // insert
      await db.insert(users).values({
        auth_id: user.id, // ここでは user.id を auth_id として扱う
        name: user.displayName,
        // 他に email等があれば入れる
      });
    } else {
      // update
      await db
        .update(users)
        .set({ name: user.displayName, updated_at: new Date() })
        .where(eq(users.id, existing.id));
    }

    // 2. user_auths (provider='line') も upsert
    //    user.lineId に "Uxxxx" が入っている想定
    const [authExisting] = await db
      .select()
      .from(userAuths)
      .where(
        and(eq(userAuths.provider, "line"), eq(userAuths.provider_identifier, user.lineId))
      );

    if (!authExisting) {
      // users.id を取得
      const [theUser] = await db.select().from(users).where(eq(users.auth_id, user.id));
      if (!theUser) {
        throw new Error("User not found after insertion");
      }

      await db.insert(userAuths).values({
        user_id: theUser.id,
        provider: "line",
        provider_identifier: user.lineId,
        profile: {
          line_id: user.lineId,
          display_name: user.displayName,
          picture_url: user.pictureUrl,
          status_message: user.statusMessage,
        },
      });
    } else {
      await db
        .update(userAuths)
        .set({
          profile: {
            line_id: user.lineId,
            display_name: user.displayName,
            picture_url: user.pictureUrl,
            status_message: user.statusMessage,
          },
          updated_at: new Date(),
        })
        .where(eq(userAuths.id, authExisting.id));
    }

    return { error: null };
  } catch (err) {
    console.error("[saveUser] error:", err);
    if (err instanceof Error) {
      return { error: err };
    }
    return { error: new Error("unknown error") };
  }
}
