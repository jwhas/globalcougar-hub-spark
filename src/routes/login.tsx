import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Query your Supabase user table to check if the student exists
    const { data, error: dbError } = await supabase
      .from('USER') // Matches the normalized entity from your database design
      .select('name')
      .eq('name', name)
      .single();

    if (dbError || !data) {
      setError('User not found. Try entering "James A."');
      setLoading(false);
      return;
    }

    // Save to the computer's browser storage
    localStorage.setItem('globalcougar_user', data.name);
    
    // Redirect back to the home page
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Student Login</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., James A."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}