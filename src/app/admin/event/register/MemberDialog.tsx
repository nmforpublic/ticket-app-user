'use client';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CirclePlus } from 'lucide-react';
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "./validation";
import { useState, useEffect } from "react";
import { getOrganizationOperators } from "@/actions/admin/organizationUsers";
import { OperatorWithProfile } from "@/types/event";

interface MemberDialogProps {
  form: UseFormReturn<EventFormValues>;
}

export default function MemberDialog({ form }: MemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const members = form.watch("members") || [];

  // APIからoperatorデータを取得
  useEffect(() => {
    const fetchOperators = async () => {
      setLoading(true);
      try {
        // 現在の組織IDを取得（実際の実装では動的に取得）
        const organizationId = 1;
        const response = await getOrganizationOperators(organizationId);
        
        if (response.success && response.data) {
          // フォームの現在の値と統合
          const currentMembers = form.watch("members") || [];
          const mergedOperators = response.data.map(op => {
            const existing = currentMembers.find(m => m.id === op.id);
            return existing ? existing : op;
          });
          console.log(mergedOperators);
          form.setValue("members", mergedOperators);
        }
      } catch (error) {
        console.error("運営者データの取得に失敗しました", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOperators();
  }, [form]);

  // メンバーの選択状態を切り替える
  const toggleMemberSelection = (id: string) => {
    const updatedMembers = members.map(member => {
      if (member.id === id) {
        return { ...member, isSelected: !member.isSelected };
      }
      return member;
    });
    form.setValue("members", updatedMembers, { shouldValidate: true });
  };

  // ゲスト招待枠を更新する
  const updateGuestLimit = (id: string, value: number) => {
    const updatedMembers = members.map(member => {
      if (member.id === id) {
        return { ...member, guestLimit: value };
      }
      return member;
    });
    form.setValue("members", updatedMembers, { shouldValidate: true });
  };

  // ダイアログを閉じる
  const handleClose = () => {
    setOpen(false);
  };

  // 変更を適用する
  const handleApply = () => {
    // フォームの値は既に更新されているので、ダイアログを閉じるだけ
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex justify-center">
        <DialogTrigger asChild>
          <Button className="font-bold text-xs">
            <CirclePlus className="-ms-1 opacity-60" size={16} aria-hidden="true" />
            メンバーを追加
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:hidden">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6 text-base">
              メンバー一覧
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="font-bold">名前</div>
                    <div className="font-bold">ゲスト招待枠</div>
                  </div>
                </div>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center space-x-4">
                      <Checkbox 
                        id={`member-${member.id}`} 
                        checked={member.isSelected}
                        onCheckedChange={() => toggleMemberSelection(member.id)}
                      />
                      <Avatar>
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback>{member.name}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold">{member.name}</div>
                        <div className="text-muted-foreground/80">{member.username}</div>
                      </div>
                    </div>
                    <Input 
                      type="number" 
                      value={member.guestLimit} 
                      onChange={(e) => updateGuestLimit(member.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center" 
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
          </DialogClose>
          <Button type="button" className="font-bold" onClick={handleApply}>
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
