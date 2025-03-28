import { tickets, events, userAuths, eventTicketAllocations, organizationUsers } from '../db/schema';

// スキーマから型を推論
export type Ticket = typeof tickets.$inferSelect;
export type Event = typeof events.$inferSelect;
export type UserAuth = typeof userAuths.$inferSelect;
export type TicketAllocation = typeof eventTicketAllocations.$inferSelect;
export type OrganizationUser = typeof organizationUsers.$inferSelect;

// グループ化されたチケット情報の型
export interface GroupedTicket {
  event_id: number;
  event: Event;
  amount: number;
  ticket_ids: number[];
  tickets: Ticket[];
  ticket_type: 'guest' | 'purchased';
  issued_by_user?: UserAuth; // 発行者情報（ある場合）
}

// ユーザーのチケット一覧の戻り値の型
export interface UserTicketsResult {
  tickets: GroupedTicket[];
}
