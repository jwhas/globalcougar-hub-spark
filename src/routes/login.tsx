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
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || (!isLogin && (!name || !country || selectedHelpTopics.length === 0))) {
      setError("Please fill in all required fields and select at least one interest.");
      return;
    }
    setLoading(true);
    if (isLogin) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else navigate({ to: '/' });
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name, country, help_topics: selectedHelpTopics } }
      });
      if (authError) setError(authError.message);
      else navigate({ to: '/' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* LEFT SIDE - Brand & Welcome */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-center bg-white border-r border-gray-100">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-[#002255] text-white font-bold px-2 py-1 rounded text-sm tracking-wider">GC</div>
            <div>
              <div className="font-bold text-[#002255] leading-tight">GlobalCougar</div>
              <div className="text-xs text-gray-500">BYU International Student Hub</div>
            </div>
          </div>
          
          <h1 className="text-6xl font-serif text-[#002255] mb-6">Welcome!</h1>
          <p className="text-gray-600 text-lg mb-12 leading-relaxed">
            A personalized home base for international students—from pre-arrival paperwork to your first semester in Provo.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${isLogin ? 'bg-white text-[#003366] shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Login (Returning User)
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-white text-[#003366] shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Begin (New User)
            </button>
          </div>

          <div className="mb-8">
            <div className="text-xs font-bold text-[#0066CC] tracking-widest uppercase mb-1">GlobalCougar</div>
            <h2 className="text-2xl font-extrabold text-[#002255]">INTERNATIONAL STUDENT HUB</h2>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jacob Haslam"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Your Home Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Select Your Current Interests <span className="font-normal text-gray-500">(Select at least one)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {helpTopics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                          selectedHelpTopics.includes(topic)
                            ? 'bg-[#003366] text-white border-[#003366]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@byu.edu"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066CC] hover:bg-[#0055AA] text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-70 mt-2 shadow-md shadow-blue-200/50"
            >
              {loading ? 'Processing...' : isLogin ? 'Login to Hub →' : 'Continue to Hub →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}