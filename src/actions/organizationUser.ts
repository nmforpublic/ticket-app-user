import { db } from "@/db/drizzle";
import { organizationUsers, events, eventTicketAllocations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "./error";

export const getOrganizationIdByUserId = async (userId: number) => {
  try {
    const orgUsers = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.user_id, userId));

    if (orgUsers.length === 0) {
      return createErrorResponse(
        '組織が見つかりませんでした',
        createError(ErrorCode.NOT_FOUND, '指定されたユーザーIDの組織が存在しません')
      );
    }

    return createSuccessResponse('組織IDを取得しました', {
      organizationId: orgUsers[0].organization_id
    });
  } catch (error) {
    console.error('組織ID取得エラー:', error);
    return createErrorResponse(
      '組織IDの取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, '組織IDの取得中にエラーが発生しました', error)
    );
  }
};

export const getEventsByOrganizationId = async (organizationId: number, organizationUserId: number) => {
  try {
    const eventList = await db
      .select({
        id: events.id,
        name: events.name,
        description: events.description,
        image_url: events.image_url,
        location: events.location,
        start_datetime: events.start_datetime,
        end_datetime: events.end_datetime,
        ticket_price: events.ticket_price,
        capacity: events.capacity,
        is_published: events.is_published,
        allocation_quota: eventTicketAllocations.allocation_quota,
        remaining_quota: eventTicketAllocations.remaining_quota
      })
      .from(events)
      .innerJoin(
        eventTicketAllocations,
        eq(events.id, eventTicketAllocations.event_id)
      )
      .where(
        and(
          eq(events.organization_id, organizationId),
          eq(eventTicketAllocations.organization_user_id, organizationUserId)
        )
      );

    return createSuccessResponse('割り当てられたイベント情報を取得しました', eventList);
  } catch (error) {
    console.error('イベント情報取得エラー:', error);
    return createErrorResponse(
      'イベント情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, 'イベント情報の取得中にエラーが発生しました', error)
    );
  }
};
