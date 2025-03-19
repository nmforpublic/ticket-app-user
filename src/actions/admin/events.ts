"use server";
import { db } from "@/db/drizzle";
import { events } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "@/actions/error";
import { createClient } from "@/lib/supabase/server";
import { createEventTicketAllocations, updateEventTicketAllocations } from "./eventTicketAllocations";

type Event = typeof events.$inferSelect;

type CreateEventInput = {
  organization_id: number;
  name: string;
  description?: string;
  image_url?: string;
  location?: string;
  start_datetime: Date;
  end_datetime: Date;
  ticket_price: number;
  capacity: number | null;
  is_published?: boolean;
  selectedMembers?: { id: string, guestLimit: number }[];
};

type UpdateEventInput = Partial<CreateEventInput> & {
  id: number;
};

// イベントの一覧取得
export const getEventsByOrganizationId = async (organization_id?: number): Promise<ActionResponse<Event[]>> => {
  try {
    let data: Event[];
    
    if (organization_id) {
      data = await db.select().from(events).where(eq(events.organization_id, organization_id)).orderBy(events.start_datetime);
    } else {
      data = await db.select().from(events).orderBy(events.start_datetime);
    }
    
    return createSuccessResponse<Event[]>('イベント一覧を取得しました', data);
  } catch (error) {
    console.error('イベント一覧取得エラー:', error);
    return createErrorResponse(
      'イベント一覧の取得に失敗しました',
      createError(
        ErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};

// イベントの詳細取得
export const getEvent = async (id: number): Promise<ActionResponse<Event>> => {
  try {
    const data = await db.select().from(events).where(eq(events.id, id)).limit(1);
    
    if (data.length === 0) {
      return createErrorResponse(
        'イベントが見つかりません',
        createError(
          ErrorCode.NOT_FOUND,
          'イベントが存在しないか、削除された可能性があります'
        )
      );
    }
    
    return createSuccessResponse<Event>('イベント詳細を取得しました', data[0]);
  } catch (error) {
    console.error('イベント詳細取得エラー:', error);
    return createErrorResponse(
      'イベント詳細の取得に失敗しました',
      createError(
        ErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};

// イベントの作成
export const createEvent = async (
  eventData: CreateEventInput
): Promise<ActionResponse<{ eventId: number }>> => {
  console.log("createEvent アクション開始", eventData);
  try {


    console.log("バリデーションチェック開始");
    
    // 組織IDの検証
    if (!eventData.organization_id || typeof eventData.organization_id !== 'number') {
      return createErrorResponse(
        '組織IDは必須です',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効な組織IDを指定してください'
        )
      );
    }

    // イベント名の検証
    if (!eventData.name || eventData.name.trim() === '') {
      return createErrorResponse(
        'イベント名は必須です',
        createError(
          ErrorCode.VALIDATION_ERROR,
          'イベント名を入力してください'
        )
      );
    }

    // 日時の検証
    if (!eventData.start_datetime || !eventData.end_datetime) {
      return createErrorResponse(
        '開始日時と終了日時は必須です',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '開始日時と終了日時を入力してください'
        )
      );
    }

    // 開始日時と終了日時の整合性チェック
    const startDate = new Date(eventData.start_datetime);
    const endDate = new Date(eventData.end_datetime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return createErrorResponse(
        '日時の形式が不正です',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効な日時を入力してください'
        )
      );
    }

    if (startDate >= endDate) {
      return createErrorResponse(
        '終了日時は開始日時より後である必要があります',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '開始日時と終了日時を正しく設定してください'
        )
      );
    }

    // チケット価格と定員の検証
    if (typeof eventData.ticket_price !== 'number' || eventData.ticket_price < 0) {
      return createErrorResponse(
        'チケット価格は0以上の数値である必要があります',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効なチケット価格を入力してください'
        )
      );
    }

    // 定員の検証（nullの場合は無制限として許可）
    if (eventData.capacity !== null && (typeof eventData.capacity !== 'number' || eventData.capacity <= 0)) {
      return createErrorResponse(
        '定員は1以上の数値である必要があります',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効な定員を入力してください'
        )
      );
    }
    
    console.log("バリデーションチェック完了");
    
    // デバッグ用：ユーザー情報と組織のユーザー権限取得をバイパス
    console.log("ユーザー情報と組織のユーザー権限取得をバイパス");
    const orgUser = { id: 1 }; // ダミーの組織ユーザーID

    // イベントの登録
    console.log("イベント登録開始");
    const result = await db.insert(events).values({
      organization_id: eventData.organization_id,
      name: eventData.name.trim(),
      description: eventData.description?.trim() || null,
      image_url: eventData.image_url?.trim() || null,
      location: eventData.location?.trim() || null,
      start_datetime: startDate,
      end_datetime: endDate,
      ticket_price: eventData.ticket_price,
      capacity: eventData.capacity,
      is_published: eventData.is_published ?? false,
      created_by: orgUser.id,
      created_at: new Date(),
      updated_at: new Date()
    }).returning({ id: events.id });
    console.log("イベント登録成功", result);
    
    const createdEvent = result[0];
    
    // 選択された運営者のチケット割り当て情報を保存
    if (eventData.selectedMembers && eventData.selectedMembers.length > 0) {
      console.log("チケット割り当て情報の保存開始");
      const allocations = eventData.selectedMembers
        .filter(member => member.guestLimit > 0)
        .map(member => ({
          organizationUserId: parseInt(member.id),
          quota: member.guestLimit
        }));
      
      if (allocations.length > 0) {
        try {
          await createEventTicketAllocations(
            createdEvent.id,
            allocations,
            orgUser.id
          );
          console.log("チケット割り当て情報の保存成功");
        } catch (allocError) {
          console.error("チケット割り当て情報の保存エラー:", allocError);
        }
      }
    }
    
    revalidatePath(`/events/${createdEvent.id}`);
    revalidatePath(`/organizations/${eventData.organization_id}/events`);
    
    return createSuccessResponse(
      'イベントを作成しました',
      { eventId: createdEvent.id }
    );
  } catch (error) {
    console.error('イベント作成エラー:', error);
    return createErrorResponse(
      'イベントの作成に失敗しました',
      createError(
        ErrorCode.OPERATION_FAILED,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};

// イベントの更新
export const updateEvent = async (
  eventData: UpdateEventInput
): Promise<ActionResponse> => {
  try {

    // イベントIDの検証
    if (!eventData.id || typeof eventData.id !== 'number') {
      return createErrorResponse(
        'イベントIDは必須です',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効なイベントIDを指定してください'
        )
      );
    }

    // 現在のイベント情報を取得
    const existingEventResult = await getEvent(eventData.id);
    if (!existingEventResult.success || !existingEventResult.data) {
      return createErrorResponse(
        'イベントが見つかりません',
        createError(
          ErrorCode.NOT_FOUND,
          'イベントが存在しないか、削除された可能性があります'
        )
      );
    }
    const existingEvent = existingEventResult.data;

    // 現在のユーザー情報を取得
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse(
        'ユーザー情報の取得に失敗しました',
        createError(
          ErrorCode.UNAUTHORIZED,
          'ログインが必要です'
        )
      );
    }

    // ユーザーIDの取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('ユーザー情報取得エラー:', userError);
      return createErrorResponse(
        'ユーザー情報の取得に失敗しました',
        createError(
          ErrorCode.DATABASE_ERROR,
          'ユーザー情報の取得に失敗しました',
          userError
        )
      );
    }

    // 組織のユーザー権限取得
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select('id, role')
      .eq('user_id', userData.id)
      .eq('organization_id', existingEvent.organization_id)
      .single();

    if (orgUserError || !orgUser) {
      console.error('組織ユーザー情報取得エラー:', orgUserError);
      return createErrorResponse(
        '組織への権限がありません',
        createError(
          ErrorCode.FORBIDDEN,
          'この組織に対する操作権限がありません',
          orgUserError
        )
      );
    }

    // 日時のバリデーション（更新時）
    let startDate = existingEvent.start_datetime;
    let endDate = existingEvent.end_datetime;

    if (eventData.start_datetime) {
      startDate = new Date(eventData.start_datetime);
      if (isNaN(startDate.getTime())) {
        return createErrorResponse(
          '開始日時の形式が不正です',
          createError(
            ErrorCode.VALIDATION_ERROR,
            '有効な開始日時を入力してください'
          )
        );
      }
    }

    if (eventData.end_datetime) {
      endDate = new Date(eventData.end_datetime);
      if (isNaN(endDate.getTime())) {
        return createErrorResponse(
          '終了日時の形式が不正です',
          createError(
            ErrorCode.VALIDATION_ERROR,
            '有効な終了日時を入力してください'
          )
        );
      }
    }

    if (startDate >= endDate) {
      return createErrorResponse(
        '終了日時は開始日時より後である必要があります',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '開始日時と終了日時を正しく設定してください'
        )
      );
    }

    // チケット価格と定員のバリデーション（更新時）
    if (eventData.ticket_price !== undefined && (typeof eventData.ticket_price !== 'number' || eventData.ticket_price < 0)) {
      return createErrorResponse(
        'チケット価格は0以上の数値である必要があります',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効なチケット価格を入力してください'
        )
      );
    }

    // 定員の検証（nullの場合は無制限として許可）
    if (eventData.capacity !== undefined && eventData.capacity !== null && (typeof eventData.capacity !== 'number' || eventData.capacity <= 0)) {
      return createErrorResponse(
        '定員は1以上の数値である必要があります',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '有効な定員を入力してください'
        )
      );
    }

    // 更新対象の値を設定
    const updateObj: Partial<typeof events.$inferInsert> = {
      updated_at: new Date()
    };

    if (eventData.name !== undefined && eventData.name.trim() !== '') {
      updateObj.name = eventData.name.trim();
    }

    if (eventData.description !== undefined) {
      updateObj.description = eventData.description.trim() || null;
    }

    if (eventData.image_url !== undefined) {
      updateObj.image_url = eventData.image_url.trim() || null;
    }

    if (eventData.location !== undefined) {
      updateObj.location = eventData.location.trim() || null;
    }

    if (eventData.start_datetime) {
      updateObj.start_datetime = startDate;
    }

    if (eventData.end_datetime) {
      updateObj.end_datetime = endDate;
    }

    if (eventData.ticket_price !== undefined) {
      updateObj.ticket_price = eventData.ticket_price;
    }

    if (eventData.capacity !== undefined) {
      updateObj.capacity = eventData.capacity;
    }

    if (eventData.is_published !== undefined) {
      updateObj.is_published = eventData.is_published;
    }

    // イベントの更新
    await db.update(events)
      .set(updateObj)
      .where(eq(events.id, eventData.id));
    
    // 選択された運営者のチケット割り当て情報を更新
    if (eventData.selectedMembers && eventData.selectedMembers.length > 0) {
      const allocations = eventData.selectedMembers
        .filter(member => member.guestLimit > 0)
        .map(member => ({
          organizationUserId: parseInt(member.id),
          quota: member.guestLimit
        }));
      
      if (allocations.length > 0) {
        await updateEventTicketAllocations(
          eventData.id,
          allocations,
          orgUser.id
        );
      }
    }
    
    revalidatePath(`/events/${eventData.id}`);
    revalidatePath(`/organizations/${existingEvent.organization_id}/events`);
    
    return createSuccessResponse('イベントを更新しました');
  } catch (error) {
    console.error('イベント更新エラー:', error);
    return createErrorResponse(
      'イベントの更新に失敗しました',
      createError(
        ErrorCode.OPERATION_FAILED,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};
