import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import ContactFormDialog from "../../components/ContactFormDialog";
import {
  useContact,
  useDeleteContact,
  useUpdateContact,
  type ContactInput,
} from "../../hooks/useContacts";
import { getErrorMessage } from "../../lib/error";
import AddOfferDialog from "../../components/AddOfferDialog";
import { StageBadge, StatusBadge } from "../../components/Badge";
import { useCreateOffer, useOffers } from "../../hooks/useOffers";
import { formatCurrency } from "../../lib/format";
import type { NewOffer, PaymentInput } from "../../lib/offer";
import { Plus } from "lucide-react";

export default function ContactDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // All hooks go at the top, before any early return
  const { data: contact, isLoading, isError, error, refetch } = useContact(id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data: offerPage } = useOffers({
    stage: "All",
    q: "",
    contactId: id,
    page: 1,
    pageSize: 100,
  });
  const createOffer = useCreateOffer();
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const offers = offerPage?.items ?? [];

  const handleAddOffer = (offer: NewOffer, payment?: PaymentInput) => {
    setOfferError(null);
    createOffer.mutate(
      { offer, payment },
      { onError: (e) => setOfferError(getErrorMessage(e)) },
    );
  };
  const handleSave = async (input: ContactInput) => {
    await updateContact.mutateAsync({ id, changes: input }); // throws on failure, the dialog shows it
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  };

  const handleDelete = async () => {
    await deleteContact.mutateAsync(id);
    navigate("/contacts", { replace: true }); // the contact is gone, leave the page
  };

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-slate-600">
        Loading contact…
      </p>
    );
  }

  const notFound = isAxiosError(error) && error.response?.status === 404;

  if (isError && !notFound) {
    return (
      <div className="py-16 text-center">
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
    );
  }

  if (!contact) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Contact not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This contact doesn't exist or was deleted.
        </p>
        <Link to="/contacts" className="mt-6 inline-block">
          <Button variant="secondary">Back to contacts</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        to="/contacts"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Contacts
      </Link>

      <PageHeader
        title={contact.name}
        description={`${contact.company} · Contact profile`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit contact
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        }
      />

      {saved && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Contact updated.
        </div>
      )}

      <Card className="mb-6">
        <dl className="grid gap-5 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <Building2 className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Company
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {contact.company}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <Mail className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </dt>
              <dd className="mt-1 break-all text-sm font-medium text-slate-900">
                {contact.email}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <Phone className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Phone
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {contact.phone || "—"}
              </dd>
            </div>
          </div>
        </dl>
      </Card>

      <Card title="Offers">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Change an offer's stage from the{" "}
            <Link
              to="/offers"
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              Offers page
            </Link>
            .
          </p>
          <Button size="sm" onClick={() => setAddOfferOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add offer
          </Button>
        </div>

        {offerError && (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {offerError}
          </p>
        )}

        {offers.length === 0 ? (
          <p className="text-sm text-slate-600">
            No offers yet. Add the first one to start tracking it.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {offers.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {o.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(o.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {o.payment && <StatusBadge status={o.payment.status} />}
                  <StageBadge stage={o.stage} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ContactFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit contact"
        submitLabel="Save changes"
        initial={{
          name: contact.name,
          email: contact.email,
          phone: contact.phone ?? "",
          company: contact.company,
        }}
        onSubmit={handleSave}
      />

      <AddOfferDialog
        open={addOfferOpen}
        contacts={[contact]}
        defaultContactId={contact.id}
        onClose={() => setAddOfferOpen(false)}
        onAdd={handleAddOffer}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Delete ${contact.name}?`}
        description="They will be removed from your contacts. This can't be undone from the app."
        confirmLabel="Delete contact"
        onConfirm={handleDelete}
      />
    </>
  );
}
