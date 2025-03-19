"use client";

import { DateInput, TimeField } from "@/components/ui/datefield-rac";
import { ClockIcon } from "lucide-react";
import { Time } from "@internationalized/date";

interface TimeInputProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function TimeInput({ value, onChange }: TimeInputProps) {
  // 文字列からTimeに変換する関数
  const parseTime = (timeString?: string): Time | undefined => {
    if (!timeString) return undefined;
    
    // "HH:MM" 形式の文字列を解析
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return undefined;
    
    return new Time(hours, minutes);
  };

  // Timeから文字列に変換する関数
  const formatTime = (time: Time | null): string => {
    if (!time) return '';
    
    // HH:MM 形式の文字列に変換
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  const handleChange = (newValue: Time | null) => {
    onChange(formatTime(newValue));
  };

  return (
    <TimeField 
      className="*:not-first:mt-2 w-full"
      value={parseTime(value)}
      onChange={handleChange}
    >
      <div className="relative">
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center justify-center ps-3">
          <ClockIcon size={16} aria-hidden="true" />
        </div>
        <DateInput className="ps-9" />
      </div>
    </TimeField>
  );
}
