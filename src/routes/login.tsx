import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/login')({
  component: AuthPage,
});

type Feedback = { title: string; detail: string };

const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
const homeCountries = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
  .split(' ')
  .map((code) => countryDisplayNames.of(code) ?? code)
  .sort((a, b) => a.localeCompare(b));

// Turn the raw text the auth server returns into wording a student can act on.
function describeAuthError(message: string): Feedback {
  const m = (message || '').toLowerCase();

  if (m.includes('weak') || m.includes('known to be') || m.includes('easy to guess') || m.includes('common password') || m.includes('hibp')) {
    return {
      title: 'Please choose a different password',
      detail: "This password has appeared in a known data breach. For your security, please create a unique password that you haven't used before.",
    };
  }
  if (m.includes('at least') && m.includes('character')) {
    return {
      title: 'Your password is too short',
      detail: 'Please use a longer password, at least 6 characters, that you have not used anywhere else.',
    };
  }
  if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
    return {
      title: 'We could not match that email and password',
      detail: 'Check for a typo, or use the email you signed up with. New here? Open the Sign In tab to create an account.',
    };
  }
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return {
      title: 'Please confirm your email first',
      detail: 'We sent a confirmation link when you created your account. Open that email and click the link, then log in here.',
    };
  }
  if (m.includes('already registered') || m.includes('already exists') || m.includes('already been registered')) {
    return {
      title: 'This email already has an account',
      detail: 'Switch to the Login tab to sign in, or use a different email to create a new account.',
    };
  }
  if (m.includes('invalid email') || m.includes('validate email') || m.includes('email address is invalid')) {
    return {
      title: 'That email address does not look right',
      detail: 'Please enter a full address such as you@byu.edu.',
    };
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('try again later') || m.includes('for security')) {
    return {
      title: 'Too many attempts for now',
      detail: 'Please wait a few minutes and try again. If it keeps happening, we can help you reset your password.',
    };
  }
  if (m.includes('signups not allowed') || m.includes('signup not allowed')) {
    return {
      title: 'New accounts are closed right now',
      detail: 'Please log in with an existing account, or check back later.',
    };
  }
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return {
      title: 'We could not reach the server',
      detail: 'Check your internet connection and try again. Nothing was saved from this attempt.',
    };
  }

  return {
    title: 'Something went wrong',
    detail: message || 'Please try again. If it keeps happening, let us know and we will fix it.',
  };
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [selectedHelpTopics, setSelectedHelpTopics] = useState<string[]>([]);
  const [error, setError] = useState<Feedback | null>(null);
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

    const missing: string[] = [];
    if (!isLogin) {
      if (!name.trim()) missing.push('your full name');
      if (!country.trim()) missing.push('your home country');
      if (selectedHelpTopics.length === 0) missing.push('at least one interest');
    }
    if (!email.trim()) missing.push('your email');
    if (!password) missing.push('a password');

    if (missing.length > 0) {
      setError({
        title: 'Please finish these first',
        detail: `Still needed: ${missing.join(', ')}.`,
      });
      return;
    }

    setLoading(true);
    if (isLogin) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(describeAuthError(authError.message));
      else navigate({ to: '/' });
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name, country, help_topics: selectedHelpTopics } }
      });
      if (authError) setError(describeAuthError(authError.message));
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
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-white text-[#003366] shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign In
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
                  <label htmlFor="home-country" className="block text-sm font-bold text-gray-700 mb-2">Select Your Home Country</label>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <button
                        id="home-country"
                        type="button"
                        role="combobox"
                        aria-expanded={countryOpen}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg text-left focus:ring-2 focus:ring-[#003366] outline-none"
                      >
                        <span className={country ? 'text-gray-900' : 'text-gray-400'}>
                          {country || 'Choose or search for a country...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Type to filter countries..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {homeCountries.map((homeCountry) => (
                              <CommandItem
                                key={homeCountry}
                                value={homeCountry}
                                onSelect={() => {
                                  setCountry(homeCountry);
                                  setCountryOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${country === homeCountry ? 'opacity-100' : 'opacity-0'}`}
                                  aria-hidden="true"
                                />
                                {homeCountry}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
              <div role="alert" className="text-sm bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="font-bold text-red-700 mb-1">{error.title}</div>
                <div className="text-red-600 leading-relaxed">{error.detail}</div>
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