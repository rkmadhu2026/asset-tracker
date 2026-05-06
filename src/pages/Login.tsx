import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Database, Layers, ClipboardList, Building2, Sparkles,
  ArrowRight, X, Lock, AtSign, Loader2, ChevronRight, Server,
  AlertTriangle, Activity, CheckCircle2, TrendingUp, Zap,
  Network, BarChart3, ShieldCheck, FileCode2, Globe, Menu,
} from 'lucide-react';

/* ── Design tokens ───────────────────────────────────────────────────────── */
const FD   = "'Lora', Georgia, serif";
const FM   = "'JetBrains Mono', monospace";
const FS   = "'Inter', sans-serif";
const ACC  = '#C8622E';
const ACC2 = '#E07850';
const ABG  = '#FAE8DC';
const DARK = '#1A1713';
const DK2  = '#252119';
const DK3  = '#14120E';
const CREAM= '#F7F3ED';
const SURF = '#ffffff';
const BDR  = '#E8E1D8';
const TEXT = '#19160F';
const T2   = '#3D3830';
const T3   = '#6B6458';
const DIM  = '#A09688';

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD MOCKUP  (SVG product illustration — hero right panel)
══════════════════════════════════════════════════════════════════════════ */
function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 580 400"
      className="w-full h-auto"
      style={{ filter: 'drop-shadow(0 32px 64px rgba(26,23,19,0.55))' }}
      aria-hidden
    >
      {/* Window frame */}
      <rect width="580" height="400" rx="14" fill={DARK} />

      {/* Title bar */}
      <rect width="580" height="38" rx="14" fill={DK3} />
      <rect y="24" width="580" height="14" fill={DK3} />
      <circle cx="22" cy="19" r="5.5" fill="#DC2626" />
      <circle cx="40" cy="19" r="5.5" fill="#D97706" />
      <circle cx="58" cy="19" r="5.5" fill="#16A34A" />
      <text x="290" y="23" textAnchor="middle" fill={DIM} fontSize="10.5" fontFamily="Inter,sans-serif">
        Argus — LinkedEye Asset Intelligence
      </text>

      {/* Sidebar */}
      <rect x="0" y="38" width="166" height="362" fill={DK3} />

      {/* Sidebar logo */}
      <rect x="12" y="50" width="32" height="32" rx="8" fill={ACC} />
      <text x="28" y="71" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Georgia,serif">A</text>
      <text x="53" y="63" fill="#F7F3ED" fontSize="12.5" fontWeight="600" fontFamily="Georgia,serif">Argus</text>
      <text x="53" y="77" fill={DIM} fontSize="8.5" fontFamily="Inter,sans-serif" letterSpacing="0.08em">LINKEDEYE</text>
      <line x1="12" y1="96" x2="154" y2="96" stroke={DK2} strokeWidth="1" />

      {/* Active nav item */}
      <rect x="8" y="102" width="150" height="26" rx="6" fill={ABG} />
      <rect x="8" y="102" width="3" height="26" rx="1.5" fill={ACC} />
      <rect x="18" y="110" width="9" height="9" rx="2" fill={ACC} opacity="0.7" />
      <text x="33" y="119" fill={ACC} fontSize="10.5" fontWeight="600" fontFamily="Inter,sans-serif">Dashboard</text>

      {/* Other nav items */}
      {['Clients','Sites','CMDB / Assets','Racks','Infrastructure','Topology','Monitoring','Audit Log'].map((item, i) => (
        <g key={item}>
          <rect x="18" y={138 + i * 25 + 6} width="8" height="8" rx="2" fill={DIM} opacity="0.35" />
          <text x="33" y={138 + i * 25 + 14} fill={T3} fontSize="10" fontFamily="Inter,sans-serif">{item}</text>
        </g>
      ))}

      {/* User chip at sidebar bottom */}
      <rect x="8" y="364" width="150" height="28" rx="7" fill={DK2} />
      <circle cx="24" cy="378" r="9" fill={ACC} />
      <text x="24" y="382" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Inter">RK</text>
      <text x="40" y="375" fill="#F7F3ED" fontSize="9.5" fontWeight="600" fontFamily="Inter,sans-serif">Raj Kumar</text>
      <text x="40" y="387" fill={DIM} fontSize="8" fontFamily="Inter,sans-serif">ADMIN</text>

      {/* Header bar */}
      <rect x="166" y="38" width="414" height="44" fill="#1E1B13" />
      <text x="182" y="65" fill="#F7F3ED" fontSize="13.5" fontWeight="600" fontFamily="Georgia,serif">Executive Dashboard</text>
      <rect x="504" y="48" width="66" height="24" rx="12" fill="#D1FAE5" />
      <circle cx="516" cy="60" r="4" fill="#16A34A" />
      <text x="524" y="64" fill="#065F46" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif">Healthy</text>

      {/* Stat cards */}
      {[
        { label: 'Total Hardware', val: '1,847', bar: '#2563EB', x: 174 },
        { label: 'Open Drifts',    val: '3',     bar: '#D97706', x: 284 },
        { label: 'Compliance',     val: '94%',   bar: '#16A34A', x: 394 },
        { label: 'Vendors',        val: '11',    bar: ACC,       x: 504 },
      ].map(c => (
        <g key={c.label}>
          <rect x={c.x - 6} y="94" width="102" height="68" rx="8" fill={DK2} />
          <rect x={c.x - 6} y="94" width="3"   height="68" rx="1.5" fill={c.bar} />
          <text x={c.x + 2} y="112" fill={DIM} fontSize="8" fontFamily="Inter,sans-serif">{c.label}</text>
          <text x={c.x + 2} y="142" fill="white" fontSize="22" fontWeight="600" fontFamily="Georgia,serif">{c.val}</text>
          <rect x={c.x + 2} y="152" width="22" height="3" rx="1.5" fill={c.bar} opacity="0.5" />
        </g>
      ))}

      {/* Area chart panel */}
      <rect x="174" y="174" width="204" height="128" rx="8" fill={DK2} />
      <text x="184" y="190" fill={DIM} fontSize="8.5" fontFamily="Inter,sans-serif">Network Throughput (Gbps)</text>
      {[0,1,2,3].map(i => (
        <line key={i} x1="184" y1={205 + i * 22} x2="368" y2={205 + i * 22}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={ACC} stopOpacity="0.35" />
          <stop offset="100%" stopColor={ACC} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d="M184 270 L214 255 L244 232 L274 216 L304 226 L334 238 L364 248 L364 285 L184 285 Z"
        fill="url(#cg)" />
      <path d="M184 270 L214 255 L244 232 L274 216 L304 226 L334 238 L364 248"
        fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {[[184,270],[214,255],[244,232],[274,216],[304,226],[334,238],[364,248]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={ACC} />
      ))}

      {/* Topology panel */}
      <rect x="386" y="174" width="192" height="128" rx="8" fill={DK2} />
      <text x="396" y="190" fill={DIM} fontSize="8.5" fontFamily="Inter,sans-serif">Network Topology</text>
      {/* Core node */}
      <circle cx="482" cy="234" r="14" fill={DARK} stroke={ACC} strokeWidth="1.5" />
      <text x="482" y="238" textAnchor="middle" fill={ACC} fontSize="7" fontWeight="700" fontFamily="Inter,sans-serif">CORE</text>
      {/* Satellite nodes */}
      {[
        { cx: 432, cy: 212, c: '#2563EB', l: 'FW'  },
        { cx: 532, cy: 212, c: '#16A34A', l: 'SRV' },
        { cx: 438, cy: 260, c: '#7C3AED', l: 'SW'  },
        { cx: 526, cy: 262, c: '#16A34A', l: 'DB'  },
      ].map(n => (
        <g key={n.l}>
          <line x1={n.cx} y1={n.cy} x2="482" y2="234"
            stroke="rgba(200,98,46,0.25)" strokeWidth="1" />
          <circle cx={n.cx} cy={n.cy} r="9" fill={DARK} stroke={n.c} strokeWidth="1.2" />
          <text x={n.cx} y={n.cy + 4} textAnchor="middle" fill={n.c} fontSize="6" fontWeight="700" fontFamily="Inter,sans-serif">{n.l}</text>
        </g>
      ))}
      {/* Pulse on core */}
      <circle cx="482" cy="234" r="20" fill="none" stroke={ACC} strokeWidth="0.5" opacity="0.3" />

      {/* Audit log table */}
      <rect x="174" y="314" width="404" height="72" rx="8" fill={DK2} />
      <text x="184" y="330" fill={DIM} fontSize="8.5" fontFamily="Inter,sans-serif">Recent Audit Activity</text>
      {[
        { msg: 'Config pushed to Cisco ASA-5516', sev: 'Info',    c: '#16A34A' },
        { msg: 'New device discovered: Aruba-SW-04',  sev: 'Info',    c: '#16A34A' },
        { msg: 'Drift detected on BGP config',         sev: 'Warning', c: '#D97706' },
      ].map((r, i) => (
        <g key={i}>
          <circle cx="184" cy={342 + i * 14} r="3" fill={r.c} />
          <text x="193" y={346 + i * 14} fill="#A09688" fontSize="8.5" fontFamily="Inter,sans-serif">{r.msg}</text>
          <rect x="518" y={336 + i * 14} width="52" height="12" rx="6" fill={`${r.c}22`} />
          <text x="544" y={346 + i * 14} textAnchor="middle" fill={r.c} fontSize="7.5" fontWeight="700" fontFamily="Inter,sans-serif">{r.sev}</text>
        </g>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TOPOLOGY ILLUSTRATION  (smaller, for feature section)
══════════════════════════════════════════════════════════════════════════ */
function TopologyIllustration() {
  return (
    <svg viewBox="0 0 440 300" className="w-full h-auto" aria-hidden>
      <rect width="440" height="300" rx="12" fill={DK3} />
      <text x="20" y="28" fill={DIM} fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">Live Topology — HQ Site</text>
      {/* Grid */}
      {[60,110,160,210,260].map(y => (
        <line key={y} x1="10" y1={y} x2="430" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Edges */}
      {[
        [220,140,100,90], [220,140,340,90],
        [220,140,140,200],[220,140,300,200],
        [100,90,60,160],  [340,90,380,160],
        [140,200,100,260],[300,200,340,260],
      ].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(200,98,46,0.22)" strokeWidth="1.2" />
      ))}
      {/* Nodes */}
      {[
        { x:220, y:140, r:18, c:ACC,      label:'CORE',  sub:'Switch' },
        { x:100, y:90,  r:13, c:'#2563EB',label:'FW-01', sub:'Cisco'  },
        { x:340, y:90,  r:13, c:'#2563EB',label:'FW-02', sub:'Fortinet'},
        { x:140, y:200, r:12, c:'#7C3AED',label:'SW-A',  sub:'Aruba'  },
        { x:300, y:200, r:12, c:'#7C3AED',label:'SW-B',  sub:'Cisco'  },
        { x:60,  y:160, r:10, c:'#16A34A',label:'SRV',   sub:'Dell'   },
        { x:380, y:160, r:10, c:'#16A34A',label:'DB',    sub:'HP'     },
        { x:100, y:260, r:9,  c:'#6B46C1',label:'WS',    sub:'10 hosts'},
        { x:340, y:260, r:9,  c:'#6B46C1',label:'IoT',   sub:'24 dev' },
      ].map(n => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={n.r+5} fill={n.c} opacity="0.08" />
          <circle cx={n.x} cy={n.y} r={n.r}   fill={DARK} stroke={n.c} strokeWidth="1.4" />
          <text x={n.x} y={n.y+4} textAnchor="middle" fill={n.c} fontSize={n.r > 14 ? 7 : 6} fontWeight="700" fontFamily="Inter,sans-serif">{n.label}</text>
          <text x={n.x} y={n.y+n.r+11} textAnchor="middle" fill={DIM} fontSize="7" fontFamily="Inter,sans-serif">{n.sub}</text>
        </g>
      ))}
      {/* Animated packet dots (static in SVG — will show as positioned) */}
      <circle cx="160" cy="115" r="3" fill={ACC2} opacity="0.9" />
      <circle cx="280" cy="170" r="3" fill="#2563EB" opacity="0.8" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SIGN-IN MODAL
══════════════════════════════════════════════════════════════════════════ */
function SignInModal({ onClose }: { onClose: () => void }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp]   = useState(false);
  const [email,    setEmail]      = useState('');
  const [password, setPassword]   = useState('');
  const [name,     setName]       = useState('');
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(26,23,19,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative w-full max-w-[420px] rounded-2xl overflow-hidden"
        style={{ background: SURF, boxShadow: '0 32px 80px rgba(26,23,19,0.4)' }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Orange top strip */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${ACC} 0%, ${ACC2} 100%)` }} />

        <div className="px-8 pt-7 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${ACC}, #A84E24)` }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ACC }}>Argus · LinkedEye</span>
              </div>
              <h2 className="text-[1.45rem] font-semibold tracking-tight" style={{ fontFamily: FD, color: TEXT }}>
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h2>
              <p className="mt-1 text-[13px]" style={{ color: T3 }}>
                {isSignUp ? 'Set up your Argus workspace.' : 'Sign in to your dashboard.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors mt-0.5"
              style={{ color: DIM }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F0EAE0')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: T2 }}>Full name</label>
                <input
                  type="text" placeholder="Ada Lovelace"
                  value={name} onChange={e => setName(e.target.value)} required
                  className="w-full h-11 rounded-xl px-4 text-[14px] outline-none transition-all"
                  style={{ border: `1.5px solid ${BDR}`, background: '#FDFAF7', color: TEXT, fontFamily: FS }}
                  onFocus={e => (e.target.style.borderColor = ACC)}
                  onBlur={e  => (e.target.style.borderColor = BDR)}
                />
              </div>
            )}

            <div>
              <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: T2 }}>Email</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: DIM }} />
                <input
                  type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  autoCapitalize="none"
                  className="w-full h-11 rounded-xl pl-10 pr-4 text-[14px] outline-none transition-all"
                  style={{ border: `1.5px solid ${BDR}`, background: '#FDFAF7', color: TEXT, fontFamily: FS }}
                  onFocus={e => (e.target.style.borderColor = ACC)}
                  onBlur={e  => (e.target.style.borderColor = BDR)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: T2 }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: DIM }} />
                <input
                  type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-11 rounded-xl pl-10 pr-4 text-[14px] outline-none transition-all"
                  style={{ border: `1.5px solid ${BDR}`, background: '#FDFAF7', color: TEXT, fontFamily: FS }}
                  onFocus={e => (e.target.style.borderColor = ACC)}
                  onBlur={e  => (e.target.style.borderColor = BDR)}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-1 w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold text-white transition-all duration-150 disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)`,
                boxShadow: `0 8px 24px -8px rgba(200,98,46,0.55)`,
                fontFamily: FS,
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isSignUp ? 'Create account' : 'Sign in to Dashboard'}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px]" style={{ color: T3 }}>
            {isSignUp ? 'Already registered? ' : 'New here? '}
            <button
              type="button"
              onClick={() => { setIsSignUp(v => !v); setError(null); }}
              className="font-semibold hover:underline"
              style={{ color: ACC }}
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Database,
    title: 'Unified CMDB',
    desc: 'Full asset inventory across racks, sites, and clients. Every CI tracked from discovery to decommission.',
    color: '#2563EB',
  },
  {
    icon: AlertTriangle,
    title: 'Drift Detection',
    desc: 'Real-time alerts when device configurations deviate from approved baselines. Resolve in one click.',
    color: '#D97706',
  },
  {
    icon: Layers,
    title: 'Network Topology',
    desc: 'Visual L2/L3 topology maps updated automatically as your infrastructure changes.',
    color: '#7C3AED',
  },
  {
    icon: ClipboardList,
    title: 'Audit Trails',
    desc: 'Immutable, timestamped logs of every change. Ready for RBI, SEBI, and ISO audits.',
    color: '#16A34A',
  },
  {
    icon: Building2,
    title: 'Multi-Tenant',
    desc: 'Strict data isolation per financial institution. One platform, 18+ client environments.',
    color: ACC,
  },
  {
    icon: Sparkles,
    title: 'AI-Assisted Ops',
    desc: 'Gemini AI surfaces anomalies, suggests configs, and answers questions about your network.',
    color: '#0891B2',
  },
];

const STATS = [
  { val: '300%',  label: 'Return on Investment',          sub: 'vs. manual tracking' },
  { val: '65%',   label: 'Faster incident response',      sub: 'mean-time-to-resolve' },
  { val: '18+',   label: 'Financial institutions',        sub: 'SEBI & RBI regulated' },
  { val: '99.8%', label: 'Platform uptime',               sub: 'SLA guaranteed' },
];

export function Login() {
  const [showAuth,  setShowAuth]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: FS, background: CREAM, color: TEXT }}>

      {/* ════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(253,250,247,0.94)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled ? `1px solid ${BDR}` : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)`, boxShadow: `0 4px 12px rgba(200,98,46,0.35)` }}
            >
              <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-[16px] font-semibold" style={{ fontFamily: FD, color: TEXT }}>Argus</span>
            <span
              className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
              style={{ background: ABG, color: ACC }}
            >LinkedEye</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-medium" style={{ color: T3 }}>
            {['Features','Compliance','Integrations','Pricing'].map(n => (
              <a key={n} href="#" className="hover:text-[#19160F] transition-colors">{n}</a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              className="hidden md:block text-[13px] font-medium transition-colors"
              style={{ color: T3 }}
              onClick={() => setShowAuth(true)}
            >
              Sign in
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)`,
                boxShadow: `0 4px 16px rgba(200,98,46,0.35)`,
              }}
            >
              Access Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button className="md:hidden p-1.5" style={{ color: T3 }} onClick={() => setMobileNav(v => !v)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="md:hidden px-5 pb-4 pt-2 flex flex-col gap-3"
              style={{ background: 'rgba(253,250,247,0.97)', borderBottom: `1px solid ${BDR}` }}
            >
              {['Features','Compliance','Integrations','Pricing'].map(n => (
                <a key={n} href="#" className="text-[14px] font-medium py-1" style={{ color: T3 }}>{n}</a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="min-h-screen pt-28 pb-16 px-5 sm:px-8 flex items-center" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            >
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold mb-6"
                style={{ background: ABG, color: ACC, border: `1px solid ${ACC}33` }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACC }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACC }} />
                </span>
                Trusted by 18 SEBI &amp; RBI regulated institutions
              </div>

              {/* Headline */}
              <h1
                className="text-[2.6rem] sm:text-[3.1rem] lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight mb-5"
                style={{ fontFamily: FD, color: TEXT }}
              >
                Complete Network
                <span className="block" style={{ color: ACC }}>Asset Intelligence</span>
                <span className="block text-[0.62em] font-normal italic" style={{ color: T3 }}>
                  for financial infrastructure.
                </span>
              </h1>

              <p className="text-[16px] leading-[1.7] mb-8 max-w-lg" style={{ color: T3 }}>
                Argus gives your network operations team a single, audit-ready view of every
                device, configuration, and connection — across all sites and clients.
              </p>

              {/* Mini stat pills */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { val: '1,847+', label: 'Assets tracked' },
                  { val: '24',     label: 'Active sites' },
                  { val: '99.8%',  label: 'Uptime' },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex items-baseline gap-1.5 rounded-xl px-3.5 py-2"
                    style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
                  >
                    <span className="text-[17px] font-bold" style={{ fontFamily: FD, color: TEXT }}>{s.val}</span>
                    <span className="text-[11px]" style={{ color: DIM }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-150"
                  style={{
                    background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)`,
                    boxShadow: `0 10px 32px -8px rgba(200,98,46,0.5)`,
                  }}
                >
                  Sign In to Dashboard <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#features"
                  className="flex items-center gap-1.5 rounded-xl px-5 py-3.5 text-[15px] font-medium transition-all"
                  style={{ background: SURF, border: `1px solid ${BDR}`, color: T2, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
                >
                  See features <ChevronRight className="h-4 w-4" style={{ color: DIM }} />
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BDR}` }}>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: DIM }}>
                  Protecting infrastructure at
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {['IndMoney','PL India','Way2Wealth','SMIFS','Mirae Asset','ISV Capital','NEO Wealth'].map(n => (
                    <span key={n} className="text-[12.5px] font-semibold" style={{ color: T3 }}>{n}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: product mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Glow behind mockup */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `radial-gradient(ellipse at center, rgba(200,98,46,0.18) 0%, transparent 70%)`,
                filter: 'blur(32px)',
                transform: 'scale(1.1)',
              }}
            />
            <DashboardMockup />

            {/* Floating badge */}
            <motion.div
              className="absolute -bottom-4 -left-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{ background: SURF, border: `1px solid ${BDR}`, boxShadow: '0 8px 32px rgba(41,37,36,0.12)' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500 inline-flex" />
              </span>
              <span className="text-[12.5px] font-semibold" style={{ color: TEXT }}>Live — 0 critical alerts</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════════════════ */}
      <section style={{ background: DARK }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <p
                  className="text-[2.8rem] sm:text-[3.2rem] font-semibold leading-none mb-2"
                  style={{ fontFamily: FD, color: ACC2 }}
                >
                  {s.val}
                </p>
                <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#F7F3ED' }}>{s.label}</p>
                <p className="text-[11px]" style={{ color: DIM }}>{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FEATURES GRID
      ════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 px-5 sm:px-8" style={{ background: SURF }}>
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8" style={{ background: ACC }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ACC }}>Why Argus</span>
              <span className="h-px w-8" style={{ background: ACC }} />
            </div>
            <h2
              className="text-[2rem] sm:text-[2.4rem] font-semibold tracking-tight mb-4"
              style={{ fontFamily: FD, color: TEXT }}
            >
              Everything your ops team needs,<br />
              <em className="font-normal" style={{ color: ACC }}>nothing they don't.</em>
            </h2>
            <p className="text-[15px] max-w-xl mx-auto" style={{ color: T3 }}>
              Built specifically for network operations at SEBI-regulated financial institutions,
              Argus replaces spreadsheets, disconnected tools, and tribal knowledge.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl p-6 group transition-all duration-200"
                  style={{ background: CREAM, border: `1px solid ${BDR}`, borderLeft: `3px solid ${f.color}` }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(41,37,36,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                    style={{ background: `${f.color}14` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: f.color }} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2" style={{ fontFamily: FD, color: TEXT }}>
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] leading-[1.65]" style={{ color: T3 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          PLATFORM SECTION  (topology visual)
      ════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 sm:px-8" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          {/* Copy */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="h-px w-6" style={{ background: ACC }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ACC }}>Live Topology</span>
            </div>
            <h2
              className="text-[2rem] sm:text-[2.3rem] font-semibold tracking-tight mb-5 leading-[1.15]"
              style={{ fontFamily: FD, color: TEXT }}
            >
              See your network as it<br />
              <em className="font-normal" style={{ color: ACC }}>actually is.</em>
            </h2>
            <p className="text-[15px] leading-[1.7] mb-6" style={{ color: T3 }}>
              Argus auto-discovers every device on your network and renders a live, interactive
              topology map — L2 connections, VLANs, and routing paths included.
              No manual diagramming, ever again.
            </p>
            <ul className="space-y-3">
              {[
                'Auto-discovery via SNMP, SSH, and API polling',
                'Click any node to view full device config and history',
                'Drift indicators shown directly on the topology',
                'Export topology as SVG or PNG for audit documentation',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-[13.5px]" style={{ color: T2 }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#16A34A' }} strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowAuth(true)}
              className="mt-8 flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)`, boxShadow: `0 8px 24px -6px rgba(200,98,46,0.45)` }}
            >
              Explore the platform <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Topology illustration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: `radial-gradient(ellipse at 30% 50%, rgba(200,98,46,0.12) 0%, transparent 65%)`, filter: 'blur(24px)' }}
            />
            <TopologyIllustration />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          COMPLIANCE CALLOUT
      ════════════════════════════════════════════════════ */}
      <section style={{ background: SURF }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
          <div
            className="rounded-2xl p-8 sm:p-12 grid sm:grid-cols-3 gap-8"
            style={{ background: DARK, border: `1px solid rgba(200,98,46,0.2)` }}
          >
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-5" style={{ background: ACC2 }} />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: ACC2 }}>Audit-Ready by Design</span>
              </div>
              <h2 className="text-[1.9rem] font-semibold leading-tight mb-4" style={{ fontFamily: FD, color: '#F7F3ED' }}>
                Built for RBI, SEBI,<br />and ISO 27001 compliance.
              </h2>
              <p className="text-[14px] leading-[1.7] mb-6" style={{ color: DIM }}>
                Every configuration change, user action, and drift event is captured in an
                immutable audit log. Generate compliance reports for any framework in seconds.
              </p>
              <div className="flex flex-wrap gap-2">
                {['RBI Circular','SEBI Guidelines','ISO 27001','SOC 2 Type II','CIS Benchmarks'].map(tag => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-[11.5px] font-semibold"
                    style={{ background: `${ACC}22`, color: ACC2, border: `1px solid ${ACC}33` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-5">
              {[
                { val: '100%', label: 'Audit trail coverage' },
                { val: '<30s', label: 'Report generation' },
                { val: '5 yr', label: 'Log retention' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[2rem] font-semibold leading-none" style={{ fontFamily: FD, color: ACC2 }}>{s.val}</p>
                  <p className="text-[12px] mt-1" style={{ color: DIM }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 sm:px-8 text-center" style={{ background: CREAM }}>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold mb-6"
              style={{ background: ABG, color: ACC, border: `1px solid ${ACC}33` }}
            >
              <Activity className="h-3 w-3" /> Zero setup required for your existing network
            </div>
            <h2
              className="text-[2.2rem] sm:text-[2.7rem] font-semibold tracking-tight mb-5 leading-[1.1]"
              style={{ fontFamily: FD, color: TEXT }}
            >
              Ready to take control of<br />
              <em className="font-normal" style={{ color: ACC }}>your infrastructure?</em>
            </h2>
            <p className="text-[15px] leading-[1.7] mb-8" style={{ color: T3 }}>
              Sign in to your Argus dashboard. Your CMDB, topology, and audit trails are waiting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 rounded-xl px-7 py-4 text-[15px] font-semibold text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)`,
                  boxShadow: `0 12px 36px -8px rgba(200,98,46,0.5)`,
                }}
              >
                Sign In to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="mailto:devops@finspot.in"
                className="flex items-center gap-2 rounded-xl px-6 py-4 text-[15px] font-medium transition-all"
                style={{ background: SURF, border: `1px solid ${BDR}`, color: T2, boxShadow: '0 1px 4px rgba(41,37,36,0.07)' }}
              >
                Contact FinSpot team
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer style={{ background: DARK, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: `linear-gradient(135deg, ${ACC} 0%, #A84E24 100%)` }}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="text-[14px] font-semibold" style={{ fontFamily: FD, color: '#F7F3ED' }}>Argus</span>
            <span className="text-[11px]" style={{ color: DIM }}>by FinSpot Technologies</span>
          </div>
          <div className="flex items-center gap-6 text-[12px]" style={{ color: DIM }}>
            <a href="mailto:devops@finspot.in" className="hover:text-white transition-colors">devops@finspot.in</a>
            <span>© 2026 FinSpot Technologies</span>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════
          SIGN-IN MODAL
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAuth && <SignInModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
}
