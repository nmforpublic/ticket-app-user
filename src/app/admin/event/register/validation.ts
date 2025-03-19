import { z } from "zod";

// イベント登録フォームのバリデーションスキーマ
export const eventFormSchema = z.object({
  // イベント基本情報
  eventName: z.string().min(1, "イベント名は必須です"),
  
  // 日時情報
  startDate: z.date({
    required_error: "開始日は必須です",
    invalid_type_error: "有効な日付を入力してください",
  }),
  startTime: z.string().min(1, "開始時間は必須です"),
  endDate: z.date({
    required_error: "終了日は必須です",
    invalid_type_error: "有効な日付を入力してください",
  }),
  endTime: z.string().min(1, "終了時間は必須です"),
  
  // 会場情報
  location: z.string().min(1, "会場は必須です"),
  
  // 説明
  description: z.string().optional(),
  
  // 料金情報
  ticketType: z.enum(["free", "paid"], {
    required_error: "チケットタイプを選択してください",
  }),
  price: z.string().optional()
    .refine(
      (val) => {
        if (val === undefined) return true;
        return !isNaN(Number(val)) && Number(val) >= 0;
      },
      { message: "有効な金額を入力してください" }
    ),
  
  // 運営者情報
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      username: z.string(),
      image: z.string(),
      guestLimit: z.number().min(0, "0以上の数値を入力してください"),
      isSelected: z.boolean().default(false),
    })
  ),
  
  // 定員情報
  capacityType: z.enum(["unlimited", "limited"], {
    required_error: "定員タイプを選択してください",
  }),
  capacity: z.string().optional()
    .refine(
      (val) => {
        // 無制限の場合は検証をスキップ
        if (val === undefined || val === '') return true;
        // 数値として有効かつ正の数であることを確認
        return !isNaN(Number(val)) && Number(val) > 0;
      },
      { message: "有効な人数を入力してください" }
    ),
  
  // イベント画像
  eventImage: z.string().optional(),

  // 公開設定
  is_published: z.boolean().default(true)
}).refine(
  (data) => {
    // 開始日と終了日の比較
    if (!data.startDate || !data.endDate) return true;
    
    // 日付のみの比較
    if (data.startDate > data.endDate) return false;
    
    // 同じ日の場合は時間も比較
    if (data.startDate.getTime() === data.endDate.getTime()) {
      if (!data.startTime || !data.endTime) return true;
      
      // HH:MM 形式の時間を比較
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      const [endHour, endMinute] = data.endTime.split(':').map(Number);
      
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return true;
      
      if (startHour > endHour) return false;
      if (startHour === endHour && startMinute >= endMinute) return false;
    }
    
    return true;
  },
  {
    message: "開始日時は終了日時より前である必要があります",
    path: ["startDate"], // エラーを表示するフィールド
  }
);

// フォームの型定義をエクスポート
export type EventFormValues = z.infer<typeof eventFormSchema>;
