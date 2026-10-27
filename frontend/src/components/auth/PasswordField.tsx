import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "../Button";
import { inputClass } from "./TextField";

interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  error?: string;
  hint?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { label, error, hint, className = "", ...props },
    ref,
  ) {
    const id = useId();
    const [visible, setVisible] = useState(false);
    const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error)}
            aria-describedby={messageId}
            className={[
              inputClass,
              "pr-11",
              error ? "border-red-500" : "",
              className,
            ].join(" ")}
            {...props}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 text-slate-500"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((prev) => !prev)}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
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

export default PasswordField;
