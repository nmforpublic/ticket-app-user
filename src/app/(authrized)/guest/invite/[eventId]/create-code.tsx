'use client';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { getOrganizationUserByAuthId } from '@/actions/organizationUser';
import { createInvitationCode } from '@/actions/invitationCode';
import { toast } from 'sonner';
import { useId, useState } from "react";
import {
  MinusIcon,
  PlusIcon,
} from "lucide-react"

export default function CreateCode({ remaining, alloId, userorgId, eventId}: { remaining?: string; alloId?: string, userorgId?: string; eventId?: string}) {
  const id = useId();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ticketAmount, setTicketAmount] = useState(1) // Initialize volume state (0-9)

  const decreaseAmount = () => setTicketAmount((prev) => Math.max(0, prev - 1))
  const increaseAmount = () => setTicketAmount((prev) => Math.min(remaining ? parseInt(remaining) : 0, prev + 1))



  const handleCreateCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('ユーザー情報を取得できませんでした');
      }

      if (!alloId || !userorgId || !eventId) {
        setError('チケット割り当てID、ユーザー組織ID、またはイベントIDが見つかりません');
        return;
      }


      const organizationId = 1; // 固定値
      const codeType = 'guest_invitation';

      const result = await createInvitationCode(
        parseInt(userorgId),
        organizationId,
        codeType,
        parseInt(eventId),
        ticketAmount,
        parseInt(alloId)
      );

      if (!result.success || !result.data?.code) {
        throw new Error(result.error?.message || 'コード生成に失敗しました');
      }

      setCode(result.data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
        .then(() => {
          toast.success('コードをコピーしました', {
            description: 'クリップボードにコピーされました',
          });
        })
        .catch((err) => {
          toast.error('コピーに失敗しました', {
            description: err instanceof Error ? err.message : '予期せぬエラーが発生しました',
          });
        });
    }
  };

  return (
    <div className="flex flex-col gap-4 container mx-auto px-4 py-8 overflow-auto w-full">
      <>
        <Label htmlFor={id} className="font-bold">チケット枚数を指定</Label>
        <div className="flex items-center justify-between flex-row gap-4 mb-6 w-full">
          <p className="text-base font-bold text-gray-500">
            チケット枚数:
          </p>

          <div
            className="inline-flex items-center"
            role="group"
            aria-labelledby="ticket-control"
          >
            <span id="ticket-control" className="sr-only">
              ticket Control
            </span>
            <Button
              className="rounded-full"
              variant="outline"
              size="icon"
              aria-label="Decrease ticket"
              onClick={decreaseAmount}
              disabled={ticketAmount === 1}
            >
              <MinusIcon size={16} aria-hidden="true" />
            </Button>
            <div
              className="flex items-center px-3 text-sm font-medium tabular-nums"
              aria-live="polite"
            >
              <span>
                {ticketAmount}
              </span>
            </div>
            <Button
              className="rounded-full"
              variant="outline"
              size="icon"
              aria-label="Increase ticket"
              onClick={increaseAmount}
              disabled={ticketAmount === (remaining ? parseInt(remaining) : 0)}
            >
              <PlusIcon size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </>
      <p className='text-gray-500 text-xs text-center'>下記のボタンを押して、招待コードを作成してください</p>
          <Button 
            onClick={handleCreateCode}
            disabled={loading}
            className='w-full font-bold py-8'
          >
            {loading ? '生成中...' : 'コードを生成'}
          </Button>

          {code && (
            <div className="space-y-2 mt-4">
              <Label className='font-bold'>生成されたコード</Label>
              <div className="flex gap-2">
                <Input 
                  value={code}
                  readOnly
                  className="w-64"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyCode}
                >
                  コピー
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
    </div>
  );
}
