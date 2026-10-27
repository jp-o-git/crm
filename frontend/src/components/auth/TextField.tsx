import { forwardRef, useId, type InputHTMLAttributes } from "react";

export const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 read-only:bg-slate-100 read-only:text-slate-600 disabled:opacity-60";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, className = "", ...props }, ref) {
    const id = useId();
    const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={messageId}
          className={[
            inputClass,
            error ? "border-red-500" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error ? (
          <p id={messageId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={messageId} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

export default TextField;
