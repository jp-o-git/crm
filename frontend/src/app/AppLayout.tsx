import { Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken } from "../lib/api";
import { ME_KEY, useSession } from "../hooks/useSession";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useSession();

  const logout = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      setAccessToken(null);
      // Remove cached app data, then mark the session as logged out
      queryClient.removeQueries({
        predicate: (q) => q.queryKey[0] !== ME_KEY[0],
      });
      queryClient.setQueryData(ME_KEY, null);
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <NavBar
        isAuthenticated
        userName={me?.full_name}
        onLogout={() => logout.mutate()}
      />
      <main className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
      <Footer isAuthenticated />
    </div>
  );
}
