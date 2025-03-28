import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 container mx-auto px-4 py-8 overflow-auto">
      <Tabs defaultValue="tab-1" className="items-center w-full">
        <TabsList className="w-full">
          <TabsTrigger value="tab-1" className="font-bold w-full">ID検索</TabsTrigger>
          <TabsTrigger value="tab-2" className="font-bold w-full">コード発行</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1" className="w-full">
          {/* ID検索タブのスケルトン */}
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-5 w-48 mt-2" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md mt-4" />
            <div className="flex justify-end mt-4">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tab-2" className="w-full">
          {/* コード発行タブのスケルトン */}
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex items-center gap-2 mt-4">
              <Skeleton className="h-10 w-20 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
            <Skeleton className="h-5 w-64 mt-2" />
            <div className="flex justify-end mt-4">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
