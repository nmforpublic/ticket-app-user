"use server";

import { getEventsByOrganizationId } from "@/actions/admin/events";
import Image from "next/image";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge";
import { MapPin } from 'lucide-react';
import { JapaneseYen, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";
import { MoveUpRight } from 'lucide-react';
import Link from "next/link";

export default async function EventListPage() {
  // TODO: organizationIdを取得するロジックを追加
  const organizationId = 1;

  const eventsResponse = await getEventsByOrganizationId(organizationId);

  if (!eventsResponse.success) {
    return <div>イベントの取得に失敗しました</div>;
  }

  const events = eventsResponse.data || [];
  console.log(events);

  if (events.length === 0) {
    return <div className="text-center py-8 text-gray-500">イベントがありません</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 overflow-auto flex flex-col gap-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          {/* 日時 */}
          <div className="w-full text-sm font-medium tracking-wider flex justify-between items-center">
              {format(new Date(event.start_datetime), "yyyy/MM/dd HH:mm")}
              <Badge variant="outline" className="gap-1.5">
                <span 
                  className={`size-1.5 rounded-full ${event.is_published ? 'bg-emerald-500' : 'bg-gray-400'}`} 
                  aria-hidden="true"
                ></span>
                {event.is_published ? '公開' : '非公開'}
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
              <div className="text-sm text-gray-600 flex flex-row items-center gap-1"><MapPin size={14} className="mr-1"/>{event.location || '場所未定'}</div>
              <div className="text-sm text-gray-600 flex flex-row items-center gap-1"><JapaneseYen size={14} className="mr-1"/>{event.ticket_price ? `${event.ticket_price.toLocaleString()}円` : '無料'}</div>
              <div className="text-sm text-gray-600 flex flex-row items-center gap-1"><Users size={14} className="mr-1"/>{event.capacity ? `${event.capacity.toLocaleString()}名` : '無制限'}</div>
            </div>
            {/* 場所 */}

          </div>

          <Separator />


          <div className="w-full flex flex-row items-center gap-4">
          <Link href={`/admin/event/edit/${event.id}`} className="flex-1">
            <Button className="flex-1 font-bold w-full">
              <Pen className="-ms-1 opacity-60" size={16} />
              編集
            </Button>
            </Link>
            <Link href={`/admin/event/${event.id}`} className="flex-1">
            <Button variant="outline" className="w-full font-bold text-sm">
              <MoveUpRight className="-ms-1 opacity-60" size={16} />
              詳細
            </Button>
            </Link>

          </div>
        </div>
      ))}
    </div>
  );
}
