import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen } from 'lucide-react';
import Link from "next/link";
import { getEvent } from "@/actions/admin/events";
import { events } from "@/db/schema";
import {
  Timeline,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";
import { MapPin } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import GuestTable from "../register/GuestTable";
import { getEventTicketOperators } from "@/actions/admin/eventTicketAllocations";
import { EventTicketOperator } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// イベントの型定義
type Event = typeof events.$inferSelect;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = parseInt(id);

  let event: Event | null = null;
  let error: string | null = null;
  let operators: EventTicketOperator[] | null = null;

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


  try {
    const response = await getEventTicketOperators(eventId);
    if (response.success && response.data) {
      operators = response.data;
    } else {
      error = response.message || "イベント情報の取得に失敗しました";
    }
  } catch (err) {
    console.error("イベント詳細の取得に失敗しました", err);
    error = "イベント情報の取得中にエラーが発生しました";
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
    <div className="container mx-auto px-4 py-8 overflow-auto space-y-8">
      {/* イベント画像 */}
      {event.image_url && (
        <div className="w-full flex justify-center mb-4">
          <div className="aspect-square w-full max-w-md overflow-hidden rounded-lg">
            <img
              className="h-full w-full object-cover"
              src={event.image_url}
              alt={event.name}
            />
          </div>
        </div>
      )}

      {/* イベント名 */}
      <div className="*:not-first:mt-2">
        <Label className="text-sm font-semibold text-gray-500">イベント名</Label>
        <p className="text-md font-bold">{event.name}</p>
      </div>

      <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">開始日</Label>
        <p className="text-md font-bold">{formatDate(event.start_datetime)}</p>
      </div>

      <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">終了日</Label>
        <p className="text-md font-bold">{formatDate(event.end_datetime)}</p>
      </div>

      <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">会場</Label>
        <p className="text-md font-bold">{event.location || "未設定"}</p>
      </div>


      <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">説明</Label>
        <p className="text-md font-bold">{event.description || "なし"}</p>
      </div>


      <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">チケット</Label>
        <p className="text-md font-bold">{event.ticket_price > 0 ? `${event.ticket_price.toLocaleString()}円` : "無料"}</p>
      </div>


      {/* 運営一覧 */}
      <div className="*:not-first:mt-2">
        <Label className="font-bold">運営者一覧</Label>
        {operators?.map((operator: EventTicketOperator) => (
        <Card
          key={operator.id}
          className="flex flex-row items-center justify-between border-b px-4 py-4"
        >
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Avatar className="shrink-0">
              <AvatarImage src={operator.image} alt={operator.name} />
              <AvatarFallback>{operator.name}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-bold truncate text-sm">{operator.name}</div>
              <div className="text-muted-foreground/80 truncate text-xs">
                {operator.username}
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-gray-500">残り{operator.remaining_quota}枚</div>
        </Card>
      ))}
      </div>

      {/* 定員 */}
      <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">定員</Label>
        <p className="text-md font-bold">{event.capacity && event.capacity > 0 ? `${event.capacity}人` : "無制限"}</p>
      </div>

      {/* 登録済みゲスト一覧 */}
      <div className="*:not-first:mt-2">
      <Label className="font-bold text-gray-500">登録済みゲスト一覧</Label>
        <GuestTable eventId={eventId} />
      </div>

      {/* 定員 */}
            <div className="*:not-first:mt-2">
        <Label className="font-bold text-gray-500">公開設定</Label>
        <p className="text-md font-bold">{event.is_published === true ? '公開' : '非公開'}</p>
      </div>

      {/* ボタン */}
      <div className="flex justify-between w-full mt-8 gap-2">
        <Link href="/admin/event/list" className="flex-1">
          <Button variant="outline" className="w-full font-bold">
            イベント一覧に戻る
          </Button>
        </Link>
        <Link href={`/admin/event/edit/${eventId}`} className="flex-1">
          <Button className="w-full font-bold">
            編集する
          </Button>
        </Link>
      </div>
    </div>
  );
}