import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getEvent } from "@/actions/admin/events";
import { events } from "@/db/schema";
import EventEditClientPage from "./client";

// イベントの型定義
type Event = typeof events.$inferSelect;

export default async function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = parseInt(id);
  let event: Event | null = null;
  let error: string | null = null;

  try {
    const response = await getEvent(eventId);
    if (response.success && response.data) {
      event = response.data;
    } else {
      error = response.message || "イベント情報の取得に失敗しました";
    }
  } catch (err) {
    console.error("イベント詳細の取得に失敗しました", err);
    error = "イベント情報の取得中にエラーが発生しました";
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border bg-background p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">エラー</h2>
            <p className="text-muted-foreground">{error || "イベント情報を取得できませんでした"}</p>
          </div>
          <div className="mt-4">
            <Link href="/admin/event">
              <Button>イベント一覧に戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <EventEditClientPage event={event} />
  )
}
