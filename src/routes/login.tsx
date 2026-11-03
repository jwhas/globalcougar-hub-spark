import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: 'Welcome to GlobalCougar | Log in or Register' },
      { name: 'description', content: 'Log in or register for GlobalCougar, the BYU international student hub.' },
      { property: 'og:title', content: 'Welcome to GlobalCougar' },
      { property: 'og:description', content: 'Log in or register for the BYU international student hub.' },
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
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [bubbles, setBubbles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggle = (b: string) =>
    setBubbles((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password) return setError('Enter your email and password.');
    if (!isLogin) {
      if (!name) return setError('Enter your full name.');
      if (!country) return setError('Pick the country you are coming from.');
      if (bubbles.length === 0) return setError('Pick at least one bubble.');
    }

    setLoading(true);
    if (isLogin) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else navigate({ to: '/' });
    } else {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name, home_country: country, situations: bubbles },
        },
      });
      if (authError) setError(authError.message);
      else if (data.session) navigate({ to: '/' });
      else {
        setInfo('Check your email to confirm your account, then log in.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  const input = 'w-full px-3 py-2 border border-gray-300 rounded';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Welcome to GlobalCougar</p>
        <div className="mt-3 mb-5 grid grid-cols-2 rounded border border-gray-200 p-1 text-sm font-semibold">
          {['Log in', 'Register'].map((label, i) => {
            const active = (i === 0) === isLogin;
            return (
              <button key={label} type="button" onClick={() => { setIsLogin(i === 0); setError(null); }}
                className={`py-2 rounded ${active ? 'bg-[#002E5D] text-white' : 'text-gray-600'}`}>
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., James A." className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country you are coming from</label>
                <input list="countryList" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Type or pick a country" className={input} />
                <datalist id="countryList">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">What do you need help with? (pick at least one)</legend>
                <div className="flex flex-wrap gap-2">
                  {BUBBLES.map((b) => {
                    const on = bubbles.includes(b);
                    return (
                      <button key={b} type="button" aria-pressed={on} onClick={() => toggle(b)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? 'bg-[#0062B8] border-[#0062B8] text-white' : 'border-gray-300 text-gray-700'}`}>
                        {b}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className={input} />
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
          {info && <p className="text-xs text-emerald-700 font-semibold">{info}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#002E5D] text-white font-semibold py-2 rounded hover:bg-[#0062B8] disabled:opacity-50">
            {loading ? 'Processing...' : isLogin ? 'Log in' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
