'use server';
import { nanoid } from "nanoid"; // ランダム文字列生成用など
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
import { inviteGuests } from "./guestInvitation";
import {getOrganizationIdByUserId} from './organizationUser';
import { createClient } from "@/utils/supabase/server";

type RedeemOperatorInvitationResponse = {
  organizationId?: number;
  organizationName?: string;
  eventId?: number | null;
};
type RedeemGuestInvitationResponse = {
  eventId: number;
  allocationId: number;
  ticketCount: number;
};

export const redeemInvitationCode = async (
  userId: number,
  codeString: string
): Promise<ActionResponse<RedeemOperatorInvitationResponse | RedeemGuestInvitationResponse>> => {
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
      // すでに存在するが非アクティブの場合はアクティブに戻す
      if (!existing[0].is_active) {
        await db
          .update(organizationUsers)
          .set({ 
            is_active: true,
            role: 'operator',
            updated_at: new Date()
          })
          .where(and(
            eq(organizationUsers.organization_id, codeRow.organization_id),
            eq(organizationUsers.user_id, userId)
          ));

        // 役割変更履歴を記録
        await db.insert(organizationUserRoleHistory).values({
          organization_user_id: existing[0].id,
          old_role: existing[0].role,
          new_role: 'operator',
          changed_by: codeRow.created_by,
          reason: `reactivated_by_code=${codeString}`
        });

        // 組織情報を取得
        const [organization] = await db.select()
          .from(organizations)
          .where(eq(organizations.id, codeRow.organization_id));

        return createSuccessResponse('オペレーターとして再登録しました', {
          organizationId: codeRow.organization_id,
          organizationName: organization?.name
        });
      }
      
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
    try {
      if (!codeRow.created_by || !codeRow.allocation_id || !codeRow.ticket_amount) {
        return createErrorResponse(
          '不正なコードです',
          createError(ErrorCode.INVALID_INPUT, 'このコードの情報が不足しています')
        );
      }
      // supabaseからユーザー情報を取得
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return createErrorResponse(
          '認証が必要です',
          createError(ErrorCode.UNAUTHORIZED, 'ユーザーが認証されていません')
        );
      }

      // イベント情報を取得
      const allocationId = codeRow.allocation_id;
      const ticketCount = codeRow.ticket_amount;
      const changedByOrgUserId = codeRow.created_by;
      const reason = `input_code=${codeString}`;
      const guestAuthId = user.id;

      // ゲストユーザーを招待
      const inviteResponse = await inviteGuests({
        allocationId,
        guestAuthId,
        ticketCount,
        reason,
        changedByOrgUserId
      });

      if (!inviteResponse.success) {
        return createErrorResponse(
          '招待に失敗しました',
          inviteResponse.error || createError(ErrorCode.DATABASE_ERROR, '招待処理中にエラーが発生しました')
        );
      }

      // コードを単発で消費扱いに
      await db
        .update(invitationCodes)
        .set({ is_active: false })
        .where(eq(invitationCodes.id, codeRow.id));

      return createSuccessResponse('ゲストユーザーとして登録しました', {
        eventId: codeRow.event_id || 0,
        allocationId: allocationId,
        ticketCount: ticketCount
      });
    } catch (error) {
      console.error('ゲスト招待エラー:', error);
      return createErrorResponse(
        'ゲスト招待に失敗しました',
        createError(ErrorCode.DATABASE_ERROR, '予期せぬエラーが発生しました', error)
      );
    }
  }

  // 対応していないコードタイプの場合
  return createErrorResponse(
    '不明なコードタイプです',
    createError(ErrorCode.INVALID_INPUT, `code_type: ${codeRow.code_type} は処理できません`)
  );
};


type CodeType = 'operator_invitation' | 'guest_invitation';

// 招待コード情報の型定義
export type InvitationCodeInfo = {
  id: number;
  code: string;
  code_type: CodeType;
  organization_id: number;
  event_id: number | null;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  ticket_amount: number | null;
  allocation_id: number | null;
};

/**
 * 招待コードを生成する
 * @param organizationUserId コードを作成するユーザーのID (organization_users.id)
 * @param organizationId 組織ID
 * @param codeType コードの種類
 * @param eventId イベントID（オプション）
 * @param ticketAmount チケット枚数（オプション）
 * @param allocationId 割り当てID（オプション）
 * @returns 生成された招待コード情報
 */
export async function createInvitationCode(
  organizationUserId: number,
  organizationId: number,
  codeType: CodeType,
  eventId?: number,
  ticketAmount?: number,
  allocationId?: number
): Promise<ActionResponse<InvitationCodeInfo>> {
  try {
    // 実際にユーザーへ配布する「コード文字列」を生成する
    // nanoid, uuid, shortid などお好みでOK
    const codeString = nanoid(10);

    // DBにinsert
    const [inserted] = await db
      .insert(invitationCodes)
      .values({
        code: codeString,
        organization_id: organizationId,
        event_id: eventId ?? null,
        code_type: codeType,
        created_by: organizationUserId,
        is_active: true,
        ticket_amount: ticketAmount ?? null,
        allocation_id: allocationId ?? null,
      })
      .returning(); // PostgreSQL の returning でレコードを返す

    return createSuccessResponse(
      '招待コードを生成しました',
      inserted as InvitationCodeInfo
    );
  } catch (error) {
    console.error('招待コード生成エラー:', error);
    return createErrorResponse(
      '招待コードの生成に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, '招待コードの生成中にエラーが発生しました', error)
    );
  }
}
