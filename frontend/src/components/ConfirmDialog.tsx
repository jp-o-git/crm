import { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { getErrorMessage } from "../lib/error";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

function ConfirmBody({
  confirmLabel,
  onClose,
  onConfirm,
}: Pick<ConfirmDialogProps, "confirmLabel" | "onClose" | "onConfirm">) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
    >
      <ConfirmBody
        confirmLabel={confirmLabel}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  );
}
