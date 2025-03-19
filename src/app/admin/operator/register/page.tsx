import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IDSearchPage from "./id-search";

export default function OperatorRegisterPage() {
    return (
        <div className="flex flex-col gap-4 container mx-auto px-4 py-8 overflow-auto">
                <Tabs defaultValue="tab-1" className="items-center w-full">
      <TabsList className="w-full">
        <TabsTrigger value="tab-1" className="font-bold w-full">ID検索</TabsTrigger>
        <TabsTrigger value="tab-2" className="font-bold w-full">コード発行</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1" className="w-full">
        <IDSearchPage />
      </TabsContent>
      <TabsContent value="tab-2">
        <p className="text-muted-foreground p-4 text-center text-xs">Content for Tab 2</p>
      </TabsContent>
    </Tabs>
        </div>
    )
}