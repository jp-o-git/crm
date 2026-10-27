import { Link } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contacts", label: "Contacts" },
  { to: "/offers", label: "Offers" },
  { to: "/reports", label: "Reports" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Client<span className="text-blue-700">Desk</span>
          </p>
          <p className="text-sm text-slate-500">
            Keep track of your contacts, deals and payments.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © {year} ClientDesk. Built as a portfolio project.
      </div>
    </footer>
  );
}
