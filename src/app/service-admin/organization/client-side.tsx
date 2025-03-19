'use client'

import React from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { organizationSchema, type OrganizationFormValues } from "@/validation/organizations"
import { createOrganization } from "@/actions/admin/organizations"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ActionResponse } from "@/actions/error";

type FormStatus = {
  message: string;
  type: 'success' | 'error';
  errorCode?: string;
};

export default function OrganizationClient() {

  const [isPending, startTransition] = useTransition()
  const [formStatus, setFormStatus] = React.useState<FormStatus | null>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = (data: OrganizationFormValues) => {
    startTransition(async () => {
        const {name, description} = data
        const result = await createOrganization(name, description) as ActionResponse
      
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
      <h1 className="text-xl font-bold mb-6 text-center">組織の登録</h1>
      
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
          <Label htmlFor="name" className='font-bold'>組織名</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="組織名を入力"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className='font-bold'>説明</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="組織の説明を入力（任意）"
            rows={4}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full py-8 font-bold"
        >
          {isPending ? '登録中...' : '登録'}
        </Button>
      </form>
    </div>
  )
}
