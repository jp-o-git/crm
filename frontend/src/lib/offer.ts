export const STAGES = ["New", "Contacted", "Proposal", "Won", "Lost"] as const;
export type Stage = (typeof STAGES)[number];
export type PaymentMethod = "Cash" | "Bank Transfer" | "Credit Card" | "GCash";
export type PaymentStatus = "Paid" | "Pending";

export interface OfferPayment {
  reference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface Offer {
  id: string;
  contactId: string;
  contactName: string;
  title: string;
  amount: number;
  stage: Stage;
  createdAt: string;
  closedAt: string | null;
  payment: OfferPayment | null; // null unless the offer is Won
}

export interface OfferPage {
  items: Offer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OfferSummary {
  openCount: number;
  wonCount: number;
  lostCount: number;
  wonValue: number;
  paidValue: number;
  pendingValue: number;
  byStage: Record<Stage, number>;
}

export interface NewOffer {
  contactId: string;
  title: string;
  amount: number;
  stage: Stage;
}

export interface PaymentInput {
  method: PaymentMethod;
  status: PaymentStatus;
}

export const EMPTY_COUNTS: Record<Stage, number> = {
  New: 0,
  Contacted: 0,
  Proposal: 0,
  Won: 0,
  Lost: 0,
};

export const STAGE_LABELS: Record<Stage, string> = {
  New: "New – offer logged",
  Contacted: "Contacted – email sent",
  Proposal: "Proposal – sent or replied",
  Won: "Won – deal closed",
  Lost: "Lost – not closed",
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Bank Transfer",
  "GCash",
  "Credit Card",
  "Cash",
];

export const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Paid"];

export const isOpenStage = (stage: Stage) => stage !== "Won" && stage !== "Lost";