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
const callingCodeByRegion: Record<string, string> = {
  AD: '+376', AE: '+971', AF: '+93', AG: '+1', AI: '+1', AL: '+355', AM: '+374', AO: '+244', AQ: '+672', AR: '+54', AS: '+1', AT: '+43', AU: '+61', AW: '+297', AX: '+358', AZ: '+994',
  BA: '+387', BB: '+1', BD: '+880', BE: '+32', BF: '+226', BG: '+359', BH: '+973', BI: '+257', BJ: '+229', BL: '+590', BM: '+1', BN: '+673', BO: '+591', BQ: '+599', BR: '+55', BS: '+1', BT: '+975', BV: '+47', BW: '+267', BY: '+375', BZ: '+501',
  CA: '+1', CC: '+61', CD: '+243', CF: '+236', CG: '+242', CH: '+41', CI: '+225', CK: '+682', CL: '+56', CM: '+237', CN: '+86', CO: '+57', CR: '+506', CU: '+53', CV: '+238', CW: '+599', CX: '+61', CY: '+357', CZ: '+420',
  DE: '+49', DJ: '+253', DK: '+45', DM: '+1', DO: '+1', DZ: '+213',
  EC: '+593', EE: '+372', EG: '+20', EH: '+212', ER: '+291', ES: '+34', ET: '+251',
  FI: '+358', FJ: '+679', FK: '+500', FM: '+691', FO: '+298', FR: '+33',
  GA: '+241', GB: '+44', GD: '+1', GE: '+995', GF: '+594', GG: '+44', GH: '+233', GI: '+350', GL: '+299', GM: '+220', GN: '+224', GP: '+590', GQ: '+240', GR: '+30', GS: '+500', GT: '+502', GU: '+1', GW: '+245', GY: '+592',
  HK: '+852', HM: '+672', HN: '+504', HR: '+385', HT: '+509', HU: '+36',
  ID: '+62', IE: '+353', IL: '+972', IM: '+44', IN: '+91', IO: '+246', IQ: '+964', IR: '+98', IS: '+354', IT: '+39',
  JE: '+44', JM: '+1', JO: '+962', JP: '+81',
  KE: '+254', KG: '+996', KH: '+855', KI: '+686', KM: '+269', KN: '+1', KP: '+850', KR: '+82', KW: '+965', KY: '+1', KZ: '+7',
  LA: '+856', LB: '+961', LC: '+1', LI: '+423', LK: '+94', LR: '+231', LS: '+266', LT: '+370', LU: '+352', LV: '+371', LY: '+218',
  MA: '+212', MC: '+377', MD: '+373', ME: '+382', MF: '+590', MG: '+261', MH: '+692', MK: '+389', ML: '+223', MM: '+95', MN: '+976', MO: '+853', MP: '+1', MQ: '+596', MR: '+222', MS: '+1', MT: '+356', MU: '+230', MV: '+960', MW: '+265', MX: '+52', MY: '+60', MZ: '+258',
  NA: '+264', NC: '+687', NE: '+227', NF: '+672', NG: '+234', NI: '+505', NL: '+31', NO: '+47', NP: '+977', NR: '+674', NU: '+683', NZ: '+64',
  OM: '+968',
  PA: '+507', PE: '+51', PF: '+689', PG: '+675', PH: '+63', PK: '+92', PL: '+48', PM: '+508', PN: '+64', PR: '+1', PS: '+970', PT: '+351', PW: '+680', PY: '+595',
  QA: '+974',
  RE: '+262', RO: '+40', RS: '+381', RU: '+7', RW: '+250',
  SA: '+966', SB: '+677', SC: '+248', SD: '+249', SE: '+46', SG: '+65', SH: '+290', SI: '+386', SJ: '+47', SK: '+421', SL: '+232', SM: '+378', SN: '+221', SO: '+252', SR: '+597', SS: '+211', ST: '+239', SV: '+503', SX: '+1', SY: '+963', SZ: '+268',
  TC: '+1', TD: '+235', TF: '+262', TG: '+228', TH: '+66', TJ: '+992', TK: '+690', TL: '+670', TM: '+993', TN: '+216', TO: '+676', TR: '+90', TT: '+1', TV: '+688', TW: '+886', TZ: '+255',
  UA: '+380', UG: '+256', UM: '+1', US: '+1', UY: '+598', UZ: '+998',
  VA: '+39', VC: '+1', VE: '+58', VG: '+1', VI: '+1', VN: '+84', VU: '+678',
  WF: '+681', WS: '+685',
  YE: '+967', YT: '+262',
  ZA: '+27', ZM: '+260', ZW: '+263',
};
const homeCountries = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
  .split(' ')
  .map((region) => ({
    region,
    name: countryDisplayNames.of(region) ?? region,
    callingCode: callingCodeByRegion[region],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

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
                                key={homeCountry.region}
                                value={`${homeCountry.callingCode} ${homeCountry.name} ${homeCountry.region}`}
                                onSelect={() => {
                                  setCountry(homeCountry.name);
                                  setCountryOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${country === homeCountry.name ? 'opacity-100' : 'opacity-0'}`}
                                  aria-hidden="true"
                                />
                                <span className="font-medium">{homeCountry.callingCode}</span>
                                <span>{homeCountry.name}</span>
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