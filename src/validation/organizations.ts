import { z } from "zod"

export const organizationSchema = z.object({
  name: z.string()
    .min(1, { message: "組織名は必須です" })
    .max(100, { message: "組織名は100文字以内で入力してください" }),
  description: z.string()
    .max(500, { message: "説明は500文字以内で入力してください" })
    .optional(),
})

export type OrganizationFormValues = z.infer<typeof organizationSchema>
