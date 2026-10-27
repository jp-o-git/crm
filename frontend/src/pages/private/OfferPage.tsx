import { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  CircleX,
  Percent,
  Plus,
  Search,
  Trophy,
} from "lucide-react";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { StageBadge, StatusBadge } from "../../components/Badge";
import AddOfferDialog from "../../components/AddOfferDialog";
import UpdateOfferDialog from "../../components/UpdateOfferDialog";
import { useDebounce } from "../../hooks/useDebounce";
import { useContactOptions } from "../../hooks/useContacts";
import {
  useChangeStage,
  useCreateOffer,
  useMarkPaid,
  useOfferSummary,
  useOffers,
} from "../../hooks/useOffers";
import {
  STAGES,
  isOpenStage,
  type NewOffer,
  type Offer,
  type PaymentInput,
  type Stage,
} from "../../lib/offer";
import { formatCurrency, formatDate } from "../../lib/format";
import { getErrorMessage } from "../../lib/error";

type Filter = "All" | Stage;
const filters: Filter[] = ["All", ...STAGES];

export default function OffersPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);
  const { data, isLoading, isError, error, refetch, isPlaceholderData } =
    useOffers({ stage: filter, q: debouncedQuery, page });
  const { data: summary } = useOfferSummary();
  const { data: contactOptions = [] } = useContactOptions();

  const createOffer = useCreateOffer();
  const changeStage = useChangeStage();
  const markPaid = useMarkPaid();

  const notify = (text: string) => {
    setFailure(null);
    setMessage(text);
    window.setTimeout(() => setMessage(null), 4000);
  };
  const fail = (e: unknown) => {
    setMessage(null);
    setFailure(getErrorMessage(e));
  };

  const won = summary?.wonCount ?? 0;
  const lost = summary?.lostCount ?? 0;
  const winRate = won + lost === 0 ? 0 : Math.round((won / (won + lost)) * 100);
  const rows = data?.items ?? [];

  const handleAdd = (offer: NewOffer, payment?: PaymentInput) => {
    createOffer.mutate(
      { offer, payment },
      {
        onSuccess: () => {
          setFilter("All");
          setQuery("");
          setPage(1);
          notify(
            offer.stage === "Won"
              ? `“${offer.title}” was added as Won and an invoice was created.`
              : `“${offer.title}” was added as ${offer.stage}.`,
          );
        },
        onError: fail,
      },
    );
  };

  const handleSave = (stage: Stage, payment?: PaymentInput) => {
    const target = editing;
    if (!target) return;
    changeStage.mutate(
      { id: target.id, stage, payment },
      {
        onSuccess: () =>
          notify(
            stage === "Won"
              ? `“${target.title}” was marked Won and an invoice was created.`
              : `“${target.title}” was moved to ${stage}.`,
          ),
        onError: fail,
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Offers"
        description="Track every offer from first email to won or lost."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add offer
          </Button>
        }
      />

      {message && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </div>
      )}
      {failure && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {failure}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Open offers"
          value={summary?.openCount ?? "—"}
        />
        <StatCard
          icon={Trophy}
          label="Won value"
          value={summary ? formatCurrency(summary.wonValue) : "—"}
        />
        <StatCard
          icon={CircleX}
          label="Lost offers"
          value={summary?.lostCount ?? "—"}
        />
        <StatCard
          icon={Percent}
          label="Win rate"
          value={summary ? `${winRate}%` : "—"}
        />
      </div>

      <div className="my-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by offer or contact"
            aria-label="Search offers"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by stage"
        >
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "primary" : "secondary"}
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Offer</th>
              <th className="px-4 py-3.5 font-semibold">Contact</th>
              <th className="px-4 py-3.5 font-semibold">Stage</th>
              <th className="px-4 py-3.5 text-right font-semibold">Amount</th>
              <th className="px-4 py-3.5 font-semibold">Created</th>
              <th className="px-4 py-3.5 font-semibold">Payment</th>
              <th className="px-4 py-3.5 text-right font-semibold">
                <span className="px-4 py-3.5">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  {d.title}
                </td>
                <td className="px-4 py-4 text-slate-700">{d.contactName}</td>
                <td className="px-4 py-4">
                  <StageBadge stage={d.stage} />
                </td>
                <td className="px-4 py-4 text-right font-semibold text-slate-900">
                  {formatCurrency(d.amount)}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {formatDate(d.createdAt)}
                </td>
                <td className="px-4 py-4">
                  {d.payment ? (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.payment.status} />
                      <span className="text-xs text-slate-500">
                        {d.payment.reference}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  {isOpenStage(d.stage) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing(d)}
                    >
                      Update
                    </Button>
                  ) : d.payment?.status === "Pending" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={
                        markPaid.isPending && markPaid.variables === d.id
                      }
                      onClick={() =>
                        markPaid.mutate(d.id, {
                          onSuccess: () =>
                            notify(
                              `${d.payment?.reference} was marked as paid.`,
                            ),
                          onError: fail,
                        })
                      }
                    >
                      Mark paid
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-slate-600">
            Loading offers…
          </p>
        )}
        {isError && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-600">
            No offers match your search or filter.
          </p>
        )}

        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
              Page {data.page} of {data.totalPages} · {data.total} offers
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= data.totalPages || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddOfferDialog
        open={addOpen}
        contacts={contactOptions}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />

      <UpdateOfferDialog
        deal={editing}
        contactName={editing?.contactName}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </>
  );
}
