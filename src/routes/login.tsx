import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

// Bypass Lovable client and hardcode Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qyekvqxjwecncalfiaef.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWt2cXhqd2VjbmNhbGZpYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzAzNDgsImV4cCI6MjEwNjgwNjM0OH0.02YDl_sKggpguJ7XHBTrImssufADAcnwPoYtDqK7B1c';
const supabase = createClient(supabaseUrl, supabaseKey);

export const Route = createFileRoute('/login')({
  component: AuthPage,
});

function AuthPage() {
  // Defaults to Login mode so returning users only see Email/Password
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [selectedHelpTopics, setSelectedHelpTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (!isLogin && (!name || !country || selectedHelpTopics.length === 0))) {
      setError("Please fill in all required fields and select at least one help topic.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else navigate({ to: '/' });
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            country: country,
            help_topics: selectedHelpTopics,
          }
        }
      });
      if (authError) setError(authError.message);
      else navigate({ to: '/' });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-2xl border border-gray-100">
        
        <div className="text-center mb-6">
          <h1 className="text-sm font-bold text-blue-600 tracking-wider uppercase">
            Welcome to GlobalCougar
          </h1>
        </div>

        {/* Toggle Bar */}
        <div className="flex rounded-md border border-gray-200 mb-8 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${isLogin ? 'bg-[#003366] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${!isLogin ? 'bg-[#003366] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {/* THESE FIELDS ONLY SHOW ON REGISTER */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-blue-50/30 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Country you are coming from</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">What do you need help with? (pick at least one)</label>
                <div className="flex flex-wrap gap-2">
                  {helpTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedHelpTopics.includes(topic)
                          ? 'bg-[#003366] text-white border-[#003366]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* THESE FIELDS SHOW ON BOTH LOG IN AND REGISTER */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-blue-50/30 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-xs font-bold mt-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white font-medium py-3 rounded hover:bg-[#002244] transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Log in' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}