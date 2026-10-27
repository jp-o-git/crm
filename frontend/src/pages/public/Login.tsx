import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import api, { setAccessToken } from "../../lib/api";
import Button from "../../components/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";
import PasswordField from "../../components/auth/PasswordField";
import { isAxiosError } from "axios";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean(location.state?.registered);
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: async () => {
      const form = new URLSearchParams();
      form.append("username", email); // OAuth2PasswordRequestForm calls the email "username"
      form.append("password", password);
      const { data } = await api.post<{ access_token: string }>(
        "/auth/token",
        form,
      );
      return data;
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      queryClient.removeQueries({ queryKey: ["me"] }); // drop any cached logged-out result
      navigate("/dashboard");
    },
  });

  const loginError =
    login.isError &&
    isAxiosError(login.error) &&
    login.error.response?.status === 403
      ? "Verify your email before signing in."
      : "Incorrect email or password. Check your details and try again.";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Sign up
          </Link>
        </>
      }
    >
      {justRegistered && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          Your account is ready. Sign in to continue.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {login.isError && (
          <p role="alert" className="text-sm text-red-600">
            {loginError}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          loading={login.isPending}
          disabled={!email || !password}
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
