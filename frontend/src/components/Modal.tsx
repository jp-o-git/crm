import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

// Uses the native <dialog> element, which handles focus trapping,
// the Escape key and the backdrop for us.
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop targets the dialog itself
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/50"
    >
      {/* Content is only rendered while open, so forms reset every time */}
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2
                id="modal-title"
                className="text-lg font-bold tracking-tight text-slate-900"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-2 shrink-0"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
