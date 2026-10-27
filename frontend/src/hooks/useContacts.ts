import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../lib/api";

// These match what the backend sends (camelCase, thanks to the alias generator)
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  createdAt: string;
}

export interface ContactPage {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// What the form sends when adding a contact
export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export const CONTACTS_KEY = ["contacts"] as const;
const PAGE_SIZE = 20;

// GET /contacts?q=...&page=...&pageSize=...
export function useContacts(q: string, page: number) {
  return useQuery({
    // A new q or page means a new key, which means a new request
    queryKey: [...CONTACTS_KEY, { q, page }],
    queryFn: async () => {
      const { data } = await api.get<ContactPage>("/contacts", {
        params: { q: q || undefined, page, pageSize: PAGE_SIZE },
      });
      return data;
    },
    // Keep showing the old page while the next one loads (no empty flash)
    placeholderData: keepPreviousData,
  });
}

// POST /contacts
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ContactInput) => {
      const { data } = await api.post<Contact>("/contacts", input);
      return data;
    },
    // Mark every cached contacts list as stale so it reloads from the server
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}

// GET /contacts/{id}
export function useContact(id: string) {
  return useQuery({
    // Starts with "contacts", so invalidating CONTACTS_KEY also refreshes this
    queryKey: [...CONTACTS_KEY, "detail", id],
    queryFn: async () => {
      const { data } = await api.get<Contact>(`/contacts/${id}`);
      return data;
    },
    enabled: Boolean(id),
    retry: false, // a 404 won't fix itself, so show "not found" right away
  });
}

// PATCH /contacts/{id}
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string;
      changes: ContactInput;
    }) => {
      const { data } = await api.patch<Contact>(`/contacts/${id}`, changes);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}

// DELETE /contacts/{id}
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contacts/${id}`);
    },
    onSuccess: (_data, id) => {
      // Remove the detail first, so the page doesn't refetch the deleted
      // contact and flash "not found" before we navigate away
      queryClient.removeQueries({ queryKey: [...CONTACTS_KEY, "detail", id] });
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}

// GET /contacts?pageSize=100, for dropdowns (the first 100 contacts)
export function useContactOptions() {
  return useQuery({
    queryKey: [...CONTACTS_KEY, "options"],
    queryFn: async () => {
      const { data } = await api.get<ContactPage>("/contacts", {
        params: { page: 1, pageSize: 100 },
      });
      return data.items;
    },
    staleTime: 60_000,
  });
}