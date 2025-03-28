'use client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CirclePlus } from 'lucide-react';
import { useId, useState } from "react";
import {Button }from "@/components/ui/button";
// import { addOrganizationUser } from "@/actions/admin/organizationUsers";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { OperatorWithProfile } from "@/types/event";
import { CircleAlert } from "lucide-react";
import { getUserAuthsBySupabaseId } from "@/actions/user";
import { UserAuthsInfo } from "@/types/user";
import { inviteGuests } from "@/actions/guestInvitation";

import {
  MinusIcon,
  PlusIcon,
} from "lucide-react"

// UUIDの形式を検証する関数
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export default function IDSearchPage({ remaining, alloId, userorgId}: { remaining?: string; alloId?: string, userorgId?: string }) {
  const id = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<UserAuthsInfo | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [ticketAmount, setTicketAmount] = useState(1) // Initialize volume state (0-9)

  const decreaseAmount = () => setTicketAmount((prev) => Math.max(0, prev - 1))
  const increaseAmount = () => setTicketAmount((prev) => Math.min(remaining ? parseInt(remaining) : 0, prev + 1))


  const handleInvite = async () => {
    if (!searchResult) return;
  
    if (!alloId || !userorgId) {
      setError('チケット割り当てIDまたはユーザー組織IDが見つかりません');
      return;
    }

    try {
      setIsRegistering(true);
      
      const result = await inviteGuests({
        allocationId: parseInt(alloId),
        guestAuthId: searchTerm,
        ticketCount: ticketAmount,
        reason: 'ゲスト招待',
        changedByOrgUserId: parseInt(userorgId)
      });

      if (!result.success) {
        throw new Error(result.error?.message || '招待に失敗しました');
      }

      setError(null);
      setSearchResult(null);
      setIsSelected(false);
      setTicketAmount(1);
      
      // 登録成功時のUIフィードバック
      alert('ゲスト招待が完了しました');
    } catch (error) {
      setError(error instanceof Error ? error.message : '招待中にエラーが発生しました');
      console.error('招待エラー:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError(null);
      
      // UUIDの形式を検証
      if (!isValidUUID(searchTerm)) {
        setSearchResult(null);
        setError('アプリIDのフォーマットが間違っています');
        setIsSearching(false);
        return;
      }
      
      const result = await getUserAuthsBySupabaseId(searchTerm);
      if (!result) {
        setSearchResult(null);
        setError('検索に失敗しました');
        return;
      }

      if (result.success) {
        console.log(result.data);
        if (result.data) {
          setSearchResult(result.data);
          setError(null);
        } else {
          setSearchResult(null);
          setError('該当するユーザーが見つかりませんでした');
        }
      } else {
        setSearchResult(null);
        setError(result.error?.message || '検索中にエラーが発生しました');
      }
    } catch {
      setSearchResult(null);
      setError('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };
  return (
    <div className="flex flex-col gap-4 container mx-auto px-4 py-8 overflow-auto">

    <div className="*:not-first:mt-2">
      <Label htmlFor={id} className="font-bold">IDから検索</Label>
      <div className="relative">
        <Input 
          id={id} 
          className="pe-9" 
          placeholder="ユーザーID" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isSearching}
        />
        <button
          className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Search"
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
        >
          {isSearching ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Search size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>

    {error && (
         <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
         <p className="text-sm">
           <CircleAlert className="me-3 -mt-0.5 inline-flex opacity-60" size={16} aria-hidden="true" />
              {error}
         </p>
       </div>
    )}

    {searchResult && (
      <div>

      <Card className="flex flex-row items-between justify-between border-b px-4 py-4">
        <div className="flex items-center space-x-4 min-w-0 flex-1 relative">
          <Checkbox
            id="select-user"
            className="absolute right-0 top-0 m-2"
            checked={isSelected}
            onCheckedChange={(checked) => setIsSelected(!!checked)}
            />
          <Avatar className="shrink-0">
            <AvatarImage 
              src={searchResult.profile.picture_url as string} 
              alt={searchResult.profile.display_name as string} 
              />
            <AvatarFallback>{searchResult.profile.display_name as string}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-bold truncate text-sm">{searchResult.profile.display_name as string}</div>
            <div className="text-muted-foreground/80 truncate text-xs">
              {searchResult.provider_identifier.slice(0,5) + "..." + searchResult.provider_identifier.slice(-5)}
            </div>
          </div>
        </div>
      </Card>
      {!isSelected && (
              <span className="text-xs text-gray-500 ml-2">※ユーザーが正しければチェックボックスを押してください</span>
            )}
              </div>
    )}

    {/* チケット枚数 - チェックボックスが選択されている場合のみ表示 */}
    {isSelected && searchResult && (
      <>
        <Label htmlFor={id} className="font-bold mt-10">チケット枚数を指定</Label>
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
    )}

    <Button 
          type="button" 
          className="w-full py-8 font-bold bg-emerald-500 text-white hover:bg-emerald-500/90"
          disabled={!isSelected || isRegistering}
          onClick={handleInvite}
        >
          <CirclePlus className="-ms-1 opacity-60" size={16} aria-hidden="true" />
          {isRegistering ? '招待中...' : '招待'}
    </Button>
    </div>
  );
}
