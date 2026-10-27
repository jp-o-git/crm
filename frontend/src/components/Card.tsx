import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-base font-semibold tracking-tight text-slate-900">{title}</h2>
      )}
      {children}
    </section>
  );
}
