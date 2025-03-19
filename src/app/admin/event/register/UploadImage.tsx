'use client';
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleUserRoundIcon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';

interface UploadImageProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function UploadImage({ value, onChange }: UploadImageProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [fileName, setFileName] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB制限の例)
    if (file.size > 5 * 1024 * 1024) {
      setError("ファイルサイズは5MB以下にしてください");
      return;
    }

    setFileName(file.name);
    setError(null);
    
    // ファイルをプレビュー表示するためのURL生成
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Supabaseにアップロード
    setUploading(true);
    try {
      const supabase = createClient();
      
      // ファイル名の衝突を避けるためにUUIDを使用
      const fileExt = file.name.split('.').pop();
      const filePath = `${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);
      
      if (error) {
        console.error('画像アップロードエラー:', error);
        throw error;
      }
      
      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);
      
      // 公開URLをフォームに設定
      onChange(urlData.publicUrl);
    } catch (error: any) {
      console.error('画像アップロードエラー:', error);
      setError(error.message || "アップロード中にエラーが発生しました");
      // プレビューを削除
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(value); // 元の値に戻す
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    // 現在の画像がSupabaseに保存されている場合、削除する
    if (value && value.includes('supabase.co')) {
      try {
        const supabase = createClient();
        
        // URLからファイルパスを抽出
        const url = new URL(value);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/event-images\/(.*)/);
        
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1];
          await supabase.storage
            .from('event-images')
            .remove([filePath]);
        }
      } catch (error) {
        console.error('画像削除エラー:', error);
      }
    }
    
    setPreviewUrl(undefined);
    setFileName(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange("");
  };

  return (
    <div className="w-full">
      <div className="relative w-full flex flex-col items-center">
        {previewUrl ? (
          <div className="relative w-full mb-4 flex justify-center">
            <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
              <img
                className="h-full w-full object-cover"
                src={previewUrl}
                alt="プレビュー画像"
              />
              <Button
                onClick={handleRemove}
                size="icon"
                variant="destructive"
                className="border-background absolute top-2 right-2 size-8 rounded-full border-2"
                aria-label="画像を削除"
                disabled={uploading}
              >
                <XIcon size={20} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center mb-4">
            <div className="aspect-square w-full max-w-md bg-gray-100 rounded-lg flex items-center justify-center">
              <CircleUserRoundIcon className="opacity-60" size={48} />
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 mb-2 text-sm">{error}</div>
        )}
        
        <Button
          variant="outline"
          className="px-6 py-2 font-bold"
          onClick={handleThumbnailClick}
          aria-label={previewUrl ? "画像を変更" : "画像をアップロード"}
          disabled={uploading}
        >
          {uploading ? "アップロード中..." : (previewUrl ? "画像を変更" : "画像をアップロード")}
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          aria-label="画像ファイルをアップロード"
        />
      </div>
      <div className="sr-only" aria-live="polite" role="status">
        {uploading ? "画像をアップロード中です" : (previewUrl ? "画像がアップロードされ、プレビューが利用可能です" : "画像がアップロードされていません")}
      </div>
    </div>
  );
}
