"use client";

import type { MouseEventHandler } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className: string;
  name?: string;
  value?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
};

export function SubmitButton({
  idleText,
  pendingText,
  className,
  name,
  value,
  onClick,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const blocked = pending || disabled;

  return (
    <button
      type="submit"
      aria-disabled={blocked}
      disabled={blocked}
      className={className}
      name={name}
      value={value}
      onClick={onClick}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
