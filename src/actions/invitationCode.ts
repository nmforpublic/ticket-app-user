import { and, eq } from 'drizzle-orm';
import { 
    ActionResponse, 
    ErrorCode, 
    createError, 
    createSuccessResponse, 
    createErrorResponse 
  } from './error';
import {
  invitationCodes,
  organizationUsers,
  tickets,
  organizationUserRoleHistory,
  organizations
} from "@/db/schema";
import { db } from "@/db/drizzle";

type RedeemInvitationResponse = {
  organizationId?: number;
  organizationName?: string;
  eventId?: number | null;
};

export const redeemInvitationCode = async (
  userId: number,
  codeString: string
): Promise<ActionResponse<RedeemInvitationResponse>> => {
  // 1. コードを探す
  const [codeRow] = await db
    .select()
    .from(invitationCodes)
    .where(and(eq(invitationCodes.code, codeString), eq(invitationCodes.is_active, true)));

  if (!codeRow) {
    return createErrorResponse(
      '無効なコードです',
      createError(ErrorCode.NOT_FOUND, 'そのコードは存在しないか、既に使用されました')
    );
  }

  console.log('codeRow:', codeRow);
  console.log('userId:', userId);
  console.log('codeString:', codeString);

  // 2. 種類別に処理を分岐
  if (codeRow.code_type === 'operator_invitation') {
    // すでに同じ organization で userId が登録されていないかをチェックする
    const existing = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organization_id, codeRow.organization_id),
        eq(organizationUsers.user_id, userId)
      ));

    if (existing.length > 0) {
      return createErrorResponse(
        '既に登録済みのユーザーです',
        createError(ErrorCode.DUPLICATE_ENTITY, 'ユーザーは既にこの組織に登録されています')
      );
    }

    // ここで「operator」として追加
    const [newOrgUser] = await db.insert(organizationUsers).values({
      organization_id: codeRow.organization_id,
      user_id: userId,
      role: 'operator',
    }).returning();

    // 役割変更履歴を記録
    await db.insert(organizationUserRoleHistory).values({
      organization_user_id: newOrgUser.id,
      old_role: 'user',
      new_role: 'operator',
      changed_by: codeRow.created_by,
      reason: `input_code=${codeString}`
    });

    // コードを単発で消費扱いに
    await db
      .update(invitationCodes)
      .set({ is_active: false })
      .where(eq(invitationCodes.id, codeRow.id));

    // 組織情報を取得
    const [organization] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, codeRow.organization_id));

    return createSuccessResponse('オペレーターとして登録しました', {
      organizationId: codeRow.organization_id,
      organizationName: organization?.name
    });
  }

  // 3. ゲスト招待系 (例: 'guest_invitation')
  else if (codeRow.code_type === 'guest_invitation') {
    console.log('ゲスト招待コードの処理');
  }
  return createErrorResponse(
    '不明なコードタイプです',
    createError(ErrorCode.INVALID_INPUT, `code_type: ${codeRow.code_type} は処理できません`)
  );
};
