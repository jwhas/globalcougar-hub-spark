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
        if (Array.isArray(meta['help_topics'])) qs.set('interests', meta['help_topics'].join('|'));
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
    void navigate({ to: '/login' });
  }, [navigate]);

  const syncPrototypeUser = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'gc-user', name: currentUser },
      window.location.origin
    );
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
    <div className="h-screen w-full bg-white">
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
