'use client'

import React from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ActionResponse } from "@/actions/error";
import { createAdminUserSchema, type CreateAdminUserFormValues } from "@/validation/user";
import { createAdminUser } from "@/actions/admin/user";
import { getOrganizations } from "@/actions/admin/organizations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormStatus = {
  message: string;
  type: 'success' | 'error';
  errorCode?: string;
};

type Organization = {
  id: number;
  name: string;
};

export default function AdminUserClient() {
  const [isPending, startTransition] = useTransition()
  const [formStatus, setFormStatus] = React.useState<FormStatus | null>(null)
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // 組織一覧の取得
  React.useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const result = await getOrganizations();
        if (result.success && result.data) {
          setOrganizations(result.data);
        }
      } catch (error) {
        console.error('組織一覧の取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<CreateAdminUserFormValues>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      email: "",
      password: "",
      organization_id: undefined,
    },
  })

  const onSubmit = (data: CreateAdminUserFormValues) => {
    startTransition(async () => {
      const result = await createAdminUser(
        data.email,
        data.password,
        data.organization_id
      ) as ActionResponse
      
      if (result.success) {
        setFormStatus({ 
          message: result.message, 
          type: 'success' 
        })
        // フォームをリセット
        reset()
      } else {
        setFormStatus({ 
          message: result.error?.message || result.message, 
          type: 'error',
          errorCode: result.error?.code
        })
      }
    })
  }

  const getAlertClassName = (type: 'success' | 'error') => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen overflow-auto">
      <Link href="/service-admin" className="block mb-4">
        <ChevronLeft size={24} className="inline-block mr-2" />
      </Link>
      <h1 className="text-xl font-bold mb-6 text-center">管理者ユーザーの登録</h1>
      
      {formStatus && (
        <Alert className={`mb-4 ${getAlertClassName(formStatus.type)}`}>
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
          <Label htmlFor="email" className='font-bold'>メールアドレス</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="メールアドレスを入力"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className='font-bold'>パスワード</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="パスワードを入力"
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization_id" className='font-bold'>所属組織</Label>
          <Select
            onValueChange={(value: string) => setValue('organization_id', Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className={errors.organization_id ? "border-red-500" : "w-full"}>
              <SelectValue placeholder="組織を選択" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.organization_id && (
            <p className="text-sm text-red-500">{errors.organization_id.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isPending || isLoading}
          className="w-full py-8 font-bold"
        >
          {isPending ? '登録中...' : '登録'}
        </Button>
      </form>
    </div>
  )
}
