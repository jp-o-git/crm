import { useState, type FormEvent } from "react";
import Button from "./Button";
import Modal from "./Modal";
import TextField from "./auth/TextField";
import SelectField from "./SelectField";
import PaymentFields from "./PaymentFields";
import {
  STAGES,
  STAGE_LABELS,
  type NewOffer,
  type PaymentInput,
  type PaymentMethod,
  type PaymentStatus,
  type Stage,
} from "../lib/offer";
import type { Contact } from "../hooks/useContacts";

interface AddOfferDialogProps {
  open: boolean;
  contacts: Contact[];
  defaultContactId?: string; // handy for the "Add deal" button on ContactDetail
  onClose: () => void;
  onAdd: (offer: NewOffer, payment?: PaymentInput) => void;
}

interface Errors {
  contactId?: string;
  title?: string;
  amount?: string;
}

function OfferForm({
  contacts,
  defaultContactId = "",
  onClose,
  onAdd,
}: Omit<AddOfferDialogProps, "open">) {
  const [contactId, setContactId] = useState(defaultContactId);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("New");
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("Pending");
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!contactId) next.contactId = "Choose a contact.";
    if (!title.trim()) next.title = "Enter what the offer is for.";
    if (!(Number(amount) > 0)) next.amount = "Enter an amount above 0.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onAdd(
      { contactId, title: title.trim(), amount: Number(amount), stage },
      stage === "Won" ? { method, status: payStatus } : undefined,
    );
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <SelectField
        label="Contact"
        value={contactId}
        onChange={(e) => setContactId(e.target.value)}
        error={errors.contactId}
        required
      >
        <option value="">Select a contact</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} – {c.company}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Offer"
        autoComplete="off"
        placeholder="e.g. Website redesign"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        required
      />

      <TextField
        label="Amount (USD)"
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        autoComplete="off"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
        required
      />

      <SelectField
        label="Where is this offer now?"
        value={stage}
        onChange={(e) => setStage(e.target.value as Stage)}
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </SelectField>

      {stage === "Won" && (
        <PaymentFields
          amount={Number(amount)}
          method={method}
          status={payStatus}
          onMethodChange={setMethod}
          onStatusChange={setPayStatus}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Add offer</Button>
      </div>
    </form>
  );
}

export default function AddOfferDialog({
  open,
  onClose,
  ...rest //Collect the remaining properties into one object.
}: AddOfferDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add offer"
      description="Log an offer you made and where it stands."
    >
      <OfferForm onClose={onClose} {...rest} />
    </Modal>
  );
}
