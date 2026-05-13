import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface BaseProps {
  label: string;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  /** Additional className on the wrapper div. */
  className?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode };

const inputClass = (hasError: boolean) =>
  clsx(
    'w-full rounded-md border bg-white px-3 py-2 text-sm text-midnight-900 shadow-sm',
    'placeholder:text-midnight-500',
    'focus-visible:outline-none focus-visible:ring-2',
    hasError
      ? 'border-rose-300 focus-visible:ring-rose-400'
      : 'border-midnight-200 focus-visible:ring-primary-500',
  );

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, required, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = hint || error ? `${inputId}-desc` : undefined;
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-midnight-900">
        {label}
        {required ? <span aria-hidden="true" className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descId}
        className={inputClass(!!error)}
        {...rest}
      />
      {error ? (
        <p id={descId} className="text-xs text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="text-xs text-midnight-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextArea(
  { label, error, hint, required, className, id, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = hint || error ? `${inputId}-desc` : undefined;
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-midnight-900">
        {label}
        {required ? <span aria-hidden="true" className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descId}
        className={inputClass(!!error)}
        {...rest}
      />
      {error ? (
        <p id={descId} className="text-xs text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="text-xs text-midnight-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, error, hint, required, className, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = hint || error ? `${inputId}-desc` : undefined;
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-midnight-900">
        {label}
        {required ? <span aria-hidden="true" className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      <select
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descId}
        className={inputClass(!!error)}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={descId} className="text-xs text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="text-xs text-midnight-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/** Small helper for a form-level error message (non-field) to show near the submit row. */
export function FormRootError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
      {message}
    </div>
  );
}
