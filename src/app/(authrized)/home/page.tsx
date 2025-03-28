import { createClient } from "@/utils/supabase/server";
import { getUserAuthsBySupabaseId } from "@/actions/user";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import CopyButton from "./copy-button";
import { UserRoundIcon } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  console.log("data", data);
  console.log("error", error);

  const userData = await getUserAuthsBySupabaseId(data.user?.id as string);
  console.log("me", userData);

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

            <Button className="w-full mt-6 py-6" >QRコード再生成</Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 bg-white overflow-y-auto p-4 py-12">
        {/* VIP Owner Card */}
        <Card className="w-full mb-4 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-lg mr-4 bg-gradient-to-br from-pink-500 to-purple-600"></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">VIP Owner</div>
                  <div className="text-sm text-gray-500">2025-09-12</div>
                </div>
                <div className="text-sm font-medium">+ 100 pt</div>
              </div>
              <div className="mt-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  友達招待
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Event Name Card */}
        <Card className="w-full mb-4 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-lg mr-4 bg-gradient-to-br from-pink-500 to-purple-600"></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">Evnet Name</div>
                  <div className="text-sm text-gray-500">2025-09-12</div>
                </div>
                <div className="text-sm font-medium">+ 100 pt</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Invited by <span className="font-medium">Xname</span>
                <Avatar className="w-4 h-4 ml-1 inline-block">
                  <div className="bg-purple-600 w-full h-full flex items-center justify-center text-[8px] text-white">
                    X
                  </div>
                </Avatar>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional cards for scrolling demonstration */}
        {[1, 2, 3].map((item) => (
          <Card key={item} className="w-full mb-4 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-lg mr-4 bg-gradient-to-br from-pink-500 to-purple-600"></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Event {item}</div>
                    <div className="text-sm text-gray-500">2025-09-12</div>
                  </div>
                  <div className="text-sm font-medium">+ 100 pt</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
