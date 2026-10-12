import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'GlobalCougar | BYU International Student Hub' },
      {
        name: 'description',
        content:
          'An interactive BYU international student hub for onboarding, campus updates, community, careers, and ISSS support.',
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all assigned milestones for Demo Student (user_id = 1)
  const fetchMilestones = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('USER_MILESTONE')
      .select(`
        id,
        milestone_id,
        status,
        completed_date,
        MILESTONE (
          title,
          office_location,
          required_documents
        )
      `)
      .eq('user_id', 1)
      .order('milestone_id', { ascending: true });

    if (!error && data) {
      setMilestones(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  // Persist status updates to Supabase
  const toggleMilestone = async (recordId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const nextDate = nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : null;

    // Optimistic local state update
    setMilestones((prev: any[]) =>
      prev.map((item: any) =>
        item.id === recordId
          ? { ...item, status: nextStatus, completed_date: nextDate }
          : item
      )
    );

    if (!supabase) return;
    const { error } = await supabase
      .from('USER_MILESTONE')
      .update({
        status: nextStatus,
        completed_date: nextDate,
      })
      .eq('id', recordId);

    if (error) {
      console.error('Update failed:', error.message);
      fetchMilestones();
    }
  };

  const completedCount = milestones.filter((m: any) => m.status === 'completed').length;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100">
      {/* Dynamic Supabase Checkpoints Bar */}
      <section className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h1 className="text-base font-bold text-gray-900">
                Assigned Onboarding Checkpoints
              </h1>
              <p className="text-xs text-gray-500">Live PostgreSQL Backend (USER_MILESTONE)</p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Completed: {completedCount} / {milestones.length}
            </div>
          </div>

          {!supabase ? (
            <p className="text-xs text-gray-500 py-3">
              Database not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load checkpoints.
            </p>
          ) : loading ? (
            <p className="text-xs text-gray-400 py-3">Connecting to Supabase...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              {milestones.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div className="pr-3">
                    <p className="text-xs font-bold text-gray-900">
                      {item.MILESTONE?.title ?? `Milestone #${item.milestone_id}`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {item.MILESTONE?.office_location ?? 'Campus Office'} • Required Docs:{' '}
                      <span className="text-gray-700">{item.MILESTONE?.required_documents ?? 'None'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMilestone(item.id, item.status)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 ${
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {item.status === 'completed' ? '✓ Completed' : 'Mark Complete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Embedded Prototype Frame */}
      <iframe
        title="GlobalCougar prototype"
        src="/globalcougar.html"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}