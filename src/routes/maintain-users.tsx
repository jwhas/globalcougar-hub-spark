import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";

type Student = Database["public"]["Tables"]["student"]["Row"];
type StudentForm = Pick<
  Student,
  | "name"
  | "email"
  | "home_country"
  | "semester"
  | "situations"
  | "account_start_date"
  | "us_arrival_date"
>;
type StudentFormValues = Omit<StudentForm, "account_start_date" | "us_arrival_date"> & {
  account_start_date: string;
  us_arrival_date: string;
};

const emptyStudent: StudentFormValues = {
  name: "",
  email: "",
  home_country: "",
  semester: "",
  situations: "",
  account_start_date: "",
  us_arrival_date: "",
};

const fieldClassName = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStudent(value: unknown): value is Student {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.home_country === "string" &&
    typeof value.semester === "string" &&
    typeof value.situations === "string" &&
    (value.account_start_date === null || typeof value.account_start_date === "string") &&
    (value.us_arrival_date === null || typeof value.us_arrival_date === "string") &&
    typeof value.created_at === "string"
  );
}

function toFormValues(student: Student): StudentFormValues {
  return {
    name: student.name,
    email: student.email,
    home_country: student.home_country,
    semester: student.semester,
    situations: student.situations,
    account_start_date: student.account_start_date ?? "",
    us_arrival_date: student.us_arrival_date ?? "",
  };
}

function toPayload(values: StudentFormValues): StudentForm {
  return {
    ...values,
    account_start_date: values.account_start_date || null,
    us_arrival_date: values.us_arrival_date || null,
  };
}

async function requestUsers(
  token: string,
  init?: RequestInit,
  id?: number,
): Promise<Record<string, unknown>> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");

  const endpoint = id === undefined ? "/api/public/users" : `/api/public/users?id=${id}`;
  const response = await fetch(endpoint, { ...init, headers });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !isRecord(payload) || payload.ok !== true) {
    throw new Error(
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "The user request could not be completed.",
    );
  }
  return payload;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function StudentFields({
  values,
  onChange,
  idPrefix,
}: {
  values: StudentFormValues;
  onChange: (field: keyof StudentFormValues, value: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label htmlFor={`${idPrefix}-name`} className="text-sm font-semibold text-slate-700">
        Name
        <input
          id={`${idPrefix}-name`}
          required
          maxLength={120}
          value={values.name}
          onChange={(event) => onChange("name", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor={`${idPrefix}-email`} className="text-sm font-semibold text-slate-700">
        Email
        <input
          id={`${idPrefix}-email`}
          type="email"
          maxLength={254}
          value={values.email}
          onChange={(event) => onChange("email", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor={`${idPrefix}-country`} className="text-sm font-semibold text-slate-700">
        Home country
        <input
          id={`${idPrefix}-country`}
          maxLength={100}
          value={values.home_country}
          onChange={(event) => onChange("home_country", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor={`${idPrefix}-semester`} className="text-sm font-semibold text-slate-700">
        Semester
        <input
          id={`${idPrefix}-semester`}
          maxLength={80}
          value={values.semester}
          onChange={(event) => onChange("semester", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor={`${idPrefix}-start-date`} className="text-sm font-semibold text-slate-700">
        Account start date
        <input
          id={`${idPrefix}-start-date`}
          type="date"
          value={values.account_start_date}
          onChange={(event) => onChange("account_start_date", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
      <label htmlFor={`${idPrefix}-arrival-date`} className="text-sm font-semibold text-slate-700">
        U.S. arrival date
        <input
          id={`${idPrefix}-arrival-date`}
          type="date"
          value={values.us_arrival_date}
          onChange={(event) => onChange("us_arrival_date", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
      <label
        htmlFor={`${idPrefix}-situations`}
        className="text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-3"
      >
        Situations
        <textarea
          id={`${idPrefix}-situations`}
          maxLength={2000}
          rows={3}
          value={values.situations}
          onChange={(event) => onChange("situations", event.currentTarget.value)}
          className={fieldClassName}
        />
      </label>
    </div>
  );
}

export const Route = createFileRoute("/maintain-users")({
  component: MaintainUsersPage,
});

function MaintainUsersPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [users, setUsers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<StudentFormValues>({ ...emptyStudent });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<StudentFormValues>({ ...emptyStudent });

  useEffect(() => {
    let active = true;

    const enforceAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          console.error("Could not verify session:", error.message);
          void navigate({ to: "/login" });
          return;
        }
        if (!session) {
          void navigate({ to: "/login" });
          return;
        }

        setCurrentUser(session.user.email ?? session.user.id);
        setAccessToken(session.access_token);
        const result = await requestUsers(session.access_token);
        if (!active) return;
        if (!Array.isArray(result.users) || !result.users.every(isStudent)) {
          throw new Error("The server returned invalid user records.");
        }
        setUsers(result.users);
      } catch (error) {
        if (!active) return;
        console.error("Could not load user records:", error);
        setStatusMessage(errorMessage(error, "Users could not be loaded."));
      } finally {
        if (active) setLoading(false);
      }
    };

    void enforceAuth();
    return () => {
      active = false;
    };
  }, [navigate]);

  const reloadUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await requestUsers(accessToken);
      if (!Array.isArray(result.users) || !result.users.every(isStudent)) {
        throw new Error("The server returned invalid user records.");
      }
      setUsers(result.users);
      setStatusMessage("User list refreshed.");
    } catch (error) {
      console.error("Could not refresh user records:", error);
      setStatusMessage(errorMessage(error, "Users could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const result = await requestUsers(accessToken, {
        method: "POST",
        body: JSON.stringify(toPayload(newUser)),
      });
      if (!isStudent(result.user)) throw new Error("The server returned an invalid user record.");
      setUsers((current) => [...current, result.user].sort((a, b) => a.id - b.id));
      setNewUser({ ...emptyStudent });
      setStatusMessage("User created successfully.");
    } catch (error) {
      console.error("Could not create user:", error);
      setStatusMessage(errorMessage(error, "The user could not be created."));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (user: Student) => {
    setEditingId(user.id);
    setEditUser(toFormValues(user));
    setStatusMessage(null);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken || editingId === null) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const result = await requestUsers(accessToken, {
        method: "PUT",
        body: JSON.stringify(toPayload(editUser)),
        headers: { "Content-Type": "application/json" },
      });
      if (!isStudent(result.user)) throw new Error("The server returned an invalid user record.");
      setUsers((current) => current.map((user) => (user.id === editingId ? result.user : user)));
      setEditingId(null);
      setStatusMessage("User updated successfully.");
    } catch (error) {
      console.error("Could not update user:", error);
      setStatusMessage(errorMessage(error, "The user could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: Student) => {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `Delete ${user.name}? This also deletes their journey and forum records.`,
    );
    if (!confirmed) return;

    setStatusMessage(null);
    try {
      await requestUsers(accessToken, { method: "DELETE" }, user.id);
      setUsers((current) => current.filter((record) => record.id !== user.id));
      if (editingId === user.id) setEditingId(null);
      setStatusMessage("User deleted successfully.");
    } catch (error) {
      console.error("Could not delete user:", error);
      setStatusMessage(errorMessage(error, "The user could not be deleted."));
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Could not log out:", error.message);
      setStatusMessage("Could not log out. Please try again.");
      return;
    }
    void navigate({ to: "/login" });
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold text-blue-900">
            ← Back to Home
          </Link>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <h1 className="text-lg font-semibold text-slate-800">Maintain Users</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/maintain-records"
            className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100"
          >
            Maintain Records
          </Link>
          <button
            onClick={() => void handleLogout()}
            className="rounded border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Logout ({currentUser})
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {statusMessage && (
          <div
            role="status"
            className="rounded border border-blue-300 bg-blue-100 p-3 text-sm font-medium text-blue-900"
          >
            {statusMessage}
          </div>
        )}

        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Add User</h2>
            <p className="mt-1 text-sm text-slate-500">Create a student record in Supabase.</p>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <StudentFields
              values={newUser}
              onChange={(field, value) => setNewUser((current) => ({ ...current, [field]: value }))}
              idPrefix="new-user"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create User"}
            </button>
          </form>
        </section>

        {editingId !== null && (
          <section className="space-y-5 rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Edit User #{editingId}</h2>
            <form onSubmit={handleUpdate} className="space-y-5">
              <StudentFields
                values={editUser}
                onChange={(field, value) =>
                  setEditUser((current) => ({ ...current, [field]: value }))
                }
                idPrefix="edit-user"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">Users ({users.length})</h2>
            <button
              onClick={() => void reloadUsers()}
              className="text-sm text-indigo-700 hover:underline"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No users found. Add one above to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-slate-700">
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Home country</th>
                    <th className="px-4 py-3 font-semibold">Semester</th>
                    <th className="px-4 py-3 font-semibold">Situations</th>
                    <th className="px-4 py-3 font-semibold">Start date</th>
                    <th className="px-4 py-3 font-semibold">Arrival date</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-600">{user.id}</td>
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3">{user.email || "—"}</td>
                      <td className="px-4 py-3">{user.home_country || "—"}</td>
                      <td className="px-4 py-3">{user.semester || "—"}</td>
                      <td className="max-w-56 whitespace-pre-wrap px-4 py-3">
                        {user.situations || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {user.account_start_date || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{user.us_arrival_date || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => startEditing(user)}
                          className="mr-2 rounded bg-amber-500 px-3 py-1 text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(user)}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
