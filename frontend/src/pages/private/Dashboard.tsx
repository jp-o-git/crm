import { Briefcase, Clock, Users, Wallet } from "lucide-react";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StageBars from "../../components/StageBars";
import { useContacts } from "../../hooks/useContacts";
import { useOfferSummary, useOffers } from "../../hooks/useOffers";
import { EMPTY_COUNTS } from "../../lib/offer";
import { formatCurrency, formatDate } from "../../lib/format";

export default function Dashboard() {
  const { data: summary } = useOfferSummary();
  const { data: contactPage } = useContacts("", 1);
  const { data: recentPage } = useOffers({
    stage: "Won",
    q: "",
    page: 1,
    pageSize: 5,
  });
  const recent = recentPage?.items ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick look at your clients, offers and payments."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total contacts"
          value={contactPage?.total ?? "—"}
        />
        <StatCard
          icon={Briefcase}
          label="Open offers"
          value={summary?.openCount ?? "—"}
        />
        <StatCard
          icon={Wallet}
          label="Total revenue"
          value={summary ? formatCurrency(summary.paidValue) : "—"}
        />
        <StatCard
          icon={Clock}
          label="Pending payments"
          value={summary ? formatCurrency(summary.pendingValue) : "—"}
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <Card title="Recent activity" className="xl:col-span-2">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-600">
              Offers you close as Won will show up here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((o) => (
                <li
                  key={o.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6 text-slate-900">
                      Offer “{o.title}” closed as Won,{" "}
                      {formatCurrency(o.amount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {o.contactName}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-500">
                    {formatDate(o.closedAt ?? o.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Offers by stage">
          <StageBars counts={summary?.byStage ?? EMPTY_COUNTS} />
        </Card>
      </div>
    </>
  );
}
