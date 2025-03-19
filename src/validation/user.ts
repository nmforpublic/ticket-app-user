import { z } from "zod"

export const createAdminUserSchema = z.object({
  email: z.string()
    .email({ message: "有効なメールアドレスを入力してください" })
    .min(1, { message: "メールアドレスは必須です" }),
  password: z.string()
    .min(6, { message: "パスワードは8文字以上で入力してください" })
    .max(100, { message: "パスワードは100文字以内で入力してください" }),
  organization_id: z.number()
    .int({ message: "有効な組織IDを入力してください" })
    .positive({ message: "組織IDは正の整数である必要があります" }),
})

export type CreateAdminUserFormValues = z.infer<typeof createAdminUserSchema>

// ログイン用のバリデーションスキーマ
export const adminLoginSchema = z.object({
  email: z.string()
    .email({ message: "有効なメールアドレスを入力してください" })
    .min(1, { message: "メールアドレスは必須です" }),
  password: z.string()
    .min(1, { message: "パスワードは必須です" })
})

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>
