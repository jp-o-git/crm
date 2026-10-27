import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "../../components/Button";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import StageBars from "../../components/StageBars";
import { formatCurrency } from "../../lib/format";
import { getErrorMessage } from "../../lib/error";
import { CheckCircle2, Download, Mail } from "lucide-react";
import SendReportDialog from "../../components/SendReportDialog";
import { useSession } from "../../hooks/useSession";
import {
  useDownloadReport,
  useEmailReport,
  useReport,
} from "../../hooks/useReports";

type Range = "7" | "30" | "all";

const ranges: { value: Range; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export default function Report() {
  const [range, setRange] = useState<Range>("all");
  const days = range === "all" ? null : Number(range);
  const { data: report, isLoading, isError, error, refetch } = useReport(days);
  const { data: me } = useSession();
  const downloadReport = useDownloadReport();
  const emailReport = useEmailReport();
  const [sendOpen, setSendOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const rangeLabel = ranges.find((r) => r.value === range)?.label ?? "";

  const handleDownload = () => {
    setMessage(null);
    setFailure(null);
    downloadReport.mutate(days, {
      onError: (e) => setFailure(getErrorMessage(e)),
    });
  };

  const handleSend = async (email: string) => {
    await emailReport.mutateAsync({ days, email }); // the dialog shows the error if it fails
    setFailure(null);
    setMessage(`Report sent to ${email}.`);
    window.setTimeout(() => setMessage(null), 5000);
  };

  const chartData = useMemo(() => {
    if (!report) return [];

    const totals = new Map(report.revenue.map((p) => [p.date, p.total]));
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    // 7 or 30 days: one point per day, with 0 on days without payments
    if (days !== null) {
      return Array.from({ length: days + 1 }, (_, index) => {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - days + index);
        const key = date.toISOString().slice(0, 10);
        return {
          label: new Date(`${key}T12:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          total: totals.get(key) ?? 0,
        };
      });
    }

    // All time: one point per month, with 0 on months without payments
    if (report.revenue.length === 0) return [];

    const monthStart = (year: number, month: number) =>
      new Date(Date.UTC(year, month, 1));

    const thisMonth = monthStart(today.getUTCFullYear(), today.getUTCMonth());
    const firstPaid = new Date(`${report.revenue[0].date}T00:00:00Z`);
    const firstMonth = monthStart(
      firstPaid.getUTCFullYear(),
      firstPaid.getUTCMonth(),
    );
    // Show at least the last 6 months, so the chart is always a line
    const minStart = monthStart(
      thisMonth.getUTCFullYear(),
      thisMonth.getUTCMonth() - 5,
    );
    const start = firstMonth < minStart ? firstMonth : minStart;

    const points: { label: string; total: number }[] = [];
    for (
      let d = start;
      d <= thisMonth;
      d = monthStart(d.getUTCFullYear(), d.getUTCMonth() + 1)
    ) {
      points.push({
        label: d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        total: totals.get(d.toISOString().slice(0, 10)) ?? 0,
      });
    }
    return points;
  }, [report, days]);

  const createdCount = report
    ? Object.values(report.byStage).reduce((sum, n) => sum + n, 0)
    : 0;
  const hasPaidRevenue = (report?.revenue.length ?? 0) > 0;
  const topContacts = report?.topContacts ?? [];

  return (
    <>
      <PageHeader
        title="Reports"
        description="See how your offers and revenue are doing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={downloadReport.isPending}
              disabled={!report}
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download PDF
            </Button>
            <Button disabled={!report} onClick={() => setSendOpen(true)}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Send to email
            </Button>
          </div>
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
      <div
        className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        role="group"
        aria-label="Date range"
      >
        {ranges.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={range === r.value ? "primary" : "ghost"}
            aria-pressed={range === r.value}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <p className="py-10 text-center text-sm text-slate-600">
          Loading report…
        </p>
      )}

      {isError && (
        <div className="py-10 text-center">
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

      {report && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Offers by stage">
              {createdCount === 0 ? (
                <p className="text-sm text-slate-600">
                  No offers were created in this period.
                </p>
              ) : (
                <StageBars counts={report.byStage} />
              )}
            </Card>

            <Card
              title={days === null ? "Revenue per month" : "Revenue per day"}
            >
              {!hasPaidRevenue ? (
                <p className="text-sm text-slate-600">
                  No paid invoices in this period.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 0, right: 16 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E2E8F0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        interval={
                          days === 7
                            ? 0
                            : days === 30
                              ? 4
                              : chartData.length <= 12
                                ? 0
                                : "preserveStartEnd"
                        }
                        tick={{ fontSize: 12, fill: "#64748B" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        tickFormatter={(v: number) => `$${v}`}
                        width={56}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#1D4ED8"
                        strokeWidth={3}
                        dot={{
                          r: days === null || days === 7 ? 4 : 3,
                          fill: "#1D4ED8",
                          strokeWidth: 0,
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <Card title="Top contacts by won value" className="mt-6">
            {topContacts.length === 0 ? (
              <p className="text-sm text-slate-600">
                No offers were won in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-3 pr-4 font-semibold">Name</th>
                      <th className="py-3 pr-4 font-semibold">Company</th>
                      <th className="py-3 pr-4 text-right font-semibold">
                        Won offers
                      </th>
                      <th className="py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topContacts.map((c) => (
                      <tr key={c.contactId}>
                        <td className="py-4 pr-4 font-semibold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-4 pr-4 text-slate-700">
                          {c.company}
                        </td>
                        <td className="py-4 pr-4 text-right text-slate-700">
                          {c.count}
                        </td>
                        <td className="py-4 text-right font-semibold text-slate-900">
                          {formatCurrency(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
      <SendReportDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        rangeLabel={rangeLabel}
        defaultEmail={me?.email ?? ""}
        onSend={handleSend}
      />
    </>
  );
}
