import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
export default async function OperatorInvitationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string; organizationName?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const organizationId = resolvedSearchParams.organizationId;
  const organizationName = resolvedSearchParams.organizationName || "";

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-xl">登録完了</CardTitle>
          <CardDescription>
            {organizationName ? `「${organizationName}」の運営者として登録されました` : "運営者として登録されました"}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/" className="w-full mt-4">
            <Button variant='outline'className="w-full h-full font-bold">
              ホームに戻る
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
