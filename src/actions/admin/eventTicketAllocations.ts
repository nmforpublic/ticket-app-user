"use server";
import { db } from "@/db/drizzle";
import { 
  eventTicketAllocations, 
  ticketAllocationLogs,
  organizationUsers,
  users,
  userAuths
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "@/actions/error";
import { EventTicketOperator } from "@/types/event";

// イベントのチケット割り当てを作成
export const createEventTicketAllocations = async (
  eventId: number,
  allocations: { organizationUserId: number, quota: number }[],
  createdBy: number
): Promise<ActionResponse> => {
  try {
    // 割り当てデータの検証
    if (!eventId || !Array.isArray(allocations) || allocations.length === 0) {
      return createErrorResponse(
        '無効な割り当てデータです',
        createError(ErrorCode.VALIDATION_ERROR, '有効な割り当てデータを指定してください')
      );
    }
    
    // 割り当てデータの作成
    const values = allocations.map(allocation => ({
      event_id: eventId,
      organization_user_id: allocation.organizationUserId,
      allocation_quota: allocation.quota,
      remaining_quota: allocation.quota,
      created_by: createdBy
    }));
    
    const result = await db.insert(eventTicketAllocations).values(values).returning({
      id: eventTicketAllocations.id,
      organizationUserId: eventTicketAllocations.organization_user_id,
      quota: eventTicketAllocations.allocation_quota
    });
    
    // 割り当て履歴の記録
    const logValues = result.map(item => ({
      allocation_id: item.id,
      new_quota: item.quota,
      action_type: 'initial_allocation',
      changed_by: createdBy
    }));
    
    await db.insert(ticketAllocationLogs).values(logValues);
    
    revalidatePath(`/events/${eventId}`);
    return createSuccessResponse('チケット割り当てを作成しました');
  } catch (error) {
    console.error('チケット割り当て作成エラー:', error);
    return createErrorResponse(
      'チケット割り当ての作成に失敗しました',
      createError(ErrorCode.OPERATION_FAILED, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};

// イベントのチケット割り当てを更新
export const updateEventTicketAllocations = async (
  eventId: number,
  allocations: { id?: number, organizationUserId: number, quota: number }[],
  updatedBy: number
): Promise<ActionResponse> => {
  try {
    // 割り当てデータの検証
    if (!eventId || !Array.isArray(allocations) || allocations.length === 0) {
      return createErrorResponse(
        '無効な割り当てデータです',
        createError(ErrorCode.VALIDATION_ERROR, '有効な割り当てデータを指定してください')
      );
    }
    
    // 既存の割り当てを取得
    const existingAllocations = await db
      .select({
        id: eventTicketAllocations.id,
        organizationUserId: eventTicketAllocations.organization_user_id,
        quota: eventTicketAllocations.allocation_quota
      })
      .from(eventTicketAllocations)
      .where(eq(eventTicketAllocations.event_id, eventId));
    
    // 新規追加と更新に分類
    const toCreate = allocations.filter(a => !a.id);
    const toUpdate = allocations.filter(a => a.id && existingAllocations.some(e => e.id === a.id));
    
    // 新規追加の処理
    if (toCreate.length > 0) {
      await createEventTicketAllocations(
        eventId,
        toCreate.map(a => ({ organizationUserId: a.organizationUserId, quota: a.quota })),
        updatedBy
      );
    }
    
    // 更新の処理
    for (const allocation of toUpdate) {
      if (!allocation.id) continue;
      
      const existing = existingAllocations.find(e => e.id === allocation.id);
      if (!existing) continue;
      
      // 割り当て数が変更された場合のみ更新
      if (existing.quota !== allocation.quota) {
        // 割り当て情報を更新
        await db
          .update(eventTicketAllocations)
          .set({
            allocation_quota: allocation.quota,
            remaining_quota: allocation.quota, // 注意: 実際の実装では現在の残り枠を考慮する必要がある
            updated_at: new Date()
          })
          .where(eq(eventTicketAllocations.id, allocation.id));
        
        // 割り当て履歴を記録
        await db.insert(ticketAllocationLogs).values({
          allocation_id: allocation.id,
          old_quota: existing.quota,
          new_quota: allocation.quota,
          action_type: 'update',
          changed_by: updatedBy
        });
      }
    }
    
    revalidatePath(`/events/${eventId}`);
    return createSuccessResponse('チケット割り当てを更新しました');
  } catch (error) {
    console.error('チケット割り当て更新エラー:', error);
    return createErrorResponse(
      'チケット割り当ての更新に失敗しました',
      createError(ErrorCode.OPERATION_FAILED, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};

// チケット割り当て情報の型定義
interface TicketAllocation {
  id: number;
  organizationUserId: number;
  quota: number;
  remaining: number;
  operator?: EventTicketOperator; // 運営者情報を追加
}

// eventIdからEventTicketOperatorのリストを取得
export const getEventTicketOperators = async (eventId: number): Promise<ActionResponse<EventTicketOperator[]>> => {
  try {
    if (!eventId) {
      return createErrorResponse(
        'イベントIDが指定されていません',
        createError(ErrorCode.VALIDATION_ERROR, 'イベントIDを指定してください')
      );
    }

    // イベントに紐づく運営者情報を取得
    const operators = await db
      .select({
        id: eventTicketAllocations.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        image: userAuths.profile,
        allocation_quota: eventTicketAllocations.allocation_quota,
        remaining_quota: eventTicketAllocations.remaining_quota
      })
      .from(eventTicketAllocations)
      .innerJoin(organizationUsers, eq(eventTicketAllocations.organization_user_id, organizationUsers.id))
      .innerJoin(users, eq(organizationUsers.user_id, users.id))
      .leftJoin(userAuths, eq(users.id, userAuths.user_id))
      .where(eq(eventTicketAllocations.event_id, eventId));

    // EventTicketOperator型にデータを整形
    const formattedOperators = operators.map(op => {
      const profile = op.image as Record<string, unknown> || {};
      
      return {
        id: op.id.toString(),
        userId: op.userId,
        name: op.name || "",
        username: op.email || "",
        image: (profile.picture as string) || "",
        allocation_quota: op.allocation_quota,
        remaining_quota: op.remaining_quota
      };
    });

    return createSuccessResponse('運営者情報を取得しました', formattedOperators);
  } catch (error) {
    console.error('運営者情報取得エラー:', error);
    return createErrorResponse(
      '運営者情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};

export const getEventTicketAllocations = async (eventId: number): Promise<ActionResponse<TicketAllocation[]>> => {
  try {
    if (!eventId) {
      return createErrorResponse(
        'イベントIDが指定されていません',
        createError(ErrorCode.VALIDATION_ERROR, 'イベントIDを指定してください')
      );
    }
    
    const allocations = await db
      .select({
        id: eventTicketAllocations.id,
        organizationUserId: eventTicketAllocations.organization_user_id,
        quota: eventTicketAllocations.allocation_quota,
        remaining: eventTicketAllocations.remaining_quota
      })
      .from(eventTicketAllocations)
      .where(eq(eventTicketAllocations.event_id, eventId));
    
    return createSuccessResponse('チケット割り当て一覧を取得しました', allocations);
  } catch (error) {
    console.error('チケット割り当て一覧取得エラー:', error);
    return createErrorResponse(
      'チケット割り当て一覧の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};
