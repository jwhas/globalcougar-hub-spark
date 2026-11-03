import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

type Milestone = {
  id: number;
  status: string;
  completed_date: string | null;
  milestone_id: number;
  milestone: {
    title: string;
    office_location: string;
    required_documents: string;
    phase: number;
    step_order: number;
    is_checkpoint: boolean;
  } | null;
};

function Index() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Read the saved user from the computer, default to 'James A.' if no one has logged in yet
  const currentUser = typeof window !== 'undefined' 
    ? localStorage.getItem('globalcougar_user') || 'James A.' 
    : 'James A.';

  // Fetch every milestone assigned to the currently logged-in student.
  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('user_milestone')
        .select(
          'id, status, completed_date, milestone_id, milestone(title, office_location, required_documents, phase, step_order, is_checkpoint), student!inner(name)',
        )
        .eq('student.name', currentUser)
        .order('step_order', { ascending: true, foreignTable: 'milestone' });

      if (error) {
        setDbError(error.message);
      } else {
        setDbError(null);
        setMilestones((data ?? []) as unknown as Milestone[]);
      }
    } catch (error) {
      setDbError(error instanceof Error ? error.message : 'Could not reach the database.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMilestones();
  }, [currentUser]);

  // Persist status updates to the shared database.
  const toggleMilestone = async (recordId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const nextDate: string | null =
      nextStatus === 'completed' ? new Date().toISOString().slice(0, 10) : null;

    // Optimistic local state update
    setMilestones((prev: Milestone[]) =>
      prev.map((item: Milestone) =>
        item.id === recordId
          ? { ...item, status: nextStatus, completed_date: nextDate }
          : item
      )
    );

    const { error } = await supabase
      .from('user_milestone')
      .update({ status: nextStatus, completed_date: nextDate })
      .eq('id', recordId);

    if (error) {
      console.error('Update failed:', error.message);
      fetchMilestones(); // Revert on failure
    }
  };

  const completedCount = milestones.filter((m: Milestone) => m.status === 'completed').length;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100">
      {/* Dynamic database-backed checkpoints bar */}
      <section className="bg-white border-b border-gray-200 px-3 py-2 shadow-sm z-10 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 sm:pb-3">
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 sm:text-base">
                Assigned Onboarding Checkpoints for {currentUser}
              </h1>
              <p className="text-[10px] text-gray-500 sm:text-xs">
                Saved in the shared database (user_milestone)
              </p>
            </div>
            <div className="shrink-0 whitespace-nowrap text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 sm:px-2.5 sm:text-xs">
              Completed: {completedCount} / {milestones.length}
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 py-3">Connecting to the database...</p>
          ) : dbError ? (
            <p className="text-xs text-gray-500 py-3">
              Database not connected: {dbError}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 max-h-36 overflow-y-auto sm:max-h-none">
              {milestones.map((item: Milestone) => (
                <div
                  key={item.id}
                  className="min-w-0 gap-2 p-2 bg-slate-50 border border-gray-200 rounded-lg flex items-center justify-between sm:p-3"
                >
                  <div className="min-w-0 flex-1 pr-1 sm:pr-3">
                    <p className="text-[11px] font-bold text-gray-900 sm:text-xs">
                      {item.milestone?.title ?? `Milestone #${item.milestone_id}`}
                    </p>
                    <p className="line-clamp-2 break-words text-[10px] leading-tight text-gray-500 sm:text-[11px]">
                      {item.milestone?.office_location ?? 'Campus Office'} | Required Docs:{' '}
                      <span className="text-gray-700">
                        {item.milestone?.required_documents ?? 'None'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMilestone(item.id, item.status)}
                    className={`max-w-28 whitespace-nowrap px-2 py-1 rounded text-[10px] font-semibold transition-colors shrink-0 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-xs ${
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
        src="/globalcougar.html?v=8"
        className="min-h-0 min-w-0 flex-1 w-full border-0"
      />
    </div>
  );
}