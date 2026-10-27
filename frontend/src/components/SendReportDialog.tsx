import { useState, type FormEvent } from "react";
import Button from "./Button";
import Modal from "./Modal";
import TextField from "./auth/TextField";
import { getErrorMessage } from "../lib/error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SendReportDialogProps {
  open: boolean;
  onClose: () => void;
  rangeLabel: string;
  defaultEmail: string;
  onSend: (email: string) => Promise<void>; // throws when sending fails
}

function SendForm({
  rangeLabel,
  defaultEmail,
  onClose,
  onSend,
}: Omit<SendReportDialogProps, "open">) {
  const [email, setEmail] = useState(defaultEmail);
  const [fieldError, setFieldError] = useState("");
  const [sendError, setSendError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    setSendError("");
    setBusy(true);
    try {
      await onSend(value);
      onClose();
    } catch (error) {
      setSendError(getErrorMessage(error));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        label="Send to"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldError}
        hint="Defaults to your account email. You can send it to anyone, like your accountant."
        required
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Sales report (PDF)</p>
        <p className="mt-0.5">{rangeLabel}, attached to the email.</p>
      </div>

      {sendError && (
        <p role="alert" className="text-sm text-red-700">
          {sendError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Send report
        </Button>
      </div>
    </form>
  );
}

export default function SendReportDialog({
  open,
  onClose,
  ...rest
}: SendReportDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send report by email"
      description="We'll email the PDF report for the date range you selected."
    >
      <SendForm onClose={onClose} {...rest} />
    </Modal>
  );
}
