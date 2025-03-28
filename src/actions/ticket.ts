import { db } from "@/db/drizzle";
import { tickets, events, eventTicketAllocations, userAuths, organizationUsers } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "./error";
import { GroupedTicket, UserTicketsResult, Ticket } from "@/types/ticket";

/**
 * ユーザーIDに基づいてチケット情報を取得し、イベントとチケットタイプごとにグループ化して返す
 * @param userId ユーザーID
 * @returns グループ化されたチケット情報
 */
export const getUserTickets = async (userId: number): Promise<ActionResponse<UserTicketsResult>> => {
  try {
    // ユーザーが所有するアクティブなチケットを全て取得
    const userTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.owner_user_id, userId),
          eq(tickets.status, 'active') // アクティブなチケットのみ取得
        )
      )
      .execute();

    if (userTickets.length === 0) {
      return createSuccessResponse('チケットが見つかりませんでした', {
        tickets: []
      });
    }

    // イベント情報を取得
    const eventIds = [...new Set(userTickets.map(ticket => ticket.event_id))];
    const eventsData = await db
      .select()
      .from(events)
      .where(inArray(events.id, eventIds))
      .execute();

    // イベントIDでインデックス化
    const eventsById = eventsData.reduce((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {} as Record<number, typeof events.$inferSelect>);

    // チケットをイベントIDとチケットタイプの組み合わせでグループ化するためのキーを生成
    const createGroupKey = (eventId: number, ticketType: 'purchased' | 'guest') => `${eventId}:${ticketType}`;

    // チケットをイベントごと・タイプごとにグループ化
    const ticketsByGroup: Record<string, GroupedTicket> = {};

    for (const ticket of userTickets) {
      const eventId = ticket.event_id;
      const event = eventsById[eventId];
      
      if (!event) continue; // イベントが見つからない場合はスキップ
      
      // チケットタイプを取得（デフォルトはpurchased）
      const ticketType = ticket.ticket_type as 'purchased' | 'guest';
      
      // グループキーを生成
      const groupKey = createGroupKey(eventId, ticketType);
      
      if (!ticketsByGroup[groupKey]) {
        // 新しいグループを作成
        ticketsByGroup[groupKey] = {
          event_id: eventId,
          event,
          amount: 1,
          ticket_ids: [ticket.id],
          tickets: [ticket],
          ticket_type: ticketType, // チケットタイプを設定
        };
      } else {
        // 既存のグループに追加
        ticketsByGroup[groupKey].amount += 1;
        ticketsByGroup[groupKey].ticket_ids.push(ticket.id);
        ticketsByGroup[groupKey].tickets.push(ticket);
      }
    }

    // 発行者情報を取得（issued_byが存在する場合）
    const allocationIds = userTickets
      .filter(ticket => ticket.issued_by !== null)
      .map(ticket => ticket.issued_by as number);

    if (allocationIds.length > 0) {
      const allocations = await db
        .select()
        .from(eventTicketAllocations)
        .where(inArray(eventTicketAllocations.id, allocationIds))
        .execute();

      const allocationMap = allocations.reduce((acc, allocation) => {
        acc[allocation.id] = allocation;
        return acc;
      }, {} as Record<number, typeof eventTicketAllocations.$inferSelect>);

      const orgUserIds = allocations.map(allocation => allocation.organization_user_id);
      
      if (orgUserIds.length > 0) {
        const orgUsers = await db
          .select()
          .from(organizationUsers)
          .where(inArray(organizationUsers.id, orgUserIds))
          .execute();

        const orgUserMap = orgUsers.reduce((acc, orgUser) => {
          acc[orgUser.id] = orgUser;
          return acc;
        }, {} as Record<number, typeof organizationUsers.$inferSelect>);

        const authUserIds = orgUsers.map(orgUser => orgUser.user_id);
        
        if (authUserIds.length > 0) {
          const authInfos = await db
            .select()
            .from(userAuths)
            .where(inArray(userAuths.user_id, authUserIds))
            .execute();

          const authInfoMap = authInfos.reduce((acc, authInfo) => {
            acc[authInfo.user_id] = authInfo;
            return acc;
          }, {} as Record<number, typeof userAuths.$inferSelect>);

          // 発行者情報をグループに追加
          for (const groupKey in ticketsByGroup) {
            const groupedTicket = ticketsByGroup[groupKey];
            const firstTicket = groupedTicket.tickets[0];
            
            if (firstTicket.issued_by) {
              const allocation = allocationMap[firstTicket.issued_by];
              if (allocation) {
                const orgUser = orgUserMap[allocation.organization_user_id];
                if (orgUser) {
                  const authInfo = authInfoMap[orgUser.user_id];
                  if (authInfo) {
                    groupedTicket.issued_by_user = authInfo;
                  }
                }
              }
            }
          }
        }
      }
    }

    return createSuccessResponse('チケット情報を取得しました', {
      tickets: Object.values(ticketsByGroup)
    });
  } catch (error) {
    console.error('チケット情報取得エラー:', error);
    return createErrorResponse(
      'チケット情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, 'チケット情報の取得中にエラーが発生しました', error)
    );
  }
};

/**
 * イベントIDとユーザーIDに基づいてアクティブなチケット情報を取得する
 * @param eventId イベントID
 * @param userId ユーザーID
 * @returns チケット情報
 */
export const getTicketsByEventId = async (eventId: number, userId: number): Promise<ActionResponse<Ticket[]>> => {
  try {
    const ticketList = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.event_id, eventId),
          eq(tickets.owner_user_id, userId),
          eq(tickets.status, 'active') // アクティブなチケットのみ取得
        )
      )
      .execute();

    return createSuccessResponse('イベントのチケット情報を取得しました', ticketList);
  } catch (error) {
    console.error('チケット情報取得エラー:', error);
    return createErrorResponse(
      'イベントのチケット情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, 'チケット情報の取得中にエラーが発生しました', error)
    );
  }
};
