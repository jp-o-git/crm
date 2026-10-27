import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import api from "../../lib/api";
import Button from "../../components/Button";
import AuthLayout from "../../components/auth/AuthLayout";
import TextField from "../../components/auth/TextField";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const requestLink = useMutation({
    mutationFn: async () => {
      await api.post("/auth/signup/start", { email });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    requestLink.mutate();
  };

  if (requestLink.isSuccess) {
    return (
      <AuthLayout title="Check your email">
        <div className="text-center">
          <div           className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            We sent a verification link to{" "}
            <span className="font-medium text-slate-900">{email}</span>. Open it
            to finish creating your account.
          </p>
          <Button
            variant="secondary"
            className="mt-6 w-full"
            onClick={() => requestLink.reset()}
          >
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Enter your email and we'll send you a link to continue."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />

        {requestLink.isError && (
          <p role="alert" className="text-sm text-red-600">
            We couldn't send the email. Try again in a moment.
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={requestLink.isPending}
        >
          Send verification link
        </Button>
      </form>
    </AuthLayout>
  );
}
