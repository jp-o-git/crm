import type { ReactNode } from "react";
import type { PaymentStatus, Stage } from "../lib/offer";

type Tone = "gray" | "blue" | "amber" | "green" | "red";

const tones: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
};

const stageTones: Record<Stage, Tone> = {
  New: "gray",
  Contacted: "blue",
  Proposal: "amber",
  Won: "green",
  Lost: "red",
};

const statusTones: Record<PaymentStatus, Tone> = {
  Paid: "green",
  Pending: "amber",
};

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge tone={stageTones[stage]}>{stage}</Badge>;
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={statusTones[status]}>{status}</Badge>;
}
