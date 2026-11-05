import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

const supabaseUrl = "https://qyekvqxjwecncalfiaef.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWt2cXhqd2VjbmNhbGZpYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzAzNDgsImV4cCI6MjEwNjgwNjM0OH0.02YDl_sKggpguJ7XHBTrImssufADAcnwPoYtDqK7B1c";
const supabase = createClient(supabaseUrl, supabaseKey);

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'GlobalCougar | BYU International Student Hub' },
      { name: 'description', content: 'An interactive BYU International Student Hub.' },
    ],
  }),
  component: Index,
});

type Milestone = {
  id: number;
  status: string;
  completed_date: string | null;
  milestone_id: number;
  MILESTONE: {
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
  const [currentUser, setCurrentUser] = useState<string>('Jacob');
  const [frameQuery, setFrameQuery] = useState<string>('');
  const navigate = useNavigate();

  const fetchMilestones = useCallback(async (studentName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('USER_MILESTONE')
        .select('id, status, completed_date, milestone_id, MILESTONE(title, office_location, required_documents, phase, step_order, is_checkpoint), USER!inner(name)')
        .eq('USER.name', studentName)
        .order('step_order', { ascending: true, foreignTable: 'MILESTONE' });

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
        const { data: { session }, error } = await supabase.auth.getSession();

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

        const name = session.user.user_metadata?.['full_name'] || session.user.email?.split('@')[0] || 'Jacob';
        setCurrentUser(name);
        
        const meta = session.user.user_metadata ?? {};
        const qs = new URLSearchParams({ v: '9', user: name });
        if (meta['country']) qs.set('country', String(meta['country']));
        if (Array.isArray(meta['help_topics'])) qs.set('interests', meta['help_topics'].join('|'));
        setFrameQuery(qs.toString());

        await fetchMilestones(name);
      } catch (error) {
        if (!active) return;
        setDbError(error instanceof Error ? error.message : 'Could not verify your session.');
        setLoading(false);
      }
    };

    void enforceAuth();
    return () => {
      active = false;
    };
  }, [fetchMilestones, navigate]);

  // Saves unique completion status and timestamp directly to Supabase for the user
  const toggleMilestone = async (recordId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const nextDate: string | null = nextStatus === 'completed' ? new Date().toISOString().slice(0, 10) : null;

    setMilestones((prev) =>
      prev.map((item) => (item.id === recordId ? { ...item, status: nextStatus, completed_date: nextDate } : item))
    );

    const { error } = await supabase
      .from('USER_MILESTONE')
      .update({ status: nextStatus, completed_date: nextDate })
      .eq('id', recordId);

    if (error) {
      console.error('Update failed:', error.message);
      setDbError(`Could not update completion date: ${error.message}`);
      await fetchMilestones(currentUser);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    void navigate({ to: '/login' });
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'gc-logout') {
        void handleLogout();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  return (
<<<<<<< HEAD
    <div className="flex flex-col h-screen w-full bg-slate-100">
      <section className="bg-white border-b border-gray-200 px-3 py-2 shadow-sm z-10 sm:px-6 sm:py-4 shrink-0">
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
=======
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden">
      <section className="bg-white border-b border-gray-200 px-3 py-2 shadow-sm z-10 sm:px-6 sm:py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              Checkpoints for {currentUser}
            </h1>
            <div className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Completed: {completedCount} / {milestones.length}
>>>>>>> 7871c7e (Persist unique user completion dates to Supabase USER_MILESTONE)
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {dbError && (
              <span className="text-xs text-red-600 truncate max-w-xs">{dbError}</span>
            )}
            <button 
              onClick={handleLogout}
              className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 border border-red-200 rounded-lg bg-red-50 transition-colors shrink-0"
            >
              Log Out
            </button>
          </div>
        </div>
      </section>

      {frameQuery && (
        <iframe 
          title="GlobalCougar prototype" 
          src={`/globalcougar.html?${frameQuery}`} 
          className="min-h-0 min-w-0 flex-1 w-full border-0 bg-white" 
        />
      )}
    </div>
  );
}