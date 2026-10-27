import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../lib/api";
import { REPORT_KEY } from "./useReports";
import type {
  NewOffer,
  Offer,
  OfferPage,
  OfferSummary,
  PaymentInput,
  Stage,
} from "../lib/offer";

export const OFFERS_KEY = ["offers"] as const;

interface OfferFilters {
  stage: Stage | "All";
  q: string;
  page: number;
  pageSize?: number;
  contactId?: string;
}

// GET /offers?stage=&q=&contactId=&page=&pageSize=
export function useOffers({
  stage,
  q,
  page,
  pageSize = 20,
  contactId,
}: OfferFilters) {
  return useQuery({
    queryKey: [...OFFERS_KEY, "list", { stage, q, page, pageSize, contactId }],
    queryFn: async () => {
      const { data } = await api.get<OfferPage>("/offers", {
        params: {
          stage: stage === "All" ? undefined : stage,
          q: q || undefined,
          contactId,
          page,
          pageSize,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

// GET /offers/summary
export function useOfferSummary() {
  return useQuery({
    queryKey: [...OFFERS_KEY, "summary"],
    queryFn: async () => {
      const { data } = await api.get<OfferSummary>("/offers/summary");
      return data;
    },
  });
}

// Any offer change makes the lists, the summary and the reports stale
function useRefreshOffers() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: OFFERS_KEY }),
      queryClient.invalidateQueries({ queryKey: REPORT_KEY }),
    ]);
}

// POST /offers
export function useCreateOffer() {
  const refresh = useRefreshOffers();
  return useMutation({
    mutationFn: async ({
      offer,
      payment,
    }: {
      offer: NewOffer;
      payment?: PaymentInput;
    }) => {
      const { data } = await api.post<Offer>("/offers", { ...offer, payment });
      return data;
    },
    onSuccess: refresh,
  });
}

// PATCH /offers/{id}/stage
export function useChangeStage() {
  const refresh = useRefreshOffers();
  return useMutation({
    mutationFn: async ({
      id,
      stage,
      payment,
    }: {
      id: string;
      stage: Stage;
      payment?: PaymentInput;
    }) => {
      const { data } = await api.patch<Offer>(`/offers/${id}/stage`, {
        stage,
        payment,
      });
      return data;
    },
    onSuccess: refresh,
  });
}

// PATCH /offers/{id}/payment
export function useMarkPaid() {
  const refresh = useRefreshOffers();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Offer>(`/offers/${id}/payment`, {
        status: "Paid",
      });
      return data;
    },
    onSuccess: refresh,
  });
}