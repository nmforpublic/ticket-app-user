import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { getEvent } from "@/actions/admin/events";

export default async function EventSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const eventId = resolvedSearchParams.id;
  let eventName = "";

  if (eventId) {
    try {
      const response = await getEvent(parseInt(eventId));
      if (response.success && response.data) {
        eventName = response.data.name;
      }
    } catch (error) {
      console.error("イベント詳細の取得に失敗しました", error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-xl">更新完了</CardTitle>
          <CardDescription>
            {eventName ? `「${eventName}」の更新が完了しました` : "イベントの登録が完了しました"}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Link href={eventId ? `/admin/event/${eventId}` : '/admin/event'} className="w-full">
            <Button className="w-full h-full font-bold">
              イベントを確認する
            </Button>
          </Link>
          <Link href="/admin/event/register" className="w-full">
          <Button variant='outline'className="w-full h-full font-bold">
              別のイベントを作成する
            </Button>
          </Link>
          <Link href="/admin" className="w-full mt-4">
          <Button variant='ghost'className="w-full h-full font-bold">
            ホームに戻る
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
