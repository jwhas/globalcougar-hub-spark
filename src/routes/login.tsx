import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

// 1. Bypass Lovable's client file and forcefully map your exact project credentials.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qyekvqxjwecncalfiaef.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWt2cXhqd2VjbmNhbGZpYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzAzNDgsImV4cCI6MjEwNjgwNjM0OH0.02YDl_sKggpguJ7XHBTrImssufADAcnwPoYtDqK7B1c';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const helpTopics = [
    'Immigration & Visa', 'Academics & Deadlines', 
    'Career & Internships', 'Scholarships & Financial Aid',
    'Campus Life & Events', 'Housing & Life in Provo',
    'Health & Wellness', 'Travel & Arrival',
    'Community & Student Groups'
  ];

  const toggleTopic = (topic: string) => {
    setSelectedHelpTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const toggle = (b: string) =>
    setBubbles((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password || (!isLogin && !name)) {
      setError("You must fill in all fields to continue.");
      return;
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
        options: { data: { full_name: name } }
      });
      if (authError) setError(authError.message);
      else navigate({ to: '/' });
    }
    
    setLoading(false);
  };

  const input = 'w-full px-3 py-2 border border-gray-300 rounded';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          {isLogin ? 'Log In' : 'Create Account'}
        </h1>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., James A."
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
