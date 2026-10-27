import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import ContactFormDialog from "../../components/ContactFormDialog";
import ConfirmDialog from "../../components/ConfirmDialog";

import {
  useContacts,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
  type Contact,
  type ContactInput,
} from "../../hooks/useContacts";

import { useDebounce } from "../../hooks/useDebounce";
import { getErrorMessage } from "../../lib/error";

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } =
    useContacts(debouncedQuery, page);

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const contacts = data?.items ?? [];

  const notify = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleAdd = async (input: ContactInput) => {
    const created = await createContact.mutateAsync(input);

    setQuery("");
    setPage(1);

    notify(`${created.name} was added to your contacts.`);
  };

  const handleEdit = async (input: ContactInput) => {
    if (!editing) return;

    const updated = await updateContact.mutateAsync({
      id: editing.id,
      changes: input,
    });

    notify(`${updated.name} was updated.`);
  };

  const handleDelete = async () => {
    if (!deleting) return;

    await deleteContact.mutateAsync(deleting.id);

    if (contacts.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
    }

    notify(`${deleting.name} was deleted.`);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Contacts"
        description="The people and companies you work with."
        actions={
          <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add contact
          </Button>
        }
      />

      {notice && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span className="break-words">{notice}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4 w-full min-w-0 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />

        <input
          type="search"
          value={query}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search by name, company or email"
          aria-label="Search contacts"
          className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        />
      </div>

      {/* Contacts table */}
      {/* Contacts table: only this box scrolls sideways, never the page */}
      <div
        className={[
          "w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white",
          isPlaceholderData ? "opacity-60" : "",
        ].join(" ")}
      >
        {contacts.length > 0 && (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="px-4 py-3">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {contact.company}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{contact.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`Edit ${contact.name}`}
                        onClick={() => setEditing(contact)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`Delete ${contact.name}`}
                        onClick={() => setDeleting(contact)}
                      >
                        <Trash2
                          className="h-4 w-4 text-red-600"
                          aria-hidden="true"
                        />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-slate-600">
            Loading contacts…
          </p>
        )}

        {isError && !data && (
          <div className="px-4 py-10 text-center">
            <p className="break-words text-sm text-red-700">
              {getErrorMessage(error)}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {data && contacts.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-600">
            {debouncedQuery
              ? `No contacts match "${debouncedQuery}". Try a different name or company.`
              : "No contacts yet. Add your first one."}
          </p>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="mt-4 flex min-w-0 flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words">
            Page {data.page} of {data.totalPages} · {data.total} contacts
          </p>

          <div className="flex gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Previous
            </Button>

            <Button
              size="sm"
              variant="secondary"
              disabled={page >= data.totalPages || isPlaceholderData}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add contact */}
      <ContactFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add contact"
        description="Save the details of someone you work with."
        submitLabel="Add contact"
        onSubmit={handleAdd}
      />

      {/* Edit contact */}
      <ContactFormDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit contact"
        submitLabel="Save changes"
        initial={
          editing
            ? {
                name: editing.name,
                email: editing.email,
                phone: editing.phone ?? "",
                company: editing.company,
              }
            : undefined
        }
        onSubmit={handleEdit}
      />

      {/* Delete contact */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? "contact"}?`}
        description="They will be removed from your contacts. This can't be undone from the app."
        confirmLabel="Delete contact"
        onConfirm={handleDelete}
      />
    </div>
  );
}
