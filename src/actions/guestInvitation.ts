// src/actions/guestInvitation.ts
"use server";

import { db } from '@/db/drizzle';
import {
  eventTicketAllocations,
  ticketAllocationLogs,
  tickets,
  ticketLogs,
  users,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  ActionResponse,
  ErrorCode,
  createError,
  createSuccessResponse,
  createErrorResponse,
} from './error';

export type GuestInvitationInput = {
  allocationId: number;
  guestAuthId: string;
  ticketCount: number;
  reason?: string;
  changedByOrgUserId: number;
};

export const inviteGuests = async (
  input: GuestInvitationInput
): Promise<ActionResponse> => {
  try {
    const { allocationId, guestAuthId, ticketCount, reason, changedByOrgUserId } = input;

    // 1. チケット枠を取得して確認
    const allocation = await db.query.eventTicketAllocations.findFirst({
      where: eq(eventTicketAllocations.id, allocationId),
    });

    if (!allocation) {
      return createErrorResponse(
        'チケット割り当てが見つかりません',
        createError(ErrorCode.NOT_FOUND, '指定されたチケット割り当てが存在しません')
      );
    }

    if (allocation.remaining_quota < ticketCount) {
      return createErrorResponse(
        'チケット割り当ての枠が不足しています',
        createError(ErrorCode.INVALID_INPUT, '指定された枚数の枠がありません')
      );
    }

    // 2. ゲストユーザー確認
    const [guestUser] = await db.select().from(users).where(eq(users.auth_id, guestAuthId));

    if (!guestUser) {
      return createErrorResponse(
        'ユーザーが見つかりません',
        createError(ErrorCode.NOT_FOUND, '指定されたユーザーが存在しません')
      );
    }

    // 3. 枠を減らして記録
    const newQuota = allocation.remaining_quota - ticketCount;

    await db
      .update(eventTicketAllocations)
      .set({ remaining_quota: newQuota })
      .where(eq(eventTicketAllocations.id, allocationId));

    await db.insert(ticketAllocationLogs).values({
      allocation_id: allocationId,
      old_quota: allocation.remaining_quota,
      new_quota: newQuota,
      action_type: 'transfer',
      changed_by: changedByOrgUserId,
      reason,
    });

    // 4. チケット作成とログ
    for (let i = 0; i < ticketCount; i++) {
      const [ticket] = await db
        .insert(tickets)
        .values({
          event_id: allocation.event_id,
          owner_user_id: guestUser.id,
          ticket_type: 'guest',
          issued_by: allocationId,
          status: 'active',
        })
        .returning();

      await db.insert(ticketLogs).values({
        ticket_id: ticket.id,
        action_type: 'created',
        old_owner_user_id: null,
        new_owner_user_id: guestUser.id,
        changed_by: changedByOrgUserId,
        allocation_id: allocationId,
        reason,
      });
    }

    return createSuccessResponse('ゲストチケットを発行しました');
  } catch (error) {
    console.error('ゲスト招待処理エラー:', error);
    return createErrorResponse(
      'ゲスト招待処理に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, 'ゲスト招待中にエラーが発生しました', error)
    );
  }
};