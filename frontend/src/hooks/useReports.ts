import { keepPreviousData, useQuery, useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import type { Stage } from "../lib/offer";

export interface Report {
  byStage: Record<Stage, number>;
  revenue: { date: string; total: number }[];
  topContacts: {
    contactId: string;
    name: string;
    company: string;
    count: number;
    total: number;
  }[];
}

export const REPORT_KEY = ["reports"] as const;

// GET /reports?days=30   (days = null means all time)
export function useReport(days: number | null) {
  return useQuery({
    queryKey: [...REPORT_KEY, { days }],
    queryFn: async () => {
      const { data } = await api.get<Report>("/reports", {
        params: { days: days ?? undefined },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

const rangeSlug = (days: number | null) =>
  days ? `last-${days}-days` : "all-time";

// GET /reports/pdf, then save the file in the browser
export function useDownloadReport() {
  return useMutation({
    mutationFn: async (days: number | null) => {
      const { data } = await api.get<Blob>("/reports/pdf", {
        params: { days: days ?? undefined },
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clientdesk-report-${rangeSlug(days)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}

// POST /reports/email
export function useEmailReport() {
  return useMutation({
    mutationFn: async ({
      days,
      email,
    }: {
      days: number | null;
      email: string;
    }) => {
      await api.post("/reports/email", { days, email });
    },
  });
}