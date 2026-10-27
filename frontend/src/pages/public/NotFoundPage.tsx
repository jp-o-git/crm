import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../../components/Button";
import { useSession } from "../../hooks/useSession";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { data: user } = useSession();

  // Logged-in users go back to the app, visitors go to the landing page
  const homePath = user ? "/dashboard" : "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-center">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-lg shadow-slate-200/60 sm:px-10">
        <p className="text-6xl font-bold tracking-tight text-blue-700">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          The page you're looking for doesn't exist or has been moved. Check the
          address, or go back to where you were.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </Button>
          <Button onClick={() => navigate(homePath)}>
            {user ? "Go to dashboard" : "Go to home"}
          </Button>
        </div>
      </div>
    </div>
  );
}
