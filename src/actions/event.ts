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
import { createClient } from "@/utils/supabase/server";
import { organizationUsers, eventTicketAllocations, users } from "@/db/schema";
import { and, inArray } from "drizzle-orm";
import { getUserAuthsBySupabaseId } from './user';

type Event = typeof events.$inferSelect;
type EventTicketAllocation = typeof eventTicketAllocations.$inferSelect;

type EventsWithAllocationsResponse = {
  events: Event[];
  allocations: EventTicketAllocation[];
};

/**
 * 自分にチケット割り当てがあるイベントを取得する
 * @param organizationId 組織ID
 * @returns イベントとチケット割り当ての配列を含むレスポンス
 */
export async function getEventsWithTicketAllocation(
  organizationId: number
): Promise<ActionResponse<EventsWithAllocationsResponse>> {
  try {
    // Supabaseクライアントを作成して認証情報を取得
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse(
        "認証が必要です",
        createError(ErrorCode.UNAUTHORIZED, "ユーザーが認証されていません")
      );
    }

    // ユーザー情報をuser.tsの関数を使って取得
    const userResponse = await getUserAuthsBySupabaseId(user.id);
    
    if (!userResponse.success || !userResponse.data) {
      return createErrorResponse(
        "ユーザーが見つかりません",
        createError(ErrorCode.NOT_FOUND, "ユーザーがデータベースに存在しません")
      );
    }
    
    const userId = userResponse.data.user_id;

    // 指定された組織IDに所属しているか確認
    const orgUser = await db.query.organizationUsers.findFirst({
      where: and(
        eq(organizationUsers.user_id, userId),
        eq(organizationUsers.organization_id, organizationId)
      )
    });

    if (!orgUser) {
      return createErrorResponse(
        "指定された組織に所属していません",
        createError(ErrorCode.FORBIDDEN, "この組織へのアクセス権がありません")
      );
    }
    
    // チケット割り当てからイベントIDを取得
    const allocations = await db.query.eventTicketAllocations.findMany({
      where: eq(eventTicketAllocations.organization_user_id, orgUser.id)
    });

    if (allocations.length === 0) {
      return createSuccessResponse("チケット割り当てがあるイベントはありません", {
        events: [],
        allocations: []
      });
    }

    // 割り当てのあるイベントIDを抽出
    const eventIds = allocations.map(allocation => allocation.event_id);

    // イベント情報を取得
    const eventsList = await db.query.events.findMany({
      where: inArray(events.id, eventIds)
    });

    return createSuccessResponse(
      "チケット割り当てがあるイベントを取得しました",
      {
        events: eventsList,
        allocations: allocations
      }
    );
  } catch (error) {
    console.error("イベント取得エラー:", error);
    return createErrorResponse(
      "イベント取得中にエラーが発生しました",
      createError(ErrorCode.DATABASE_ERROR, "データベースエラー", error)
    );
  }
}

