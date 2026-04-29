import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  AlertCircle,
  Loader2,
  Lock,
  User,
  AtSign,
  ArrowRight,
  Server,
  Radio,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const fontSans = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
const fontDisplay = "'Fraunces', Georgia, 'Times New Roman', serif";

function AuthHeroIllustration() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[140%] w-[140%] opacity-[0.55]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 40% 20%, rgba(234, 88, 12, 0.35) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 70%, rgba(251, 146, 60, 0.18) 0%, transparent 50%), radial-gradient(circle at 50% 100%, rgba(120, 53, 15, 0.4) 0%, transparent 45%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full text-white/[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>
      {/* Floating nodes */}
      <motion.div
        className="absolute left-[12%] top-[28%] flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] shadow-[0_0_40px_-8px_rgba(251,146,60,0.35)] backdrop-blur-md"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Server className="h-7 w-7 text-orange-200/90" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        className="absolute right-[18%] top-[38%] flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Radio className="h-5 w-5 text-amber-300/80" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        className="absolute bottom-[32%] left-[22%] flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-md"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <ShieldCheck className="h-6 w-6 text-orange-100/70" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        className="absolute bottom-[26%] right-[14%] flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-emerald-950/40 backdrop-blur-md"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Activity className="h-5 w-5 text-emerald-400/90" strokeWidth={1.25} />
      </motion.div>
      {/* Connection arcs */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <path
          d="M 120 180 Q 280 120 420 220"
          fill="none"
          stroke="url(#auth-line)"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        <path
          d="M 420 220 Q 520 320 380 420"
          fill="none"
          stroke="url(#auth-line)"
          strokeWidth="1"
          strokeOpacity="0.25"
        />
        <defs>
          <linearGradient id="auth-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(251 146 60)" stopOpacity="0" />
            <stop offset="50%" stopColor="rgb(251 146 60)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(234 88 12)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function mapFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found for that email.';
    case 'auth/email-already-in-use':
      return 'That email is already registered.';
    case 'auth/weak-password':
      return 'Use a stronger password (at least 6 characters).';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups for this site.';
    default:
      if (err instanceof Error && err.message) return err.message;
      return 'Something went wrong. Please try again.';
  }
}

export function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setMessage('Password reset email sent. Check your inbox.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'border-white/15 bg-white/[0.06] text-[#faf7f2] placeholder:text-zinc-500 focus-visible:border-orange-400/50 focus-visible:ring-orange-500/25';

  return (
    <div
      className="min-h-screen w-full lg:flex"
      style={{ fontFamily: fontSans }}
    >
      {/* Hero panel */}
      <div className="relative flex min-h-[240px] flex-col justify-between overflow-hidden bg-[#0c0b09] px-8 py-10 text-[#faf7f2] lg:min-h-screen lg:w-[46%] lg:px-14 lg:py-12">
        <AuthHeroIllustration />
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200/90"
          >
            Argus
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]"
            style={{ fontFamily: fontDisplay }}
          >
            Observe every asset.
            <span className="block bg-gradient-to-r from-orange-200 via-amber-100 to-orange-100 bg-clip-text text-transparent">
              Trust every signal.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-400"
          >
            Multi-tenant infrastructure inventory, drift detection, and configuration governance — in one calm,
            operator-first workspace.
          </motion.p>
        </div>
        <ul className="relative z-10 mt-10 hidden gap-6 lg:mt-0 lg:flex lg:flex-col">
          {[
            'Unified CMDB across sites, racks, and devices',
            'Audit-ready trails and validation history',
            'Gemini-assisted insights where you need them',
          ].map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.25 + i * 0.08 }}
              className="flex items-start gap-3 text-sm text-zinc-500"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400/90 shadow-[0_0_12px_rgba(251,146,60,0.7)]" />
              {line}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#11100f] px-4 py-12 lg:bg-gradient-to-br lg:from-[#141210] lg:via-[#10100e] lg:to-[#0a0908] lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">Argus</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#faf7f2]" style={{ fontFamily: fontDisplay }}>
              {isForgotPassword ? 'Reset password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
          </div>

          <div
            className="rounded-3xl border border-white/[0.08] bg-[#161514]/90 p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-10"
          >
            <div className="mb-8 hidden lg:block">
              <h2
                className="text-[1.65rem] font-semibold tracking-tight text-[#faf7f2]"
                style={{ fontFamily: fontDisplay }}
              >
                {isForgotPassword ? 'Reset password' : isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {isForgotPassword
                  ? 'We will email you a secure link to choose a new password.'
                  : isSignUp
                    ? 'Pick a strong password. Your email acts as your username. Google sign-in is below.'
                    : 'Enter your username and password, or continue with Google.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-950/40 px-3 py-2.5 text-sm text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/35 px-3 py-2.5 text-sm text-emerald-100"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="name"
                      placeholder="Ada Lovelace"
                      className={`h-11 pl-10 ${inputClass}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Username
                  </Label>
                  <span className="text-[11px] text-zinc-600">use your email address</span>
                </div>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className={`h-11 pl-10 ${inputClass}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete={isSignUp ? 'email' : 'username'}
                    inputMode="email"
                    autoCapitalize="none"
                  />
                </div>
              </div>
              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password" className="text-zinc-300">
                      Password
                    </Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                        }}
                        className="text-xs font-medium text-orange-400/90 hover:text-orange-300"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={`h-11 pl-10 ${inputClass}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-[15px] font-semibold text-white shadow-[0_12px_40px_-12px_rgba(234,88,12,0.55)] hover:from-orange-500 hover:to-amber-500"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isForgotPassword ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            {!isForgotPassword && (
              <>
                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                    <span className="bg-[#161514] px-3">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-white/15 bg-white/[0.04] text-[#faf7f2] hover:bg-white/[0.08]"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt=""
                    className="mr-3 h-4 w-4"
                  />
                  Continue with Google
                </Button>
              </>
            )}
          </div>

          <div className="mt-8 px-1 text-center text-sm text-zinc-500">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="font-medium text-orange-400/90 hover:text-orange-300"
              >
                ← Back to sign in
              </button>
            ) : isSignUp ? (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="font-semibold text-orange-400/90 hover:text-orange-300"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="font-semibold text-orange-400/90 hover:text-orange-300"
                >
                  Create an account
                </button>
              </>
            )}
          </div>
          <p className="mt-6 px-2 text-center text-[11px] leading-relaxed text-zinc-600">
            By continuing you acknowledge our acceptable use policy for enterprise infrastructure data.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
