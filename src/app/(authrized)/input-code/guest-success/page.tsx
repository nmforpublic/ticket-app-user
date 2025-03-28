import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Ticket } from "lucide-react";
import Link from "next/link";

export default async function GuestInvitationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ allocationId?: string; eventId?: string; ticketCount?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const allocationId = resolvedSearchParams.allocationId;
  const eventId = resolvedSearchParams.eventId;
  const ticketCount = resolvedSearchParams.ticketCount || "1";

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Ticket className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-xl">チケット発行完了</CardTitle>
          <CardDescription>
            ゲストとして{ticketCount}枚のチケットが発行されました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-gray-500 mb-4">
            {allocationId && (
              <p>アロケーションID: {allocationId}</p>
            )}
            {eventId && (
              <p>イベントID: {eventId}</p>
            )}
            <p className="mt-2">マイページからチケットを確認できます</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/" className="w-full mt-2">
            <Button variant='outline' className="w-full h-full font-bold">
              ホームに戻る
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
