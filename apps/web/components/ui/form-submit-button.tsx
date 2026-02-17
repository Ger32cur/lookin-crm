'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type FormSubmitButtonProps = {
  idleLabel: string;
  loadingLabel: string;
  className?: string;
  icon?: ReactNode;
};

export function FormSubmitButton({ idleLabel, loadingLabel, className, icon }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
    >
      {icon}
      {pending ? loadingLabel : idleLabel}
    </button>
  );
}
