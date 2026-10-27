import SelectField from "./SelectField";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from "../lib/offer";
import { formatCurrency } from "../lib/format";

interface PaymentFieldsProps {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  onMethodChange: (method: PaymentMethod) => void;
  onStatusChange: (status: PaymentStatus) => void;
}

export default function PaymentFields({
  amount,
  method,
  status,
  onMethodChange,
  onStatusChange,
}: PaymentFieldsProps) {
  const label = amount > 0 ? formatCurrency(amount) : "this amount";

  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">
        Payment
      </legend>
      <p className="text-sm text-slate-600">
        A transaction for {label} will be recorded for this deal.
      </p>
      <SelectField
        label="Payment method"
        value={method}
        onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Payment status"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as PaymentStatus)}
      >
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectField>
    </fieldset>
  );
}
