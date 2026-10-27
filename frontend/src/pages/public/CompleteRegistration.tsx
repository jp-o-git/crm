import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import api, { setAccessToken } from "../../lib/api";
import Button from "../../components/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";
import PasswordField from "../../components/auth/PasswordField";

interface Errors {
  fullName?: string;
  password?: string;
  confirmPassword?: string;
}

export default function CompleteRegistration() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = params.get("token") ?? "";

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const verify = useQuery({
    queryKey: ["signup-check", token],
    queryFn: async () => {
      const { data } = await api.post<{ email: string }>("/auth/signup/check", {
        token,
      });
      return data;
    },
    enabled: Boolean(token),
    retry: false,
  });

  const complete = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ access_token: string }>(
        "/auth/signup/complete",
        {
          token,
          full_name: fullName.trim(),
          password,
        },
      );
      return data;
    },
    onSuccess: (data) => {
      // Signing up also logs the user in
      setAccessToken(data.access_token);
      queryClient.removeQueries({ queryKey: ["me"] });
      navigate("/dashboard", { replace: true });
    },
  });

  const completeError =
    isAxiosError(complete.error) && complete.error.response?.status === 409
      ? "This email is already registered. Sign in instead."
      : "We couldn't create your account. Try again or request a new link.";

  const validate = (): Errors => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirmPassword !== password)
      next.confirmPassword = "Passwords don't match.";
    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length === 0) complete.mutate();
  };

  if (verify.isLoading) {
    return (
      <AuthLayout title="Verifying your link">
        <div className="flex justify-center py-4 text-blue-700">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
        </div>
      </AuthLayout>
    );
  }

  if (!token || verify.isError || !verify.data) {
    return (
      <AuthLayout title="This link doesn't work">
        <p className="text-sm text-slate-600">
          The link is invalid or has expired. Request a new one to continue.
        </p>
        <Link to="/register">
          <Button className="mt-6 w-full">Request a new link</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Finish creating your account"
      subtitle="Your email is verified. Add your details to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          required
        />
        <TextField
          label="Email"
          type="email"
          value={verify.data.email}
          readOnly
          hint="This email was verified and can't be changed."
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters."
          required
        />
        <PasswordField
          label="Repeat password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
        />

        {complete.isError && (
          <p role="alert" className="text-sm text-red-600">
            {completeError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={complete.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
