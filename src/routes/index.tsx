import { useCallback, useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';


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
  const [currentUser, setCurrentUser] = useState<string>('Student');
  const [frameQuery, setFrameQuery] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  const fetchMilestones = useCallback(async (studentName: string) => {
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
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        let session = existingSession;

        if (session && session.expires_at && session.expires_at * 1000 <= Date.now() + 60_000) {
          const refreshed = await supabase.auth.refreshSession();
          session = refreshed.data.session;
          if (refreshed.error) throw refreshed.error;
        }

        if (!active) return;
        if (error || !session) {
          setLoading(false);
          void navigate({ to: '/login' });
          return;
        }

        const name = session.user.user_metadata?.['full_name'] || session.user.email?.split('@')[0] || 'Student';
        setCurrentUser(name);
        setAccessToken(session.access_token);
        
        const meta = session.user.user_metadata ?? {};
        const qs = new URLSearchParams({ v: '9', user: name });
        if (meta['country']) qs.set('country', String(meta['country']));
        if (Array.isArray(meta['help_topics'])) qs.set('interests', meta['help_topics'].join('|'));
        setFrameQuery(qs.toString());

        await fetchMilestones(name);
      } catch (error) {
        if (!active) return;
        setLoading(false);
        void navigate({ to: '/login' });
      }
    };

    void enforceAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setAccessToken(session.access_token);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchMilestones, navigate]);

  useEffect(() => {
    if (!accessToken || !frameRef.current?.contentWindow) return;
    frameRef.current.contentWindow.postMessage({ type: 'gc-auth', accessToken }, window.location.origin);
  }, [accessToken, frameQuery]);

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
      if (e.data?.type === 'gc-auth-request' && e.source === frameRef.current?.contentWindow) {
        void supabase.auth.getSession().then(({ data }) => {
          const token = data.session?.access_token || accessToken;
          if (token) e.source?.postMessage({ type: 'gc-auth', accessToken: token }, window.location.origin);
        });
        return;
      }
      if (e.data?.type === 'gc-logout') {
        void handleLogout();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [accessToken]);

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-100 text-sm text-gray-500">Loading GlobalCougar...</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden">
      <section className="bg-white border-b border-gray-200 px-3 py-2 shadow-sm z-10 sm:px-6 sm:py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              Checkpoints for {currentUser}
            </h1>
            <div className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Completed: {completedCount} / {milestones.length}
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
          ref={frameRef}
          title="GlobalCougar prototype" 
          src={`/globalcougar.html?${frameQuery}`} 
          onLoad={() => {
            if (accessToken && frameRef.current?.contentWindow) {
              frameRef.current.contentWindow.postMessage({ type: 'gc-auth', accessToken }, window.location.origin);
            }
          }}
          className="min-h-0 min-w-0 flex-1 w-full border-0 bg-white" 
        />
      )}
    </div>
  );
}