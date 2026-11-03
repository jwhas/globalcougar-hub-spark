import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'GlobalCougar | BYU International Student Hub' },
      { name: 'description', content: 'An interactive BYU international student hub.' },
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
  const [currentUser, setCurrentUser] = useState<string>('Student');
  const navigate = useNavigate();

  const fetchMilestones = useCallback(async (studentName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_milestone')
        .select('id, status, completed_date, milestone_id, milestone(title, office_location, required_documents, phase, step_order, is_checkpoint), student!inner(name)')
        .eq('student.name', studentName)
        .order('step_order', { ascending: true, foreignTable: 'milestone' });

      if (error) {
        setDbError(error.message);
      } else {
        setDbError(null);
        setMilestones((data ?? []) as unknown as Milestone[]);
      }
    } catch (error) {
      setDbError(error instanceof Error ? error.message : 'Database error.');
    } finally {
      setLoading(false);
    }
  }, []);

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
          setDbError(`Could not verify your session: ${error.message}`);
          setLoading(false);
          return;
        }
        if (!session) {
          setLoading(false);
          void navigate({ to: '/login' });
          return;
        }

        const name =
          session.user.user_metadata?.['full_name'] ||
          session.user.email?.split('@')[0] ||
          'Student';
        setCurrentUser(name);
        await fetchMilestones(name);
      } catch (error) {
        if (!active) return;
        setDbError(
          error instanceof Error ? error.message : 'Could not verify your session.',
        );
        setLoading(false);
      }
    };

    void enforceAuth();
    return () => {
      active = false;
    };
  }, [fetchMilestones, navigate]);

  const toggleMilestone = async (recordId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const nextDate: string | null = nextStatus === 'completed' ? new Date().toISOString().slice(0, 10) : null;

    setMilestones((prev) =>
      prev.map((item) => (item.id === recordId ? { ...item, status: nextStatus, completed_date: nextDate } : item))
    );

    const { error } = await supabase
      .from('user_milestone')
      .update({ status: nextStatus, completed_date: nextDate })
      .eq('id', recordId);

    if (error) {
      console.error('Update failed:', error.message);
      setDbError(`Could not update checkpoint: ${error.message}`);
      await fetchMilestones(currentUser);
      setDbError(`Could not update checkpoint: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setDbError(`Could not log out: ${error.message}`);
      return;
    }
    void navigate({ to: '/login' });
  };

  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100">
      <section className="bg-white border-b border-gray-200 px-3 py-2 shadow-sm z-10 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 sm:pb-3">
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 sm:text-base">
                Checkpoints for {currentUser}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="shrink-0 whitespace-nowrap text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 sm:px-2.5 sm:text-xs">
                Completed: {completedCount} / {milestones.length}
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 border border-red-200 rounded bg-red-50"
              >
                Log Out
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 py-3">Connecting...</p>
          ) : dbError ? (
            <p className="text-xs text-gray-500 py-3">Error: {dbError}</p>
          ) : milestones.length === 0 ? (
            <p className="text-xs text-gray-500 py-3">
              No checkpoints are assigned to this account yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 max-h-36 overflow-y-auto sm:max-h-none">
              {milestones.map((item) => (
                <div key={item.id} className="min-w-0 gap-2 p-2 bg-slate-50 border border-gray-200 rounded-lg flex items-center justify-between sm:p-3">
                  <div className="min-w-0 flex-1 pr-1 sm:pr-3">
                    <p className="text-[11px] font-bold text-gray-900 sm:text-xs">
                      {item.milestone?.title ?? `Milestone #${item.milestone_id}`}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMilestone(item.id, item.status)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors shrink-0 sm:px-3 sm:py-1.5 sm:text-xs ${
                      item.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
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

      <iframe title="GlobalCougar prototype" src="/globalcougar.html?v=8" className="min-h-0 min-w-0 flex-1 w-full border-0" />
    </div>
  );
}