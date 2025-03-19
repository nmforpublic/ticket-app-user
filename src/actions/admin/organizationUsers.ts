"use server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { organizationUsers, organizationUserRoleHistory, users, userAuths } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "@/actions/error";
import { OperatorWithProfile } from "@/types/event";

// 団体にユーザーを追加（役割、ゲストチケット上限設定）
export const addOrganizationUser = async (
  organizationId: number,
  userId: number,
  role: string,
): Promise<ActionResponse<void>> => {
  try {
    // 既に登録済みか確認
    const existingUser = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organization_id, organizationId),
          eq(organizationUsers.user_id, userId)
        )
      );

    if (existingUser.length > 0) {
      return createErrorResponse(
        'このユーザーは既に登録済みです',
        createError(ErrorCode.DUPLICATE_ENTITY, 'ユーザーは既にこの組織に登録されています')
      );
    }

    await db.insert(organizationUsers).values({
      organization_id: organizationId,
      user_id: userId,
      role,
    });
    revalidatePath("/organization-users");
    revalidatePath("/operators/list");
    return createSuccessResponse('ユーザーを登録しました');
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique_org_user')) {
      return createErrorResponse(
        'このユーザーは既に登録済みです',
        createError(ErrorCode.DUPLICATE_ENTITY, 'ユーザーは既にこの組織に登録されています')
      );
    }
    console.error('ユーザー登録エラー:', error);
    return createErrorResponse(
      'ユーザーの登録に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};

// 団体内ユーザーの役割変更（変更履歴も記録）
export const updateOrganizationUserRole = async (
  organizationUserId: number,
  newRole: string,
  changedBy: number,
  reason?: string
) => {
  // 現在の役割を取得
  const current = await db
    .select({ role: organizationUsers.role })
    .from(organizationUsers)
    .where(eq(organizationUsers.id, organizationUserId))
    .then((res) => res[0]);
  if (!current) throw new Error("Organization user not found");

  const oldRole = current.role;

  // 役割更新
  await db
    .update(organizationUsers)
    .set({ role: newRole })
    .where(eq(organizationUsers.id, organizationUserId));

  // 変更履歴を記録
  await db.insert(organizationUserRoleHistory).values({
    organization_user_id: organizationUserId,
    old_role: oldRole,
    new_role: newRole,
    changed_by: changedBy,
    reason,
  });
  revalidatePath("/organization-users");
};

// auth_idからorganizationUsers情報を取得
export const getOrganizationUserByAuthId = async (authId: string): Promise<ActionResponse<OperatorWithProfile[]>> => {
  try {
    const query = db
      .select({
        id: organizationUsers.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: organizationUsers.role,
        provider: userAuths.provider,
        profile: userAuths.profile,
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.user_id, users.id))
      .leftJoin(userAuths, eq(users.id, userAuths.user_id))
      .where(eq(users.auth_id, authId));
    
    const user = await query;
    
    if (!user.length) {
      return createErrorResponse(
        'ユーザーが見つかりません',
        createError(ErrorCode.NOT_FOUND, '指定されたauth_idのユーザーが見つかりません')
      );
    }

    const userWithProfile = user.map(u => {
      const profile = u.profile as Record<string, unknown> || {};
      
      return {
        id: u.id.toString(),
        userId: u.userId,
        name: u.name || (profile.display_name as string) || u.email || "名前なし",
        username: u.email || "",
        image: (profile.picture as string) || "",
        provider: u.provider ? String(u.provider) : undefined,
        guestLimit: 0,
        isSelected: false
      };
    });
    
    return createSuccessResponse('ユーザー情報を取得しました', userWithProfile);
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return createErrorResponse(
      'ユーザー情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};

// 組織内のoperatorロールを持つユーザー一覧を取得
export const getOrganizationOperators = async (organizationId: number): Promise<ActionResponse<OperatorWithProfile[]>> => {
  try {
    // organizationUsersからroleが"operator"のユーザーを取得し、usersおよびuserAuthsと結合
    const query = db
      .select({
        id: organizationUsers.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: organizationUsers.role,
        provider: userAuths.provider,
        profile: userAuths.profile,
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.user_id, users.id))
      .leftJoin(userAuths, eq(users.id, userAuths.user_id))
      .where(
        and(
          eq(organizationUsers.organization_id, organizationId),
          eq(organizationUsers.role, "operator")
        )
      );
    
    const operators = await query;
    
    // プロフィール情報を整形
    const operatorsWithProfile = operators.map(op => {
      // profileはJSONBなので、型安全にアクセスするために型アサーションを使用
      const profile = op.profile as Record<string, unknown> || {};
      
      return {
        id: op.id.toString(),
        userId: op.userId,
        name: op.name || (profile.display_name as string) || op.email || "名前なし",
        username: op.email || "",
        image: (profile.picture as string) || "",
        provider: op.provider ? String(op.provider) : undefined,
        guestLimit: 0,
        isSelected: false
      };
    });
    
    return createSuccessResponse('運営者一覧を取得しました', operatorsWithProfile);
  } catch (error) {
    console.error('運営者一覧取得エラー:', error);
    return createErrorResponse(
      '運営者一覧の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};
