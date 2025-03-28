"use server";

import { getEventsWithTicketAllocation } from "@/actions/event";
import Image from "next/image";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { JapaneseYen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { MoveUpRight } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { OctagonAlert } from 'lucide-react';

export default async function EventListPage() {
  // TODO: organizationIdを取得するロジックを追加
  const organizationId = 1;

  const eventsResponse = await getEventsWithTicketAllocation(organizationId);

  if (!eventsResponse.success) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-5 items-center justify-center py-10 mx-4">
        <OctagonAlert className="text-yellow-500" size={48} />
        <p>あなたが招待可能なイベントはありません</p>

      </div>
    );
  }

  const { events, allocations } = eventsResponse.data || {
    events: [],
    allocations: [],
  };
  console.log({ events, allocations });

  if (events.length === 0) {
    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-5 items-center justify-center py-10 mx-4">
          <OctagonAlert className="text-yellow-500" size={48} />
          <p>あなたが招待可能なイベントはありません</p>
  
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 overflow-auto flex flex-col gap-4">
      <Label className="font-bold text-base">
        あなたが招待可能なイベント一覧
      </Label>
      {events.map((event) => {
        // 各イベントに対応する割り当て情報を検索
        const allocation = allocations.find((a) => a.event_id === event.id);

        return (
          <div
            key={event.id}
            className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {/* 日時 */}
            <div className="w-full text-sm font-medium tracking-wider flex justify-between items-center">
              {format(new Date(event.start_datetime), "yyyy/MM/dd HH:mm")}
              <Badge variant="outline" className="gap-1.5">
                <span
                  className={`size-1.5 rounded-full ${
                    event.is_published ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                  aria-hidden="true"
                ></span>
                {event.is_published ? "公開" : "非公開"}
              </Badge>
            </div>

            <Separator />

            {/* 写真とイベント名 */}
            <div className="flex flex-row items-center justify-start gap-4 w-full">
              <div className="w-24 h-24 relative flex-shrink-0">
                {event.image_url && (
                  <Image
                    src={event.image_url}
                    alt={event.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                )}
              </div>
              {/* イベント名 */}
              <div className="flex flex-col gap-1">
                <div className="text-md font-bold">{event.name}</div>
                <div className="text-sm text-gray-600 flex flex-row items-center gap-1">
                  <MapPin size={14} className="mr-1" />
                  {event.location || "場所未定"}
                </div>
                <div className="text-sm text-gray-600 flex flex-row items-center gap-1">
                  <JapaneseYen size={14} className="mr-1" />
                  {event.ticket_price
                    ? `${event.ticket_price.toLocaleString()}円`
                    : "無料"}
                </div>
                <div className="text-sm text-gray-600 flex flex-row items-center gap-1">
                  <Users size={14} className="mr-1" />
                  {event.capacity
                    ? `${event.capacity.toLocaleString()}名`
                    : "無制限"}
                </div>
              </div>
            </div>

            <Separator />

            <div className="w-full flex flex-col items-center gap-4">
              {allocation && (
                <div
                  className={`text-base ${
                    allocation.remaining_quota <=
                    allocation.allocation_quota / 2
                      ? "text-destructive"
                      : "text-emerald-500"
                  }`}
                >
                  残り招待枠: {allocation.remaining_quota} /{" "}
                  {allocation.allocation_quota}
                </div>
              )}
              <Link
                href={`/guest/invite/${event.id}?alloId=${
                  allocation?.id || ""
                }&userorgId=${
                  allocation?.organization_user_id || ""
                }&remaining=${allocation?.remaining_quota || 0}`}
                className="w-full"
              >
                <Button
                  className="flex-1 font-bold w-full"
                  disabled={allocation?.remaining_quota === 0}
                >
                  <Send className="-ms-1 opacity-60" size={16} />
                  招待する
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
