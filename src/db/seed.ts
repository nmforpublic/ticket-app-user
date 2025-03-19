import { config } from 'dotenv';
import { db } from './drizzle';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

// .envファイルを読み込む
config({ path: '.env' });

// シードデータを挿入する関数
async function seed() {
  try {
    console.log('シードデータの挿入を開始します...');

    // 既存データの削除とシーケンスのリセット
    console.log('既存データを削除中...');
    
    // 外部キー制約を一時的に無効化
    await db.execute(sql`SET session_replication_role = 'replica';`);

    // テーブルの削除（逆順）
    await db.delete(schema.ticketAllocationLogs);
    await db.delete(schema.checkinLogs);
    await db.delete(schema.ticketLogs);
    await db.delete(schema.tickets);
    await db.delete(schema.eventTicketAllocations);
    await db.delete(schema.events);
    await db.delete(schema.userAuths);
    await db.delete(schema.organizationUserRoleHistory);
    await db.delete(schema.organizationUsers);
    await db.delete(schema.users);
    await db.delete(schema.organizations);

    // シーケンスのリセット
    await db.execute(sql`
      ALTER SEQUENCE organizations_id_seq RESTART WITH 1;
      ALTER SEQUENCE users_id_seq RESTART WITH 1;
      ALTER SEQUENCE organization_users_id_seq RESTART WITH 1;
      ALTER SEQUENCE organization_user_role_history_id_seq RESTART WITH 1;
      ALTER SEQUENCE user_auths_id_seq RESTART WITH 1;
      ALTER SEQUENCE events_id_seq RESTART WITH 1;
      ALTER SEQUENCE event_ticket_allocations_id_seq RESTART WITH 1;
      ALTER SEQUENCE tickets_id_seq RESTART WITH 1;
      ALTER SEQUENCE ticket_logs_id_seq RESTART WITH 1;
      ALTER SEQUENCE checkin_logs_id_seq RESTART WITH 1;
      ALTER SEQUENCE ticket_allocation_logs_id_seq RESTART WITH 1;
    `);

    // 外部キー制約を再度有効化
    await db.execute(sql`SET session_replication_role = 'origin';`);

    console.log('既存データの削除とシーケンスのリセットが完了しました');

    // 1. 組織データの挿入
    console.log('組織データを挿入中...');
    const [organization] = await db
      .insert(schema.organizations)
      .values({
        name: 'サンプル組織',
        description: 'これはサンプル組織の説明です。',
      })
      .returning();
    console.log(`組織「${organization.name}」を作成しました (ID: ${organization.id})`);

    // 2. ユーザーデータの挿入
    console.log('ユーザーデータを挿入中...');
    const usersData = [
      {
        name: '管理者ユーザー',
        email: 'admin@example.com',
        auth_id: '00000000-0000-0000-0000-000000000001',
      },
      {
        name: '運営者ユーザー1',
        email: 'operator1@example.com',
        auth_id: '00000000-0000-0000-0000-000000000002',
      },
      {
        name: '運営ユーザー2',
        email: 'operator1@example.com',
        auth_id: '00000000-0000-0000-0000-000000000003',
      },
      {
        name: '一般ユーザー1',
        email: 'user1@example.com',
        auth_id: '00000000-0000-0000-0000-000000000004',
      },
      {
        name: '一般ユーザー2',
        email: 'user2@example.com',
        auth_id: '00000000-0000-0000-0000-000000000005',
      },
      {
        name: 'nextmerge',
        email: 'office@nextmerge.net',
        auth_id: 'eb2de865-2c60-4d31-8578-aca3211e132d',
      }
    ];

    const users = await Promise.all(
      usersData.map(async (userData) => {
        const [user] = await db.insert(schema.users).values(userData).returning();
        console.log(`ユーザー「${user.name}」を作成しました (ID: ${user.id})`);
        return user;
      })
    );

    // 3. 組織ユーザーの関連付け
    console.log('組織ユーザーデータを挿入中...');
    const orgUsersData = [
      {
        organization_id: organization.id,
        user_id: users[0].id,
        role: 'admin',
      },
      {
        organization_id: organization.id,
        user_id: users[1].id,
        role: 'operator',
      },
      {
        organization_id: organization.id,
        user_id: users[2].id,
        role: 'operator',
      },
      {
        organization_id: organization.id,
        user_id: users[5].id,
        role: 'admin',
      }
    ];

    const orgUsers = await Promise.all(
      orgUsersData.map(async (orgUserData) => {
        const [orgUser] = await db
          .insert(schema.organizationUsers)
          .values(orgUserData)
          .returning();
        console.log(
          `組織ユーザー関連付けを作成しました (ID: ${orgUser.id}, Role: ${orgUser.role})`
        );
        return orgUser;
      })
    );

    // 4. ユーザー認証情報の挿入
    console.log('ユーザー認証情報を挿入中...');
    const userAuthsData = [
      {
        user_id: users[0].id,
        provider: schema.authProvider.enumValues[0], // 'google'
        provider_identifier: 'google_123456',
        profile: {
          email: 'admin@example.com',
          display_name: '管理者ユーザー',
          picture: 'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358071/avatar-40-02_upqrxi.jpg',
        },
      },
      {
        user_id: users[1].id,
        provider: schema.authProvider.enumValues[0], // 'google'
        provider_identifier: 'google_234567',
        profile: {
          email: 'operator@example.com',
          display_name: '運営者ユーザー',
          picture: 'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358073/avatar-40-01_ij9v7j.jpg',
        },
      },
      {
        user_id: users[2].id,
        provider: schema.authProvider.enumValues[1], // 'line'
        provider_identifier: 'line_345678',
        profile: {
          email: 'user1@example.com',
          display_name: '一般ユーザー1',
          picture: 'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358072/avatar-40-03_dkeufx.jpg',
        },
      },
    ];

    await Promise.all(
      userAuthsData.map(async (authData) => {
        const [auth] = await db.insert(schema.userAuths).values(authData).returning();
        console.log(
          `ユーザー認証情報を作成しました (ID: ${auth.id}, Provider: ${auth.provider})`
        );
        return auth;
      })
    );

    // 5. 役割変更履歴の挿入
    console.log('役割変更履歴を挿入中...');
    const roleHistoryData = {
      organization_user_id: orgUsers[2].id,
      old_role: 'operator',
      new_role: 'user',
      changed_by: orgUsers[0].id,
      reason: '役割の変更が必要になりました',
      changed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1週間前
    };

    const [roleHistory] = await db
      .insert(schema.organizationUserRoleHistory)
      .values(roleHistoryData)
      .returning();
    console.log(`役割変更履歴を作成しました (ID: ${roleHistory.id})`);

    // 6. イベントデータの挿入
    console.log('イベントデータを挿入中...');
    const now = new Date();
    const eventsData = [
      {
        organization_id: organization.id,
        name: '春のコンサート',
        description: '春の訪れを祝う音楽イベントです。',
        image_url: 'https://xcvpidhjqomgwabolkeh.supabase.co/storage/v1/object/public/event-images/4159da6f-0741-407f-820a-37487d3883cf.jpg',
        location: '東京都渋谷区代々木1-1-1 音楽ホール',
        start_datetime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2週間後
        end_datetime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3時間後
        ticket_price: 1500, // 数値として指定
        capacity: 100,
        is_published: true,
        created_by: orgUsers[0].id,
      },
      {
        organization_id: organization.id,
        name: '夏祭り',
        description: '毎年恒例の夏祭りイベントです。',
        image_url: 'https://xcvpidhjqomgwabolkeh.supabase.co/storage/v1/object/public/event-images/4159da6f-0741-407f-820a-37487d3883cf.jpg',
        location: '東京都新宿区新宿3-1-1 中央公園',
        start_datetime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60日後
        end_datetime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8時間後
        ticket_price: 2000, // 数値として指定
        capacity: 200,
        is_published: true,
        created_by: orgUsers[0].id,
      },
      {
        organization_id: organization.id,
        name: '秋の展示会',
        description: '芸術作品の展示会です。',
        image_url: 'https://xcvpidhjqomgwabolkeh.supabase.co/storage/v1/object/public/event-images/4159da6f-0741-407f-820a-37487d3883cf.jpg',
        location: '東京都港区六本木6-1-1 アートギャラリー',
        start_datetime: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90日後
        end_datetime: new Date(now.getTime() + 95 * 24 * 60 * 60 * 1000), // 5日間
        ticket_price: 1000, // 数値として指定
        capacity: 150,
        is_published: false, // 未公開
        created_by: orgUsers[1].id,
      },
    ];

    const events = await Promise.all(
      eventsData.map(async (eventData) => {
        const [event] = await db.insert(schema.events).values(eventData).returning();
        console.log(`イベント「${event.name}」を作成しました (ID: ${event.id})`);
        return event;
      })
    );

    // 7. チケット割り当てデータの挿入
    console.log('チケット割り当てデータを挿入中...');
    const allocationsData = [
      {
        event_id: events[0].id,
        organization_user_id: orgUsers[0].id,
        allocation_quota: 10,
        remaining_quota: 5,
        created_by: orgUsers[0].id,
      },
      {
        event_id: events[0].id,
        organization_user_id: orgUsers[1].id,
        allocation_quota: 8,
        remaining_quota: 8,
        created_by: orgUsers[0].id,
      },
      {
        event_id: events[1].id,
        organization_user_id: orgUsers[0].id,
        allocation_quota: 15,
        remaining_quota: 15,
        created_by: orgUsers[0].id,
      },
    ];

    const allocations = await Promise.all(
      allocationsData.map(async (allocData) => {
        const [alloc] = await db
          .insert(schema.eventTicketAllocations)
          .values(allocData)
          .returning();
        console.log(
          `チケット割り当てを作成しました (ID: ${alloc.id}, 割当数: ${alloc.allocation_quota})`
        );
        return alloc;
      })
    );

    // 8. チケットデータの挿入
    console.log('チケットデータを挿入中...');
    const ticketsData = [
      {
        event_id: events[0].id,
        owner_user_id: users[2].id,
        ticket_type: 'purchased',
        status: 'active',
        qr_code_data: `ticket-${Date.now()}-1`,
      },
      {
        event_id: events[0].id,
        owner_user_id: users[3].id,
        ticket_type: 'purchased',
        status: 'active',
        qr_code_data: `ticket-${Date.now()}-2`,
      },
      {
        event_id: events[0].id,
        owner_user_id: users[4].id,
        ticket_type: 'guest',
        issued_by: allocations[0].id,
        status: 'active',
        qr_code_data: `ticket-${Date.now()}-3`,
      },
      {
        event_id: events[1].id,
        owner_user_id: users[2].id,
        ticket_type: 'purchased',
        status: 'active',
        qr_code_data: `ticket-${Date.now()}-4`,
      },
    ];

    const tickets = await Promise.all(
      ticketsData.map(async (ticketData) => {
        const [ticket] = await db.insert(schema.tickets).values(ticketData).returning();
        console.log(
          `チケットを作成しました (ID: ${ticket.id}, タイプ: ${ticket.ticket_type})`
        );
        return ticket;
      })
    );

    // 9. チケット操作履歴の挿入
    console.log('チケット操作履歴を挿入中...');
    const ticketLogsData = [
      {
        ticket_id: tickets[0].id,
        action_type: 'created',
        new_owner_user_id: users[2].id,
        changed_by: orgUsers[0].id,
        reason: '購入',
      },
      {
        ticket_id: tickets[2].id,
        action_type: 'created',
        new_owner_user_id: users[4].id,
        changed_by: orgUsers[0].id,
        allocation_id: allocations[0].id,
        reason: 'ゲスト招待',
      },
    ];

    await Promise.all(
      ticketLogsData.map(async (logData) => {
        const [log] = await db.insert(schema.ticketLogs).values(logData).returning();
        console.log(`チケット操作履歴を作成しました (ID: ${log.id})`);
        return log;
      })
    );

    // 10. チェックインログの挿入
    console.log('チェックインログを挿入中...');
    const checkinLogsData = {
      ticket_id: tickets[0].id,
      scanned_by: orgUsers[1].id,
      additional_info: {
        location: 'エントランス1',
        device_id: 'scanner-001',
      },
    };

    const [checkinLog] = await db
      .insert(schema.checkinLogs)
      .values(checkinLogsData)
      .returning();
    console.log(`チェックインログを作成しました (ID: ${checkinLog.id})`);

    // 11. チケット割り当て履歴の挿入
    console.log('チケット割り当て履歴を挿入中...');
    const allocationLogsData = {
      allocation_id: allocations[0].id,
      old_quota: 5,
      new_quota: 10,
      action_type: 'increase',
      changed_by: orgUsers[0].id,
      reason: '追加割り当て',
    };

    const [allocationLog] = await db
      .insert(schema.ticketAllocationLogs)
      .values(allocationLogsData)
      .returning();
    console.log(`チケット割り当て履歴を作成しました (ID: ${allocationLog.id})`);

    console.log('シードデータの挿入が完了しました！');
  } catch (error) {
    console.error('シードデータの挿入中にエラーが発生しました:', error);
  } finally {
    // 接続を閉じる
    process.exit(0);
  }
}

// スクリプトを実行
seed();
