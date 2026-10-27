import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { inputClass } from "./auth/TextField";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, error, hint, className = "", children, ...props },
    ref,
  ) {
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
        <select
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
        >
          {children}
        </select>
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

export default SelectField;
