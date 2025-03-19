"use client";

import UploadImage from "./UploadImage"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen } from 'lucide-react';
import { useId } from "react";
import { createEvent } from "@/actions/admin/events";
import { useRouter } from "next/navigation";
import {
    Timeline,
    TimelineHeader,
    TimelineIndicator,
    TimelineItem,
    TimelineSeparator,
    TimelineTitle,
  } from "@/components/ui/timeline";
import DatePickerInput from "./DatePickerInput";
import TimeInput from "./TimeInput";
import { MapPin } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MemberTable from "./MemberTable";
import MemberDialog from "./MemberDialog";
import GuestTable from "./GuestTable";
import { Button } from "@/components/ui/button";
import { CirclePlus } from 'lucide-react';
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, EventFormValues } from "./validation";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";


export default function EventRegister() {
    const id = useId();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const timelineItems = [
        {
          id: 1,
          date: "Mar 15, 2024",
          title: "開始",
          description:
            "Initial team meeting and project scope definition. Established key milestones and resource allocation.",
        },
        {
          id: 2,
          date: "Mar 22, 2024",
          title: "終了",
          description:
            "Completed wireframes and user interface mockups. Stakeholder review and feedback incorporated.",
        },
      ];

    // フォームの初期値を設定
  const defaultValues: Partial<EventFormValues> = {
    eventName: "",
    location: "",
    description: "", 
    ticketType: "free",
    price: "",
    capacityType: "unlimited",
    capacity: "",
    members: [],
    eventImage: "",
    is_published: true,
    // 日付と時間の初期値を設定
    startDate: new Date(),
    startTime: "19:00",
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)), // 翌日
    endTime: "05:00"
  };

    // React Hook Formの設定
    const form = useForm<EventFormValues>({
      resolver: zodResolver(eventFormSchema),
      defaultValues,
      mode: "onChange"
    });

    // フォーム送信処理
    const onSubmit = async (data: EventFormValues) => {
      // デバッグ用：フォームデータをコンソールに出力
      console.log("フォーム送信開始", data);
      
      try {
        setIsSubmitting(true);
        // 選択された運営者のみをフィルタリング
        const selectedMembers = data.members.filter(member => member.isSelected);
        console.log("選択された運営者", selectedMembers);
        
        // 日時の変換
        const startDateTime = new Date(data.startDate);
        const [startHour, startMinute] = data.startTime.split(':').map(Number);
        startDateTime.setHours(startHour, startMinute);
        
        const endDateTime = new Date(data.endDate);
        const [endHour, endMinute] = data.endTime.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute);
        
        console.log("変換後の日時", { startDateTime, endDateTime });
        
        // チケット価格の処理
        const ticketPrice = data.ticketType === 'free' ? 0 : parseInt(data.price || '0');
        
        // 定員の処理
        const capacity = data.capacityType === 'unlimited' ? null : parseInt(data.capacity || '0');
        
        console.log("送信するデータ", {
          organization_id: 1,
          name: data.eventName,
          description: data.description,
          image_url: data.eventImage,
          location: data.location,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          ticket_price: ticketPrice,
          capacity: capacity,
          is_published: false,
          selectedMembers: selectedMembers.map(member => ({
            id: member.id,
            guestLimit: member.guestLimit
          }))
        });
        
        // イベント作成リクエスト
        console.log("createEvent 呼び出し前");
        const response = await createEvent({
          organization_id: 1, // 実際の実装では動的に取得
          name: data.eventName,
          description: data.description,
          image_url: data.eventImage,
          location: data.location,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          ticket_price: ticketPrice,
          capacity: capacity,
          is_published: false, // デフォルトは非公開
          selectedMembers: selectedMembers.map(member => ({
            id: member.id,
            guestLimit: member.guestLimit
          }))
        });
        console.log("createEvent 呼び出し後", response);
        
        if (response.success) {
          // 成功時の処理
          console.log('イベントを作成しました:', response.data?.eventId);
          
          // 成功ページにリダイレクト
          if (response.data?.eventId) {
            // イベント詳細ページへリダイレクト
            router.push(`/admin/event/register/success?id=${response.data.eventId}`);
          } else {
            // イベントIDがない場合はイベント一覧ページへ
            router.push('/admin/event');
          }
        } else {
          // エラー処理
          console.error('イベント作成エラー:', response.error);
          alert(`イベント作成に失敗しました: ${response.message}`);
        }
      } catch (error) {
        console.error('イベント作成エラー:', error);
        alert('イベント作成中にエラーが発生しました');
      } finally {
        setIsSubmitting(false);
      }
    };

  // デバッグ用：フォームの状態を表示
  const formState = form.formState;
  console.log("フォームの状態", {
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    errors: formState.errors
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="container mx-auto px-4 py-8 overflow-auto space-y-12">
        {/* イベント画像 */}
        <Controller
          control={form.control}
          name="eventImage"
          render={({ field }) => (
            <UploadImage value={field.value} onChange={field.onChange} />
          )}
        />
        
        {/* イベント名 */}
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem className="*:not-first:mt-2">
              <FormLabel className="font-bold">イベント名</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    {...field} 
                    className="peer ps-9" 
                    placeholder="イベント名" 
                    type="text" 
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Pen size={16} aria-hidden="true" />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 開始と終了 */}
        <Timeline defaultValue={1}>
          {timelineItems.map((item) => (
            <TimelineItem key={item.id} step={item.id}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineTitle className="-mt-0.5">{item.title}</TimelineTitle>
                <div className='flex flex-row items-center space-x-2 mt-2'>
                  <FormField
                    control={form.control}
                    name={item.id === 1 ? "startDate" : "endDate"}
                    render={({ field }) => (
                      <DatePickerInput value={field.value} onChange={field.onChange} />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={item.id === 1 ? "startTime" : "endTime"}
                    render={({ field }) => (
                      <TimeInput value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
                <TimelineIndicator />
              </TimelineHeader>
            </TimelineItem>
          ))}
        </Timeline>

        {/* 会場 */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem className="*:not-first:mt-2">
              <FormLabel className="font-bold">会場</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    {...field} 
                    className="peer ps-9" 
                    placeholder="住所" 
                    type="text" 
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <MapPin size={16} aria-hidden="true" />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 説明 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="*:not-first:mt-2">
              <FormLabel className="font-bold">説明</FormLabel>
              <p className="text-muted-foreground mt-2 text-xs" role="region" aria-live="polite">
                不要であれば空欄にしてください
              </p>
              <FormControl>
                <Textarea {...field} placeholder="イベントの説明を入力してください" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 料金 */}
        <div className="*:not-first:mt-2">
          <FormField
            control={form.control}
            name="ticketType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">チケット</FormLabel>
                <FormControl>
                  <RadioGroup 
                    className="gap-2" 
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {/* Radio card #1 */}
                    <div className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                      <RadioGroupItem
                        value="free"
                        id={`${id}-1`}
                        aria-describedby={`${id}-1-description`}
                        className="order-1 after:absolute after:inset-0"
                      />
                      <div className="grid grow gap-2">
                        <Label htmlFor={`${id}-1`} className="font-bold">
                          無料{" "}
                        </Label>
                        <p id={`${id}-1-description`} className="text-muted-foreground text-xs">
                          すべての参加者に無料で提供されます。
                        </p>
                      </div>
                    </div>
                    {/* Radio card #2 */}
                    <div className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                      <RadioGroupItem
                        value="paid"
                        id={`${id}-2`}
                        aria-describedby={`${id}-2-description`}
                        className="order-1 after:absolute after:inset-0"
                      />
                      <div className="grid grow gap-2">
                        <Label htmlFor={`${id}-2`} className="font-bold">
                          有料{" "}
                          <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
                            (金額の入力必須)
                          </span>
                        </Label>
                        <p id={`${id}-2-description`} className="text-muted-foreground text-xs">
                          有料のチケットを提供します。金額を入力してください。
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch("ticketType") === "paid" && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="*:not-first:mt-2 px-3">
                  <FormLabel className="font-bold mt-2">料金</FormLabel>
                  <FormControl>
                    <div className="relative flex rounded-md shadow-xs">
                      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm">
                        ¥
                      </span>
                      <Input
                        {...field}
                        className="-me-px rounded-e-none ps-6 shadow-none"
                        placeholder="1000"
                        type="text"
                      />
                      <span className="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-e-md border px-3 text-sm">
                        円
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        {/* 運営一覧 */}
        <div className="*:not-first:mt-2">
          <Label htmlFor={id} className="font-bold">運営者一覧</Label>
          <MemberTable form={form} />
          <MemberDialog form={form} />
        </div>

        {/* 定員 */}
        <div className="*:not-first:mt-2">
          <FormField
            control={form.control}
            name="capacityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">定員</FormLabel>
                <FormControl>
                  <RadioGroup 
                    className="gap-2" 
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {/* Radio card #1 */}
                    <div className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                      <RadioGroupItem
                        value="unlimited"
                        id={`${id}-capacity-1`}
                        aria-describedby={`${id}-capacity-1-description`}
                        className="order-1 after:absolute after:inset-0"
                      />
                      <div className="grid grow gap-2">
                        <Label htmlFor={`${id}-capacity-1`} className="font-bold">
                          無制限{" "}
                        </Label>
                        <p id={`${id}-capacity-1-description`} className="text-muted-foreground text-xs">
                          参加者数に制限はありません。
                        </p>
                      </div>
                    </div>
                    {/* Radio card #2 */}
                    <div className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                      <RadioGroupItem
                        value="limited"
                        id={`${id}-capacity-2`}
                        aria-describedby={`${id}-capacity-2-description`}
                        className="order-1 after:absolute after:inset-0"
                      />
                      <div className="grid grow gap-2">
                        <Label htmlFor={`${id}-capacity-2`} className="font-bold">
                          制限あり{" "}
                          <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
                            (人数の入力必須)
                          </span>
                        </Label>
                        <p id={`${id}-capacity-2-description`} className="text-muted-foreground text-xs">
                          参加者数を制限します。人数を入力してください。
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch("capacityType") === "limited" && (
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem className="*:not-first:mt-2 px-3">
                  <FormLabel className="font-bold mt-2">人数</FormLabel>
                  <FormControl>
                    <div className="relative flex rounded-md shadow-xs">
                      <Input
                        {...field}
                        className="-me-px rounded-e-none shadow-none"
                        placeholder="1000"
                        type="text"
                      />
                      <span className="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-e-md border px-3 text-sm">
                        人
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* 登録済みゲスト一覧 */}
        <div className="*:not-first:mt-2">
          <Label htmlFor={id} className="font-bold">登録済みゲスト一覧</Label>
          <GuestTable />
        </div>

        {/* 公開設定 */}
        <FormField
          control={form.control}
          name="is_published"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">公開設定</FormLabel>
              <FormControl>
                <RadioGroup 
                  className="gap-2" 
                  value={field.value ? "published" : "unpublished"}
                  onValueChange={(value) => field.onChange(value === "published")}
                >
                  {/* Radio card #1 */}
                  <div className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                    <RadioGroupItem
                      value="published"
                      id={`${id}-publish-1`}
                      aria-describedby={`${id}-publish-1-description`}
                      className="order-1 after:absolute after:inset-0"
                    />
                    <div className="grid grow gap-2">
                      <Label htmlFor={`${id}-publish-1`} className="font-bold">
                        公開{" "}
                      </Label>
                      <p id={`${id}-publish-1-description`} className="text-muted-foreground text-xs">
                        イベントを公開します。
                      </p>
                    </div>
                  </div>
                  {/* Radio card #2 */}
                  <div className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                    <RadioGroupItem
                      value="unpublished"
                      id={`${id}-publish-2`}
                      aria-describedby={`${id}-publish-2-description`}
                      className="order-1 after:absolute after:inset-0"
                    />
                    <div className="grid grow gap-2">
                      <Label htmlFor={`${id}-publish-2`} className="font-bold">
                        非公開{" "}
                      </Label>
                      <p id={`${id}-publish-2-description`} className="text-muted-foreground text-xs">
                        イベントを非公開にします。こちらを選択した場合、ユーザーには表示されず、管理者のみが閲覧できます。
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 登録ボタン */}
        <Button 
          type="button" 
          className="w-full py-8 font-bold bg-emerald-500 text-white hover:bg-emerald-500/90"
          disabled={isSubmitting}
          onClick={() => {
            console.log("登録ボタンがクリックされました");
            const formValues = form.getValues();
            console.log("フォームの値:", formValues);
            onSubmit(formValues);
          }}
        >
          <CirclePlus className="-ms-1 opacity-60" size={16} aria-hidden="true" />
          {isSubmitting ? '登録中...' : '登録'}
        </Button>
      </form>
    </FormProvider>
  )
}
