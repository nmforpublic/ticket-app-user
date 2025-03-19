'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getEventGuestTickets } from "@/actions/admin/tickets";
import { GuestTicketWithUser } from "@/types/event";

// ダミーデータ（新規作成時や取得失敗時に使用）
export const items = [
  {
    id: "1",
    name: "Alex Thompson",
    username: "@alexthompson",
    image:
      "https://res.cloudinary.com/dlzlfasou/image/upload/v1736358071/avatar-40-02_upqrxi.jpg",
    balance: "1",
  },
  {
    id: "2",
    name: "Sarah Chen",
    username: "@sarahchen",
    image:
      "https://res.cloudinary.com/dlzlfasou/image/upload/v1736358073/avatar-40-01_ij9v7j.jpg",
    balance: "2",
  },
  {
    id: "4",
    name: "Maria Garcia",
    username: "@mariagarcia",
    image:
      "https://res.cloudinary.com/dlzlfasou/image/upload/v1736358072/avatar-40-03_dkeufx.jpg",
    balance: "10",
  },
  {
    id: "5",
    name: "David Kim",
    username: "@davidkim",
    image:
      "https://res.cloudinary.com/dlzlfasou/image/upload/v1736358070/avatar-40-05_cmz0mg.jpg",
    balance: "20",
  },
];

interface GuestTableProps {
  eventId?: number; // 編集時のみ指定
}

export default function GuestTable({ eventId }: GuestTableProps = {}) {
  const [guests, setGuests] = useState<GuestTicketWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchGuests = async () => {
      // 新規作成時はスキップ
      if (!eventId) {
        setGuests([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await getEventGuestTickets(eventId);
        if (response.success && response.data) {
          setGuests(response.data);
        }
      } catch (error) {
        console.error("ゲストデータの取得に失敗しました", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuests();
  }, [eventId]);
  
  // 表示するデータ（APIから取得したデータがあればそれを使用、なければダミーデータ）
  const displayItems = eventId ? (guests.length > 0 ? guests : []) : items;
  
  return (
    <div>
      {loading && <div className="text-center py-4">読み込み中...</div>}
      
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>ユーザー</TableHead>
            <TableHead className="text-right">招待者</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                {eventId ? "ゲストが登録されていません" : "ゲストが登録されるとここに表示されます"}
              </TableCell>
            </TableRow>
          ) : displayItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    className="rounded-full"
                    src={item.image}
                    width={40}
                    height={40}
                    alt={item.name}
                  />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <span className="text-muted-foreground mt-0.5 text-xs">
                      {item.username}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      className="size-auto overflow-hidden rounded-full bg-transparent p-0 hover:bg-transparent"
                      aria-label="My profile"
                      asChild
                    >
                      <a href="#">
                        <img
                          src={item.image}
                          width={30}
                          height={30}
                          alt="Avatar"
                        />
                      </a>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-[240px]">
                    <div className="flex items-start gap-3">
                      <img
                        className="shrink-0 rounded-full"
                        src={item.image}
                        width={40}
                        height={40}
                        alt="Avatar"
                      />
                      <div className="space-y-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {item.username}
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
