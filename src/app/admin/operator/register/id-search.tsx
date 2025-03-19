'use client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CirclePlus } from 'lucide-react';
import { useId, useState } from "react";
import {Button }from "@/components/ui/button";
import { getOrganizationUserByAuthId, addOrganizationUser } from "@/actions/admin/organizationUsers";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { OperatorWithProfile } from "@/types/event";
import { CircleAlert } from "lucide-react";

export default function IDSearchPage() {
  const id = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<OperatorWithProfile | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleRegister = async () => {
    if (!searchResult) return;

    try {
      setIsRegistering(true);
      // 組織IDを適切に取得（例：現在のユーザーの組織IDを使用）
      const organizationId = 1; // TODO: 実際の組織ID取得ロジックに置き換える
      
      const result = await addOrganizationUser(
        organizationId,
        searchResult.userId,
        'operator'
      );

      if (!result.success) {
        throw new Error(result.error?.message || '登録に失敗しました');
      }

      setError(null);
      setSearchResult(null);
      setIsSelected(false);
      
      // 登録成功時のUIフィードバック
      alert('ユーザーの登録が完了しました');
    } catch (error) {
      setError(error instanceof Error ? error.message : '登録中にエラーが発生しました');
      console.error('登録エラー:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError(null);
      const result = await getOrganizationUserByAuthId(searchTerm);
      if (!result) {
        setSearchResult(null);
        setError('検索に失敗しました');
        return;
      }

      if (result.success) {
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          setSearchResult(result.data[0]);
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
      <Card className="flex flex-row items-between justify-between border-b px-4 py-4">
        <div className="flex items-center space-x-4 min-w-0 flex-1 relative">
          <Checkbox
            id="select-user"
            className="absolute right-0 top-0 m-2"
            checked={isSelected}
            onCheckedChange={(checked) => setIsSelected(!!checked)}
          />
          <Avatar className="shrink-0">
            <AvatarImage src={searchResult.image} alt={searchResult.name} />
            <AvatarFallback>{searchResult.name}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-bold truncate text-sm">{searchResult.name}</div>
            <div className="text-muted-foreground/80 truncate text-xs">
              {searchResult.username}
            </div>
          </div>
        </div>
      </Card>
    )}

    <Button 
          type="button" 
          className="w-full py-8 font-bold bg-emerald-500 text-white hover:bg-emerald-500/90"
          disabled={!isSelected || isRegistering}
          onClick={handleRegister}
        >
          <CirclePlus className="-ms-1 opacity-60" size={16} aria-hidden="true" />
          {isRegistering ? '登録中...' : '登録'}
    </Button>
    </div>
  );
}
