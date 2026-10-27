import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ME_KEY, useSession } from "../hooks/useSession";

export default function ProtectedRoute() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useSession();

  // If the session expires while the user is on a page, send them to login
  useEffect(() => {
    const handleExpired = () => queryClient.setQueryData(ME_KEY, null);
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-blue-700">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
