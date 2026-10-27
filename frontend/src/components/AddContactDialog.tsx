import { useState, type FormEvent } from "react";
import Button from "./Button";
import Modal from "./Modal";
import TextField from "./auth/TextField";
import { getErrorMessage } from "../lib/error";
import type { ContactInput } from "../hooks/useContacts";

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
  // Returns a Promise so the form can wait for the server's answer
  onAdd: (contact: ContactInput) => Promise<void>;
}

interface Errors {
  name?: string;
  email?: string;
  company?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactForm({
  onClose,
  onAdd,
}: Pick<AddContactDialogProps, "onClose" | "onAdd">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Check the form in the browser first (fast, no request needed)
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter the contact's name.";
    if (!EMAIL_REGEX.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (!company.trim()) next.company = "Enter the company name.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // 2. Send it to the backend and wait
    setSaving(true);
    setSubmitError(null);
    try {
      await onAdd({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
      });
      onClose(); // only close once the server said OK
    } catch (error) {
      setSubmitError(getErrorMessage(error)); // e.g. duplicate email (409)
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
          Add contact
        </Button>
      </div>
    </form>
  );
}

export default function AddContactDialog({
  open,
  onClose,
  onAdd,
}: AddContactDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add contact"
      description="Save the details of someone you work with."
    >
      <ContactForm onClose={onClose} onAdd={onAdd} />
    </Modal>
  );
}
