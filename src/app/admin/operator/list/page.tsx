import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getOrganizationOperators } from "@/actions/admin/organizationUsers";
import { OperatorWithProfile } from "@/types/event";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
  import { Button } from "@/components/ui/button";
  import { TrashIcon } from "lucide-react";

export default async function OperatorListPage() {
  const response = await getOrganizationOperators(1);
  const members = response.data;

  return (
    <div className="flex flex-col gap-4 container mx-auto px-4 py-8 overflow-auto">
      {!members?.length && (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">運営者が見つかりません</div>
        </div>
      )}

      {members?.map((member: OperatorWithProfile) => (
        <Card
          key={member.id}
          className="flex flex-row items-between justify-between border-b px-4 py-4"
        >
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Avatar className="shrink-0">
              <AvatarImage src={member.image} alt={member.name} />
              <AvatarFallback>{member.name}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-bold truncate text-sm">{member.name}</div>
              <div className="text-muted-foreground/80 truncate text-xs">
                {member.username}
              </div>
            </div>
            <AlertDialog>
      <AlertDialogTrigger asChild>
      <Button variant="ghost" className="ml-auto">
      <TrashIcon className="opacity-60 text-destructive" size={16} aria-hidden="true" />
    </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。削除してもよろしいですか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-bold">キャンセル</AlertDialogCancel>
          <AlertDialogAction className="font-bold">削除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

          </div>
        </Card>
      ))}
      <Link href="/admin/operator/register" className="w-full">
      <Button className="w-full font-bold py-8">運営者を追加</Button>
      </Link>
    </div>
  );
}
