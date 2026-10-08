"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";

export type ComboOption<T extends string> = {
  value: T;
  label: string;
};

type ComboBoxProps<T extends string> = {
  value: T;
  options: readonly ComboOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  prefix?: ReactNode;
};

export function ComboBox<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  prefix,
}: ComboBoxProps<T>) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => selectedRef.current?.focus(), 0);
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`combo-trigger ${className}`}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
        >
          {prefix}
          <span className="combo-value">{selected?.label}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          id={listId}
          className="combo-menu"
          role="listbox"
          aria-label={ariaLabel}
          sideOffset={6}
          align="end"
          dir="rtl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {options.map((option) => (
            <button
              key={option.value}
              ref={option.value === value ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? "is-selected" : ""}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <Check size={15} aria-hidden="true" /> : <span className="combo-check-space" aria-hidden="true" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
