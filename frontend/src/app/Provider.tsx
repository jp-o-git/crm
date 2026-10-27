import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const useQuery = new QueryClient();

export function Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={useQuery}>{children}</QueryClientProvider>
  );
}
