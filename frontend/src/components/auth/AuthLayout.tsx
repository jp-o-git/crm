import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">C</span>
        <span>Client<span className="text-blue-700">Desk</span></span>
      </Link>

      <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </main>

      {footer && <p className="mt-6 text-sm text-slate-600">{footer}</p>}
    </div>
  );
}
