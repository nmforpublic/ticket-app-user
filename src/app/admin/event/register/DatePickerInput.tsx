"use client";

import { Calendar } from "@/components/ui/calendar-rac";
import { DateInput } from "@/components/ui/datefield-rac";
import { CalendarIcon } from "lucide-react";
import { Button, DatePicker, Dialog, Group, Popover } from "react-aria-components";
import { DateValue, getLocalTimeZone, CalendarDate } from "@internationalized/date";

interface DatePickerInputProps {
  value?: Date;
  onChange: (value: Date) => void;
}

export default function DatePickerInput({ value, onChange }: DatePickerInputProps) {
  // DateをDateValueに変換
  const dateValue = value 
    ? new CalendarDate(
        value.getFullYear(),
        value.getMonth() + 1,
        value.getDate()
      )
    : undefined;

  // DateValueをDateに変換するハンドラー
  const handleChange = (newValue: DateValue | null) => {
    if (!newValue) return;
    
    // DateValueをJavaScript Dateに変換
    const jsDate = newValue.toDate(getLocalTimeZone());
    onChange(jsDate);
  };

  return (
    <DatePicker 
      className="*:not-first:mt-2 w-full" 
      value={dateValue} 
      onChange={handleChange}
    >
      <div className="flex">
        <Group className="w-full">
          <DateInput className="pe-9" />
        </Group>
        <Button className="text-muted-foreground/80 hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:ring-[3px]">
          <CalendarIcon size={16} />
        </Button>
      </div>
      <Popover
        className="bg-background text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 rounded-lg border shadow-lg outline-hidden"
        offset={4}
      >
        <Dialog className="max-h-[inherit] overflow-auto p-2">
          <Calendar />
        </Dialog>
      </Popover>
    </DatePicker>
  );
}
