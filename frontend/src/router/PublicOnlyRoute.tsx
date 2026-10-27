import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSession } from "../hooks/useSession";

export default function PublicOnlyRoute() {
  const { data: user, isLoading } = useSession();
  const { pathname } = useLocation();

  if (isLoading && pathname !== "/") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-blue-700">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
