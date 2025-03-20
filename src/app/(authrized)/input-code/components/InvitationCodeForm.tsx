'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { handleSubmit } from "../actions"
import { CircleAlert, Loader2 } from "lucide-react"
import { useState } from "react"

const invitationCodeSchema = z.object({
  code: z.string().min(1, "コードを入力してください"),
})

type InvitationCodeFormValues = z.infer<typeof invitationCodeSchema>

export function InvitationCodeForm() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<InvitationCodeFormValues>({
    resolver: zodResolver(invitationCodeSchema),
  })
  
  const onSubmit = handleFormSubmit(async (data) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('code', data.code)
      await handleSubmit(formData)
      // リダイレクトされるので、ここには到達しない
    } catch (e) {
      setIsSubmitting(false)
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    }
  })
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
          <p className="text-sm">
            <CircleAlert className="me-3 -mt-0.5 inline-flex opacity-60" size={16} aria-hidden="true" />
            {error}
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="code">コード</Label>
        <Input
          id="code"
          {...register("code")}
          placeholder="Test1234"
        />
        {errors.code && !isSubmitting && (
          <p className="text-sm text-red-500 mt-1">
            {errors.code.message}
          </p>
        )}
      </div>
      <Button 
        type="submit" 
        className="w-full font-bold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            処理中...
          </>
        ) : (
          "検証"
        )}
      </Button>
    </form>
  )
}
