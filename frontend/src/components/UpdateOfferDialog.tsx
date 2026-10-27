import { useState, type FormEvent } from "react";
import Button from "./Button";
import Modal from "./Modal";
import SelectField from "./SelectField";
import PaymentFields from "./PaymentFields";
import {
  STAGES,
  STAGE_LABELS,
  type Offer,
  type PaymentInput,
  type PaymentMethod,
  type PaymentStatus,
  type Stage,
} from "../lib/offer";
import { formatCurrency } from "../lib/format";

interface UpdateOfferDialogProps {
  deal: Offer | null;
  contactName?: string;
  onClose: () => void;
  onSave: (stage: Stage, payment?: PaymentInput) => void;
}

function UpdateForm({
  deal,
  onClose,
  onSave,
}: Pick<UpdateOfferDialogProps, "onClose" | "onSave"> & { deal: Offer }) {
  // Default to the next step in the pipeline (New → Contacted → Proposal → Won)
  const [stage, setStage] = useState<Stage>(
    STAGES[STAGES.indexOf(deal.stage) + 1] ?? "Won",
  );
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("Pending");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(stage, stage === "Won" ? { method, status: payStatus } : undefined);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-700">
        <span className="font-medium text-slate-900">{deal.title}</span>
        {" · "}
        {formatCurrency(deal.amount)}
      </p>

      <SelectField
        label="Move to"
        value={stage}
        onChange={(e) => setStage(e.target.value as Stage)}
      >
        {STAGES.filter((s) => s !== deal.stage).map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </SelectField>

      {stage === "Won" && (
        <PaymentFields
          amount={deal.amount}
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
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export default function UpdateOfferDialog({
  deal,
  contactName,
  onClose,
  onSave,
}: UpdateOfferDialogProps) {
  return (
    <Modal
      open={deal !== null}
      onClose={onClose}
      title="Update offer"
      description={contactName ? `Offer for ${contactName}.` : undefined}
    >
      {deal && <UpdateForm deal={deal} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}
