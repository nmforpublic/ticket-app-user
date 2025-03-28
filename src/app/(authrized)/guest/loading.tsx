import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 overflow-auto flex flex-col gap-4">
      <Label className="font-bold text-base">
        あなたが招待可能なイベント一覧
      </Label>
      
      {/* 複数のイベントスケルトンを表示 */}
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-sm"
        >
          {/* 日時 */}
          <div className="w-full text-sm font-medium tracking-wider flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Badge variant="outline" className="gap-1.5">
              <span
                className="size-1.5 rounded-full bg-gray-400"
                aria-hidden="true"
              ></span>
              <Skeleton className="h-3 w-12" />
            </Badge>
          </div>

          <Separator />

          {/* 写真とイベント名 */}
          <div className="flex flex-row items-center justify-start gap-4 w-full">
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            
            {/* イベント名と詳細 */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <Separator />

          <div className="w-full flex flex-col items-center gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
