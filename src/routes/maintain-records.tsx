// src/routes/maintain-records.tsx
// Admin CRUD page to Maintain Forum Replies (Create, Read, Update, Delete)
// Protected so only authenticated users with a valid session cookie can access it

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "../integrations/supabase/client";
import { getAuthCookie, clearAuthCookie } from "../lib/auth-cookie";
import type { Database } from "../integrations/supabase/types";

// Type alias matching the exact row structure in src/integrations/supabase/types.ts
type ForumReply = Database["public"]["Tables"]["forum_reply"]["Row"];

export const Route = createFileRoute("/maintain-records")({
  component: MaintainRecordsPage,
});

function MaintainRecordsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // State for displaying records (Read)
  const [records, setRecords] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // State for creating a new record (Create)
  const [newBody, setNewBody] = useState<string>("");
  const [newStudentId, setNewStudentId] = useState<string>("");
  const [newThreadId, setNewThreadId] = useState<string>("");

  // State for inline editing an existing record (Update)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState<string>("");
  const [editStudentId, setEditStudentId] = useState<string>("");
  const [editThreadId, setEditThreadId] = useState<string>("");

  // 1. Verify authentication cookie on mount; redirect if not logged in
  useEffect(() => {
    const email = getAuthCookie();
    if (!email) {
      navigate({ to: "/login" });
      return;
    }
    setCurrentUser(email);
    fetchRecords();
  }, [navigate]);

  // 2. READ: Fetch all records from the forum_reply table in Supabase
  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("forum_reply")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setStatusMessage(`Error loading records: ${error.message}`);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  // 3. CREATE: Insert a new record into forum_reply
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const { error } = await supabase.from("forum_reply").insert({
      body: newBody,
      student_id: Number(newStudentId),
      thread_id: Number(newThreadId),
    });

    if (error) {
      setStatusMessage(`Error adding record: ${error.message}`);
      return;
    }

    // Reset form fields and refresh table
    setNewBody("");
    setNewStudentId("");
    setNewThreadId("");
    setStatusMessage("Record added successfully.");
    fetchRecords();
  };

  // Start editing a specific row
  const startEditing = (record: ForumReply) => {
    setEditingId(record.id);
    setEditBody(record.body);
    setEditStudentId(String(record.student_id));
    setEditThreadId(String(record.thread_id));
  };

  // 4. UPDATE: Save edited fields back to Supabase
  const handleUpdate = async (id: number) => {
    setStatusMessage(null);

    const { error } = await supabase
      .from("forum_reply")
      .update({
        body: editBody,
        student_id: Number(editStudentId),
        thread_id: Number(editThreadId),
      })
      .eq("id", id);

    if (error) {
      setStatusMessage(`Error updating record: ${error.message}`);
      return;
    }

    setEditingId(null);
    setStatusMessage(`Record #${id} updated successfully.`);
    fetchRecords();
  };

  // 5. DELETE: Remove a record by ID from Supabase
  const handleDelete = async (id: number) => {
    setStatusMessage(null);

    const { error } = await supabase
      .from("forum_reply")
      .delete()
      .eq("id", id);

    if (error) {
      setStatusMessage(`Error deleting record: ${error.message}`);
      return;
    }

    setStatusMessage(`Record #${id} deleted.`);
    fetchRecords();
  };

  // Logout helper: clear cookie and redirect to landing page
  const handleLogout = () => {
    clearAuthCookie();
    navigate({ to: "/" });
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Admin Navigation Bar */}
      <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold text-blue-900">
            ← Back to Home
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-semibold text-slate-800">
            Maintain Forum Replies (Records)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/maintain-users"
            className="px-3 py-1.5 text-sm font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
          >
            Maintain Users
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50"
          >
            Logout ({currentUser})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Status / Feedback Banner */}
        {statusMessage && (
          <div className="p-3 text-sm font-medium text-blue-900 bg-blue-100 border border-blue-300 rounded">
            {statusMessage}
          </div>
        )}

        {/* CREATE FORM: Add a new record */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Add New Forum Reply
          </h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thread ID (Number)
              </label>
              <input
                type="number"
                required
                value={newThreadId}
                onChange={(e) => setNewThreadId(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Student ID (Number)
              </label>
              <input
                type="number"
                required
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                placeholder="e.g. 101"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Reply Body
              </label>
              <input
                type="text"
                required
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Enter reply message..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-700 text-white text-sm font-semibold rounded-lg hover:bg-indigo-800"
            >
              + Add Record
            </button>
          </form>
        </section>

        {/* READ / UPDATE / DELETE TABLE */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">
              Existing Records ({records.length})
            </h2>
            <button
              onClick={fetchRecords}
              className="text-sm text-indigo-700 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No records found. Add one above to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Thread ID</th>
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold">Body</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {records.map((rec) => {
                    const isEditing = editingId === rec.id;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {rec.id}
                        </td>

                        {/* Thread ID cell */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editThreadId}
                              onChange={(e) => setEditThreadId(e.target.value)}
                              className="w-20 px-2 py-1 border rounded"
                            />
                          ) : (
                            rec.thread_id
                          )}
                        </td>

                        {/* Student ID cell */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStudentId}
                              onChange={(e) => setEditStudentId(e.target.value)}
                              className="w-20 px-2 py-1 border rounded"
                            />
                          ) : (
                            rec.student_id
                          )}
                        </td>

                        {/* Body cell */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            rec.body
                          )}
                        </td>

                        {/* Edit / Save / Delete buttons */}
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdate(rec.id)}
                                className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(rec)}
                                className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(rec.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}