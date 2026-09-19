"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldProps {}

const wrapper = "block w-full";

const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const fieldBase =
  "w-full px-3 rounded-lg border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500";

const fieldNormal =
  "border-gray-300 focus:ring-black focus:border-black";

const fieldError =
  "border-red-600 focus:ring-red-600 focus:border-red-600";

const inputSize = "h-10";

const textareaSize = "min-h-[96px] py-2 resize-y";

const hintClass = "text-xs text-gray-500 mt-1.5";

const errorClass = "text-xs text-red-600 mt-1.5";

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={wrapper}>
      {label && (
        <label htmlFor={inputId} className={labelClass}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={`${fieldBase} ${inputSize} ${error ? fieldError : fieldNormal} ${className}`}
        {...props}
      />
      {error ? (
        <p id={messageId} role="alert" className={errorClass}>
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className={hintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, id, className = "", ...props }, ref) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = `${textareaId}-message`;
    const hasMessage = Boolean(error || hint);

    return (
      <div className={wrapper}>
        {label && (
          <label htmlFor={textareaId} className={labelClass}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={`${fieldBase} ${textareaSize} ${error ? fieldError : fieldNormal} ${className}`}
          {...props}
        />
        {error ? (
          <p id={messageId} role="alert" className={errorClass}>
            {error}
          </p>
        ) : hint ? (
          <p id={messageId} className={hintClass}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

export default Input;