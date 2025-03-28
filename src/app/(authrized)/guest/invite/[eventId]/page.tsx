"use server";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IDSearchPage from "./id-search";
// import CreateCode from "./create-code";


interface InvitePageProps {
  params: {
    eventId: string;
  };
  searchParams: {
    alloId?: string;
    userorgId?: string;
  };
}

export default async function InvitePage({ 
  params, 
  searchParams 
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ alloId?: string; userorgId?: string; remaining?: string }>;
}) {
  const { eventId } = await params;
  const { alloId, userorgId, remaining } = await searchParams;

  if (!eventId || !alloId || !userorgId) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-4 container mx-auto px-4 py-8 overflow-auto">
                <Tabs defaultValue="tab-1" className="items-center w-full">
      <TabsList className="w-full">
        <TabsTrigger value="tab-1" className="font-bold w-full">ID検索</TabsTrigger>
        <TabsTrigger value="tab-2" className="font-bold w-full">コード発行</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1" className="w-full">
        <IDSearchPage remaining={remaining} alloId={alloId} userorgId={userorgId}/>
      </TabsContent>
      <TabsContent value="tab-2" className="w-full">
        {/* <CreateCode /> */}
      </TabsContent>
    </Tabs>
        </div>
  );
} 