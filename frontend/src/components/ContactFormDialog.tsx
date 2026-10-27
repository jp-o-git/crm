import { useState, type FormEvent } from "react";
import Button from "./Button";
import Modal from "./Modal";
import TextField from "./auth/TextField";
import { getErrorMessage } from "../lib/error";
import type { ContactInput } from "../hooks/useContacts";

interface ContactFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  submitLabel: string;
  initial?: ContactInput; // pass this to pre-fill the form (edit mode)
  onSubmit: (contact: ContactInput) => Promise<void>;
}

interface Errors {
  name?: string;
  email?: string;
  company?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactForm({
  initial,
  submitLabel,
  onClose,
  onSubmit,
}: Pick<
  ContactFormDialogProps,
  "initial" | "submitLabel" | "onClose" | "onSubmit"
>) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!name.trim()) next.name = "Enter the contact's name.";
    if (!EMAIL_REGEX.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (!company.trim()) next.company = "Enter the company name.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
      });
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        label="Full name"
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />
      <TextField
        label="Phone"
        type="tel"
        autoComplete="off"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        hint="Optional"
      />
      <TextField
        label="Company"
        autoComplete="off"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        error={errors.company}
        required
      />

      {submitError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function ContactFormDialog({
  open,
  onClose,
  title,
  description,
  submitLabel,
  initial,
  onSubmit,
}: ContactFormDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
    >
      {/* Modal only renders this while open, so the form re-fills from `initial` each time */}
      <ContactForm
        initial={initial}
        submitLabel={submitLabel}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
