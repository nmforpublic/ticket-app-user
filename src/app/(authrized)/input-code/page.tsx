import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InvitationCodeForm } from "./components/InvitationCodeForm"

export default function LoginContent() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-5 items-center justify-center py-10 mx-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">コード入力</CardTitle>
          <CardDescription>
            友達から送られたコードを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationCodeForm />
        </CardContent>
      </Card>
    </div>
  )
}