"use client"

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
Popover,
PopoverContent,
PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value: Date | undefined;
    className?: string;
    placeholder?: string;
    onChange?: (date: Date) => void; 
};

export const DatePicker = ({
  value,
  className,
  placeholder = "Select date",
  onChange,
}: DatePickerProps) => {
  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (date && onChange) {
        onChange(date);
      }
    },
    [onChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "w-full justify-start text-left font-normal px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
