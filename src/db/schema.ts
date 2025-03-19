import {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    integer,
    jsonb,
    boolean,
    unique,
    pgEnum,
    uuid,
  } from "drizzle-orm/pg-core";
  
  // 認証プロバイダー用 ENUM 型 (google, line)
  export const authProvider = pgEnum("auth_provider", ["google", "line"]);
  
  // 1. 団体テーブル
  export const organizations = pgTable("organizations", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  });
  
  // 2. グローバルなユーザーテーブル (Supabase認証と連携)
  export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    auth_id: uuid("auth_id").unique(), // Supabaseの認証IDと連携
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  });
  
// 3. ユーザーと団体の関連付けテーブル (団体ごとの役割など)
export const organizationUsers = pgTable(
  "organization_users",
  {
    id: serial("id").primaryKey(),
    organization_id: integer("organization_id").notNull(),
    user_id: integer("user_id").notNull(),
    role: varchar("role", { length: 50 }).notNull(), // 例: 'admin', 'operator', 'user'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unique_org_user: unique("unique_org_user").on(t.organization_id, t.user_id),
  })
);
  
  // 3b. 団体内での役割変更履歴テーブル
  export const organizationUserRoleHistory = pgTable("organization_user_role_history", {
    id: serial("id").primaryKey(),
    organization_user_id: integer("organization_user_id").notNull(),
    old_role: varchar("old_role", { length: 50 }).notNull(),
    new_role: varchar("new_role", { length: 50 }).notNull(),
    changed_by: integer("changed_by"), // 役割変更を行った組織内ユーザー (organization_users.id)
    reason: text("reason"),
    changed_at: timestamp("changed_at", { withTimezone: true }).defaultNow(),
  });
  
  // 4. ユーザー認証情報テーブル (Google / LINE に特化)
  export const userAuths = pgTable(
    "user_auths",
    {
      id: serial("id").primaryKey(),
      user_id: integer("user_id").notNull(),
      provider: authProvider("provider").notNull(), // ENUM 型
      provider_identifier: varchar("provider_identifier", { length: 255 }).notNull(),
      profile: jsonb("profile"), // 例: { "email": "example@gmail.com", "display_name": "ユーザー名" }
      created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
      updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (t) => ({
      unique_provider_identifier: unique("unique_provider_identifier").on(
        t.provider,
        t.provider_identifier
      ),
    })
  );
  
// 5. イベントテーブル (団体単位で管理、最新状態のみ保持)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  image_url: text("image_url"),
  location: text("location"),
  start_datetime: timestamp("start_datetime", { withTimezone: true }).notNull(),
  end_datetime: timestamp("end_datetime", { withTimezone: true }).notNull(),
  ticket_price: integer("ticket_price").notNull(), // 日本円なので整数型を使用
  capacity: integer("capacity"),
  is_published: boolean("is_published").default(false).notNull(),
  created_by: integer("created_by").notNull(), // organization_users.id を参照
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 5b. イベントごとのチケット割り当てテーブル (ユーザーごとのイベント別チケット枠)
export const eventTicketAllocations = pgTable("event_ticket_allocations", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull(),
  organization_user_id: integer("organization_user_id").notNull(), // organization_users.id を参照
  allocation_quota: integer("allocation_quota").default(0).notNull(), // 割り当てられた総枠
  remaining_quota: integer("remaining_quota").default(0).notNull(),   // 残りの利用可能枠
  created_by: integer("created_by").notNull(), // 割り当てを行った organization_users.id を参照
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
  
  // 6. チケットテーブル (イベントごとのチケット情報)
  export const tickets = pgTable("tickets", {
    id: serial("id").primaryKey(),
    event_id: integer("event_id").notNull(),
    owner_user_id: integer("owner_user_id").notNull(),
    ticket_type: varchar("ticket_type", { length: 50 }).notNull(), // 'purchased' または 'guest'
    issued_by: integer("issued_by"), // ゲストの場合、発行元の event_ticket_allocations.id を参照
    status: varchar("status", { length: 50 }).notNull(), // 例: 'active', 'used', 'cancelled'
    issued_at: timestamp("issued_at", { withTimezone: true }).defaultNow(),
    used_at: timestamp("used_at", { withTimezone: true }),
    qr_code_data: text("qr_code_data"), // チケット固有の QR コード情報 (拡張用)
  });
  
  // 7. チケット操作履歴テーブル (キャンセル、譲渡などの操作ログ)
  export const ticketLogs = pgTable("ticket_logs", {
    id: serial("id").primaryKey(),
    ticket_id: integer("ticket_id").notNull(),
    action_type: varchar("action_type", { length: 50 }).notNull(), // 例: 'created', 'cancelled', 'transferred', 'used'
    old_owner_user_id: integer("old_owner_user_id"),
    new_owner_user_id: integer("new_owner_user_id"),
    changed_by: integer("changed_by").notNull(), // 組織内ユーザー (organization_users.id)
    allocation_id: integer("allocation_id"), // 関連する event_ticket_allocations.id
    reason: text("reason"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  });
  
  // 8. チェックインログテーブル (QR コードスキャンによる入場記録)
  export const checkinLogs = pgTable("checkin_logs", {
    id: serial("id").primaryKey(),
    ticket_id: integer("ticket_id").notNull(),
    scanned_by: integer("scanned_by").notNull(), // 組織内ユーザー (organization_users.id)
    scanned_at: timestamp("scanned_at", { withTimezone: true }).defaultNow(),
    additional_info: jsonb("additional_info"),
  });

  // 9. チケット割り当て履歴テーブル (割り当て変更の履歴)
  export const ticketAllocationLogs = pgTable("ticket_allocation_logs", {
    id: serial("id").primaryKey(),
    allocation_id: integer("allocation_id").notNull(), // event_ticket_allocations.id
    old_quota: integer("old_quota"),
    new_quota: integer("new_quota"),
    action_type: varchar("action_type", { length: 50 }).notNull(), // 例: 'initial_allocation', 'increase', 'decrease', 'transfer'
    changed_by: integer("changed_by").notNull(), // 変更を行った organization_users.id
    target_allocation_id: integer("target_allocation_id"), // 移譲先の allocation_id (transferの場合)
    reason: text("reason"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  });
