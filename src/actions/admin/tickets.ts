"use server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { tickets, ticketLogs, users, userAuths, eventTicketAllocations, organizationUsers } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "@/actions/error";
import { GuestTicketWithUser } from "@/types/event";

// チケットの作成（購入済み or ゲスト枠）
export const createTicket = async (
  eventId: number,
  ownerUserId: number,
  ticketType: string, // "purchased" または "guest"
  issuedBy: number | null = null
) => {
  await db.insert(tickets).values({
    event_id: eventId,
    owner_user_id: ownerUserId,
    ticket_type: ticketType,
    issued_by: issuedBy,
    status: "active",
  });
  revalidatePath("/tickets");
};

// チケットのキャンセル（状態を "cancelled" に更新し、ログを記録）
export const cancelTicket = async (
  ticketId: number,
  changedBy: number,
  reason?: string
) => {
  await db
    .update(tickets)
    .set({ status: "cancelled" })
    .where(eq(tickets.id, ticketId));

  await db.insert(ticketLogs).values({
    ticket_id: ticketId,
    action_type: "cancelled",
    changed_by: changedBy,
    reason,
  });
  revalidatePath("/tickets");
};

// チケットの譲渡（所有者を更新し、譲渡のログを記録）
export const transferTicket = async (
  ticketId: number,
  newOwnerUserId: number,
  changedBy: number,
  reason?: string
) => {
  // 現在の所有者を取得
  const ticketRecord = await db
    .select({ owner_user_id: tickets.owner_user_id })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .then((res) => res[0]);
  if (!ticketRecord) throw new Error("Ticket not found");

  const oldOwnerUserId = ticketRecord.owner_user_id;

  await db
    .update(tickets)
    .set({ owner_user_id: newOwnerUserId })
    .where(eq(tickets.id, ticketId));

  await db.insert(ticketLogs).values({
    ticket_id: ticketId,
    action_type: "transferred",
    old_owner_user_id: oldOwnerUserId,
    new_owner_user_id: newOwnerUserId,
    changed_by: changedBy,
    reason,
  });
  revalidatePath("/tickets");
};

// イベントのゲストチケット一覧を取得
export const getEventGuestTickets = async (eventId: number): Promise<ActionResponse<GuestTicketWithUser[]>> => {
  try {
    // イベントIDが指定されていない場合（新規作成時）は空配列を返す
    if (!eventId) {
      return createSuccessResponse('ゲストチケット一覧を取得しました', []);
    }
    
    // ticketsテーブルからticket_typeが"guest"のチケットを取得し、
    // users、userAuths、eventTicketAllocations、organizationUsersと結合
    const query = db
      .select({
        ticketId: tickets.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        provider: userAuths.provider,
        profile: userAuths.profile,
        issuedBy: tickets.issued_by,
        issuerId: organizationUsers.id,
        issuerName: users.name, // 実際の実装ではサブクエリで発行者の名前を取得する必要がある
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.owner_user_id, users.id))
      .leftJoin(userAuths, eq(users.id, userAuths.user_id))
      .leftJoin(eventTicketAllocations, eq(tickets.issued_by, eventTicketAllocations.id))
      .leftJoin(organizationUsers, eq(eventTicketAllocations.organization_user_id, organizationUsers.id))
      .where(
        and(
          eq(tickets.event_id, eventId),
          eq(tickets.ticket_type, "guest"),
          eq(tickets.status, "active")
        )
      );
    
    const guestTickets = await query;
    
    // ゲストチケット情報を整形
    const guestTicketsWithUser = guestTickets.map(ticket => {
      // profileはJSONBなので、型安全にアクセスするために型アサーションを使用
      const profile = ticket.profile as Record<string, unknown> || {};
      
      return {
        id: ticket.ticketId.toString(),
        name: ticket.userName || (profile.display_name as string) || ticket.userEmail || "名前なし",
        username: ticket.userEmail || "",
        image: (profile.picture as string) || "",
        issuedBy: {
          id: ticket.issuerId || 0,
          name: ticket.issuerName || "不明"
        }
      };
    });
    
    return createSuccessResponse('ゲストチケット一覧を取得しました', guestTicketsWithUser);
  } catch (error) {
    console.error('ゲストチケット一覧取得エラー:', error);
    return createErrorResponse(
      'ゲストチケット一覧の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, error instanceof Error ? error.message : '不明なエラー', error)
    );
  }
};
