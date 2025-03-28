import { createClient } from "@/utils/supabase/server";
import { getUserAuthsBySupabaseId } from "@/actions/user";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import CopyButton from "./copy-button";
import { UserRoundIcon } from "lucide-react";
import { getUserTickets } from "@/actions/ticket";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  // console.log("data", data);
  // console.log("error", error);

  const userData = await getUserAuthsBySupabaseId(data.user?.id as string);
  // console.log("me", userData);

  // ユーザーIDを使ってチケット情報を取得
  const userTickets = userData?.data?.user_id
    ? await getUserTickets(userData.data.user_id)
    : null;

  // チケット情報をコンソールに出力（デバッグ用）
  if (
    userTickets?.success &&
    userTickets.data?.tickets &&
    userTickets.data.tickets.length > 0
  ) {
    console.log("ticket", userTickets.data.tickets[0]);
    console.log("ticket-event", userTickets.data.tickets[0].event);
    console.log("ticket-ticket", userTickets.data.tickets[0].tickets);
    console.log("ticket-issuer", userTickets.data.tickets[0].issued_by_user);
  }

  return (
    <div className="flex flex-col">
      {/* Fixed top section with gradient background */}
      <div className="bg-gradient-to-bl from-[#ffe4e6]  to-[#ccfbf1] rounded-bl-lg rounded-br-lg">
        <div className="flex flex-col items-center p-6 h-full">
          {/* User Avatar */}
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage
              src={
                userData?.data?.profile &&
                typeof userData.data.profile === "object" &&
                "picture_url" in userData.data.profile
                  ? String(userData.data.profile.picture_url)
                  : ""
              }
              alt="User avatar"
            />
            <AvatarFallback>
              <UserRoundIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
            </AvatarFallback>
          </Avatar>

          {/* User info */}
          <p className="font-bold">
            {userData?.data?.profile &&
            typeof userData.data.profile === "object" &&
            "display_name" in userData.data.profile
              ? String(userData.data.profile.display_name)
              : ""}{" "}
          </p>
          <div className="flex items-center justify-between flex-row gap-2 mb-6">
            <p className="text-sm text-gray-500">
              アプリID:{" "}
              {data.user?.id
                ? `${data.user.id.slice(0, 5)}...${data.user.id.slice(-5)}`
                : ""}
            </p>
            <CopyButton textToCopy={data.user?.id || ""} />
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg w-48 h-48 flex items-center justify-center">
            <div className="w-40 h-40 bg-white">
              {/* Placeholder QR code */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="10" y="10" width="20" height="20" fill="black" />
                <rect x="30" y="10" width="20" height="20" fill="black" />
                <rect x="50" y="10" width="20" height="20" fill="black" />
                <rect x="10" y="30" width="20" height="20" fill="black" />
                <rect x="50" y="30" width="20" height="20" fill="black" />
                <rect x="70" y="30" width="20" height="20" fill="black" />
                <rect x="10" y="50" width="20" height="20" fill="black" />
                <rect x="30" y="50" width="20" height="20" fill="black" />
                <rect x="50" y="50" width="20" height="20" fill="black" />
                <rect x="10" y="70" width="20" height="20" fill="black" />
                <rect x="70" y="70" width="20" height="20" fill="black" />
              </svg>
            </div>
          </div>

          <Button className="w-full mt-6 py-6">QRコード再生成</Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 bg-white overflow-y-auto p-4 py-6">
        <Tabs defaultValue="tab-1" className="items-center w-full">
          <TabsList className="w-full">
            <TabsTrigger value="tab-1" className="font-bold w-full">
              保有中
            </TabsTrigger>
            <TabsTrigger value="tab-2" className="font-bold w-full">
              使用済み
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1" className="w-full mt-4">
            {userTickets?.success &&
            userTickets.data?.tickets &&
            userTickets.data.tickets.length > 0 ? (
              <>
                {/* チケットを表示 */}
                {userTickets.data.tickets.map((groupedTicket) => (
                  <Card
                    key={`${groupedTicket.event_id}-${groupedTicket.ticket_type}`}
                    className="w-full mb-4 p-4 shadow-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-lg mr-4 bg-gradient-to-br from-pink-500 to-purple-600">
                        {groupedTicket.event.image_url && (
                          <Image
                            className="rounded-lg"
                            src={groupedTicket.event.image_url}
                            alt="eventPhoto"
                            width={64}
                            height={64}
                            priority
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {groupedTicket.event.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(groupedTicket.event.start_datetime)
                                .toISOString()
                                .slice(0, 10)}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            × {groupedTicket.amount}枚
                          </div>
                        </div>
                        {groupedTicket.issued_by_user && (
                          <div className="flex flex-row iterms-center justify-between mt-2">
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              招待者:{" "}
                              <span className="font-medium ml-2">
                                {groupedTicket.issued_by_user.profile &&
                                typeof groupedTicket.issued_by_user.profile ===
                                  "object" &&
                                "display_name" in
                                  groupedTicket.issued_by_user.profile
                                  ? String(
                                      groupedTicket.issued_by_user.profile
                                        .display_name
                                    )
                                  : ""}
                              </span>
                              <Avatar className="w-4 h-4 ml-1 inline-block">
                                <AvatarImage
                                  src={
                                    groupedTicket.issued_by_user.profile &&
                                    typeof groupedTicket.issued_by_user
                                      .profile === "object" &&
                                    "picture_url" in
                                      groupedTicket.issued_by_user.profile
                                      ? String(
                                          groupedTicket.issued_by_user.profile
                                            .picture_url
                                        )
                                      : ""
                                  }
                                />
                                <AvatarFallback>
                                  <div className="bg-purple-600 w-full h-full flex items-center justify-center text-[8px] text-white">
                                    {groupedTicket.issued_by_user.profile &&
                                    typeof groupedTicket.issued_by_user
                                      .profile === "object" &&
                                    "display_name" in
                                      groupedTicket.issued_by_user.profile
                                      ? String(
                                          groupedTicket.issued_by_user.profile
                                            .display_name
                                        ).charAt(0)
                                      : "?"}
                                  </div>
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-4">
                              {groupedTicket.ticket_type === "guest"
                                ? "ゲスト枠"
                                : "購入枠"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                チケットがありません
              </div>
            )}{" "}
          </TabsContent>
          <TabsContent value="tab-2" className="w-full">
            {/* <CreateCode /> */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
