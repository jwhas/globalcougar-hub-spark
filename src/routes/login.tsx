import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: 'Welcome to GlobalCougar | Log in or Sign up' },
      { name: 'description', content: 'Log in or create your GlobalCougar account, the BYU international student hub.' },
      { property: 'og:title', content: 'Welcome to GlobalCougar' },
      { property: 'og:description', content: 'Log in or sign up for the BYU international student hub.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AuthPage,
});

const BUBBLES = [
  'Immigration & Visa', 'Academics & Deadlines', 'Career & Internships',
  'Scholarships & Financial Aid', 'Campus Life & Events', 'Housing & Life in Provo',
  'Health & Wellness', 'Travel & Arrival', 'Community & Student Groups',
];

const COUNTRIES = [
  'Argentina','Australia','Brazil','Canada','Chile','China','Colombia','Dominican Republic','Ecuador','France',
  'Germany','Ghana','Guatemala','Haiti','Honduras','Hong Kong SAR China','India','Indonesia','Italy','Japan',
  'Kenya','Mexico','Mongolia','Nepal','New Zealand','Nigeria','Paraguay','Peru','Philippines','Samoa',
  'South Africa','South Korea','Spain','Taiwan','Thailand','Tonga','Ukraine','United Kingdom','Uruguay','Venezuela','Vietnam',
];

function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [bubbles, setBubbles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const toggle = (b: string) =>
    setBubbles((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) return setError('Please enter your email and password.');
    if (!isLogin) {
      if (!name.trim()) return setError('Please enter your full name.');
      if (!country.trim()) return setError('Please choose the country you are coming from.');
      if (!bubbles.length) return setError('Please pick at least one bubble.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) setError(authError.message);
        else void navigate({ to: '/' });
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim(), home_country: country.trim(), situations: bubbles },
          },
        });
        if (authError) setError(authError.message);
        else if (data.session) void navigate({ to: '/' });
        else {
          setMode('login');
          setPassword('');
          setInfo('Account created! Check your email to confirm it, then log in here.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-md">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">GlobalCougar</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? 'Log in to open your BYU student hub.' : 'You only do this once. We will remember your country and interests.'}
        </p>

        <form onSubmit={handleAuth} className="mt-5 flex flex-col gap-4">
          {!isLogin && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Full name</label>
                <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., James A." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Country you are coming from</label>
                <input className={input} list="gc-countries" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Start typing your country" />
                <datalist id="gc-countries">
                  {COUNTRIES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">What do you want help with? (pick at least one)</legend>
                <div className="flex flex-wrap gap-2">
                  {BUBBLES.map((b) => {
                    const on = bubbles.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        aria-pressed={on}
                        onClick={() => toggle(b)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'}`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
            <input type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete={isLogin ? 'current-password' : 'new-password'} />
          </div>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          {info && <p className="text-xs font-semibold text-primary">{info}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          {isLogin ? 'New to GlobalCougar?' : 'Already have an account?'}
          <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')} className="ml-2 rounded-md border border-primary px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/10">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
