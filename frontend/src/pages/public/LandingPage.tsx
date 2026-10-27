import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Mail,
  Receipt,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";
import Button from "../../components/Button";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Step {
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Contacts",
    description:
      "Save names, emails, phone numbers and companies. Search and edit them in seconds.",
  },
  {
    icon: Briefcase,
    title: "Deals",
    description:
      "Track every potential sale and move it from New to Contacted, Proposal, Won or Lost.",
  },
  {
    icon: Receipt,
    title: "Transactions",
    description:
      "Close a deal as Won and record the amount, payment method and whether you've been paid.",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description:
      "Write down what was said on each call so you never forget a follow-up.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "See your contacts, open deals, revenue and pending payments the moment you log in.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description:
      "Filter by date, see deals by stage and monthly revenue, and find your top clients.",
  },
];

const steps: Step[] = [
  {
    title: "Add your contacts",
    description: "Enter the people and companies you work with.",
  },
  {
    title: "Track your deals",
    description:
      "Create a deal for each opportunity and update its stage as it moves.",
  },
  {
    title: "Close and get paid",
    description:
      "Mark a deal as Won, record the payment, and watch your revenue update.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <NavBar isAuthenticated={false} />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-800">
                Simple CRM for freelancers and small businesses
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                Keep track of every client, deal and payment
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                ClientDesk is a simple CRM for freelancers and small businesses.
                Know who you're talking to, what you're selling and how much
                you've earned, all in one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate("/register")}>
                  Create your account
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  See features
                </Button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Keep your contacts, pipeline and payments organized in one
                place.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Workspace overview
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                      Your business at a glance
                    </p>
                  </div>
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                    This month
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-3">
                  {[
                    ["Contacts", "128"],
                    ["Open deals", "24"],
                    ["Revenue", "$18,420"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {label}
                      </p>
                      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Recent deals
                    </p>
                    <span className="text-xs font-medium text-slate-500">
                      Pipeline
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100 px-4">
                    {[
                      ["Northstar rebrand", "Proposal", "$6,800"],
                      ["Website refresh", "Contacted", "$3,200"],
                      ["Quarterly support", "Won", "$1,500"],
                    ].map(([title, stage, amount]) => (
                      <li
                        key={title}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{stage}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
        >
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Everything you need to manage your clients
            </h2>
            <p className="mt-3 text-slate-600">
              No complicated setup. Add your data and start working.
            </p>
          </div>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              How it works
            </h2>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Reports highlight */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">
                Send your report by email
              </h2>
              <p className="mt-2 text-slate-600">
                Pick a date range, review your revenue and top clients, then
                send the summary to your inbox or your accountant with one
                click.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/register")}>
              Try it now
            </Button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to get organized?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Create your account and add your first contact in under a minute.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8"
              onClick={() => navigate("/register")}
            >
              Create your account
            </Button>
          </div>
        </section>
      </main>
      <Footer isAuthenticated={false} />
    </div>
  );
}
