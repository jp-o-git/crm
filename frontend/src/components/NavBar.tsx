import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, UsersRound, X } from "lucide-react";
import Button from "./Button";

interface NavBarProps {
  userName?: string;
  onLogout?: () => void;
}

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contacts", label: "Contacts" },
  { to: "/offers", label: "Offers" },
  { to: "/reports", label: "Reports" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export default function NavBar({ userName = "Guest", onLogout }: NavBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav
        className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
            <UsersRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Client<span className="text-blue-700">Desk</span></span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop user area */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {userName.trim().charAt(0).toUpperCase()}
            </span>
            <span className="max-w-40 truncate text-sm font-medium text-slate-700">{userName}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Log out
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </Button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 pt-3">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-semibold">{userName.trim().charAt(0).toUpperCase()}</span>
              {userName}
            </span>
            <Button variant="secondary" size="sm" onClick={onLogout}>
              Log out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
