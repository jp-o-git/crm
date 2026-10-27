import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import api, { getAccessToken, restoreSession } from "../lib/api";

export interface Me {
  user_id: string;
  email: string;
  full_name: string;
}

export const ME_KEY = ["me"] as const;

// Returns the user, or null when logged out. A 401 is a normal answer here, not an error.
export function useSession() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<Me | null> => {
      if (!getAccessToken()) {
        return restoreSession();
      }

      try {
        const { data } = await api.get<Me>("/auth/me");
        return data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}