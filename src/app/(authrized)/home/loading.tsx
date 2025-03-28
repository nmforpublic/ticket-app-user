import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="flex flex-col">
      {/* Fixed top section with gradient background */}
      <div className="bg-gradient-to-bl from-[#ffe4e6] to-[#ccfbf1] rounded-bl-lg rounded-br-lg">
        <div className="flex flex-col items-center p-6 h-full">
          {/* User Avatar Skeleton */}
          <Skeleton className="w-20 h-20 rounded-full mb-4" />

          {/* User info Skeleton */}
          <Skeleton className="h-5 w-32 mb-2" />
          <div className="flex items-center justify-between flex-row gap-2 mb-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>

          {/* QR Code Skeleton */}
          <Skeleton className="w-48 h-48 rounded-lg" />

          <Skeleton className="w-full h-12 mt-6" />
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
            {/* Ticket Skeletons */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full mb-4 p-4 shadow-sm">
                <div className="flex items-center">
                  <Skeleton className="w-16 h-16 rounded-lg mr-4" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex flex-row iterms-center justify-between mt-2">
                      <div className="mt-2 flex items-center">
                        <Skeleton className="h-4 w-20 mr-2" />
                        <Skeleton className="h-4 w-24 mr-1" />
                        <Skeleton className="w-4 h-4 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-md ml-4" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="tab-2" className="w-full">
            <div className="flex justify-center py-8">
              <Skeleton className="h-5 w-40" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
