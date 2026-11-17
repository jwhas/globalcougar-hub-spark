import { useCallback, useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
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

function Index() {
  const [currentUser, setCurrentUser] = useState<string>('Student');
  const [frameQuery, setFrameQuery] = useState<string>('');
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;

    const enforceAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!active) return;
        if (error) {
          console.error('Could not verify session:', error.message);
          void navigate({ to: '/login' });
          return;
        }
        if (!session) {
          void navigate({ to: '/login' });
          return;
        }

        const name = session.user.user_metadata?.['full_name'] || session.user.email?.split('@')[0] || 'Student';
        setCurrentUser(name);

        // Restore iframe URL parameters for the prototype
        const meta = session.user.user_metadata ?? {};
        const qs = new URLSearchParams({ v: '12', home: '1' });
        if (meta['country']) qs.set('country', String(meta['country']));
        const helpTopics = meta['help_topics'];
        qs.set(
          'interests',
          Array.isArray(helpTopics)
            ? helpTopics.filter((topic): topic is string => typeof topic === 'string').join('|')
            : '',
        );
        setFrameQuery(qs.toString());
      } catch (error) {
        if (!active) return;
        console.error('Could not verify session:', error);
        void navigate({ to: '/login' });
      }
    };

    void enforceAuth();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Could not log out:', error.message);
      return;
    }
    setFrameQuery(''); // Clears state so admin buttons immediately hide
    void navigate({ to: '/login' });
  }, [navigate]);

  const syncPrototypeUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Could not sync prototype session:', error.message);
        return;
      }

      iframeRef.current?.contentWindow?.postMessage(
        { type: 'gc-user', name: currentUser, accessToken: session?.access_token ?? '' },
        window.location.origin
      );
    } catch (error) {
      console.error('Could not sync prototype session:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    const handlePrototypeMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== 'gc-logout'
      ) {
        return;
      }

      void handleLogout();
    };

    window.addEventListener('message', handlePrototypeMessage);
    return () => window.removeEventListener('message', handlePrototypeMessage);
  }, [handleLogout]);

  return (
    <div className="relative h-screen w-full bg-white">
      {/* Hidden Admin Controls: Only displayed once the user is logged in */}
      {frameQuery && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-slate-200">
          <Link
            to="/maintain-records"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 rounded hover:bg-indigo-800 transition"
          >
            Maintain Records
          </Link>
          <button
            onClick={() => void handleLogout()}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      )}

      {frameQuery && (
        <iframe
          ref={iframeRef}
          onLoad={syncPrototypeUser}
          title="GlobalCougar prototype"
          src={`/globalcougar.html?${frameQuery}`}
          className="h-full w-full border-0 bg-white"
        />
      )}
    </div>
  );
}