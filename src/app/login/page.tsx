'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition, Suspense } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { adminLoginSchema, type AdminLoginFormValues } from "@/validation/user"
import { adminUserLogin } from "@/actions/admin/user"
import { ActionResponse } from "@/actions/error"
import React from 'react'

type FormStatus = {
  message: string;
  type: 'success' | 'error';
  errorCode?: string;
};

function LoginContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [isPending, startTransition] = useTransition()
  const [formStatus, setFormStatus] = React.useState<FormStatus | null>(null)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = (data: AdminLoginFormValues) => {
    setFormStatus(null)
    startTransition(async () => {
      const result = await adminUserLogin(data.email, data.password) as ActionResponse
      
      if (result.success) {
        // ログイン成功時はダッシュボードにリダイレクト
        router.push('/admin')
      } else {
        setFormStatus({ 
          message: result.error?.message || result.message, 
          type: 'error',
          errorCode: result.error?.code
        })
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-5 items-center justify-center py-10 mx-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">ログイン</CardTitle>
          <CardDescription>
            運営から渡されたメールアドレスとパスワードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {formStatus && formStatus.type === 'error' && (
            <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
              <AlertDescription>
                {formStatus.message}
                {formStatus.errorCode && (
                  <span className="block text-sm mt-1">
                    エラーコード: {formStatus.errorCode}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full font-bold" 
              disabled={isPending}
            >
              {isPending ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-5 items-center justify-center py-10 mx-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">読み込み中...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}