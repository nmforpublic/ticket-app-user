'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { getOrganizationUserByAuthId } from '@/actions/admin/organizationUsers';
import { createInvitationCode } from '@/actions/user/invitationCode';
import { toast } from 'sonner';

export default function CreateCode() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('ユーザー情報を取得できませんでした');
      }

      const orgUserResponse = await getOrganizationUserByAuthId(user.id);
      if (!orgUserResponse.success || !orgUserResponse.data?.[0]) {
        throw new Error('組織ユーザー情報を取得できませんでした');
      }

      const organizationUserId = orgUserResponse.data[0].userId;
      const organizationId = 1; // 固定値
      const codeType = 'operator_invitation';

      const result = await createInvitationCode(
        organizationUserId,
        organizationId,
        codeType
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
      <p className='text-gray-500'>下記のボタンを押して、招待コードを作成してください</p>
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
