'use server'
import { db } from "@/db/drizzle";
import { organizationUsers, events, eventTicketAllocations, users, userAuths } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "./error";
import { OperatorWithProfile } from "@/types/event";

export const getOrganizationIdByUserId = async (userId: number, organizationId: number) => {
  try {
    const orgUsers = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.user_id, userId),
          eq(organizationUsers.organization_id, organizationId)
        )
      );

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
      .where(
        and(
          eq(users.auth_id, authId),
          eq(organizationUsers.is_active, true)
        )
      );
    
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
