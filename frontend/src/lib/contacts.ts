import api from "./api"; // Change this to your existing Axios instance path.

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export type ContactCreate = Omit<Contact, "id">; //take all the fields from Contact, except id
export type ContactUpdate = Partial<ContactCreate>; //Partial makes all fields optional.

// GET /contacts
export async function fetchContacts(): Promise<Contact[]> {
  const response = await api.get<Contact[]>("/contacts");
  return response.data;
}

// GET /contacts/{contact_id}
export async function fetchContact(id: string): Promise<Contact> {
  const response = await api.get<Contact>(`/contacts/${id}`);
  return response.data;
}

// POST /contacts
export async function createContact(
  data: ContactCreate,
): Promise<Contact> {
  const response = await api.post<Contact>("/contacts", data);
  return response.data;
}

// PATCH /contacts/{contact_id}
export async function updateContact(
  id: string,
  data: ContactUpdate,
): Promise<Contact> {
  const response = await api.patch<Contact>(`/contacts/${id}`, data);
  return response.data;
}

// DELETE /contacts/{contact_id}
export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/contacts/${id}`);
}