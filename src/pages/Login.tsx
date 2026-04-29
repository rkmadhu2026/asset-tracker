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

/** Soft watercolor-style accents on warm paper — light editorial feel */
function AuthHeroIllustrationLight() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 15% 15%, rgba(214, 154, 138, 0.14) 0%, transparent 58%), radial-gradient(ellipse 80% 55% at 85% 75%, rgba(245, 208, 164, 0.22) 0%, transparent 52%), radial-gradient(ellipse 60% 45% at 50% 50%, rgba(232, 221, 206, 0.35) 0%, transparent 60%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full text-stone-300/50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="auth-grid-light" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid-light)" opacity="0.45" />
      </svg>
      <motion.div
        className="absolute left-[12%] top-[26%] flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200/90 bg-white/90 shadow-[0_12px_36px_-16px_rgba(41,37,36,0.18)]"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Server className="h-7 w-7 text-[#b85c4a]" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        className="absolute right-[16%] top-[36%] flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200/80 bg-white/85 shadow-md"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <Radio className="h-5 w-5 text-stone-600" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        className="absolute bottom-[30%] left-[20%] flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200/80 bg-white/85 shadow-md"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
      >
        <ShieldCheck className="h-6 w-6 text-[#9c8878]" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        className="absolute bottom-[24%] right-[12%] flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50/90 shadow-sm"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Activity className="h-5 w-5 text-emerald-700" strokeWidth={1.25} />
      </motion.div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <path
          d="M 120 180 Q 280 120 420 220"
          fill="none"
          stroke="url(#auth-line-light)"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        <path
          d="M 420 220 Q 520 320 380 420"
          fill="none"
          stroke="url(#auth-line-light)"
          strokeWidth="1"
          strokeOpacity="0.22"
        />
        <defs>
          <linearGradient id="auth-line-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(200 140 120)" stopOpacity="0" />
            <stop offset="50%" stopColor="rgb(200 140 120)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(190 130 110)" stopOpacity="0" />
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
    'h-11 border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 shadow-sm focus-visible:border-[#c97562]/60 focus-visible:ring-[#c97562]/20';

  return (
    <div className="min-h-screen w-full bg-[#faf9f5] lg:flex" style={{ fontFamily: fontSans }}>
      {/* Editorial hero — warm paper, generous spacing */}
      <div className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#faf8f5] via-[#f7f4ee] to-[#efeae3] px-8 py-12 text-stone-800 lg:min-h-screen lg:w-[46%] lg:px-14 lg:py-16">
        <AuthHeroIllustrationLight />
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 inline-flex items-center rounded-full border border-[#e8d9cf] bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a6b5c]"
          >
            Argus
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04 }}
            className="text-[2rem] font-semibold leading-[1.18] tracking-tight text-stone-900 sm:text-[2.35rem] lg:text-[2.55rem]"
            style={{ fontFamily: fontDisplay }}
          >
            Observe every asset.
            <span className="mt-1 block text-[#b85c4a]">Trust every signal.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 max-w-md text-[15px] leading-[1.65] text-stone-600"
          >
            Multi-tenant infrastructure inventory, drift detection, and configuration governance — in one calm,
            operator-first workspace.
          </motion.p>
        </div>
        <ul className="relative z-10 mt-12 hidden gap-5 lg:mt-0 lg:flex lg:flex-col">
          {[
            'Unified CMDB across sites, racks, and devices',
            'Audit-ready trails and validation history',
            'Gemini-assisted insights where you need them',
          ].map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
              className="flex items-start gap-3 text-[14px] leading-snug text-stone-600"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4896d]" />
              {line}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Sign-in card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:bg-[#faf9f5] lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b85c4a]">Argus</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900" style={{ fontFamily: fontDisplay }}>
              {isForgotPassword ? 'Reset password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
          </div>

          <div className="rounded-2xl border border-stone-200/95 bg-white p-8 shadow-[0_24px_64px_-28px_rgba(41,37,36,0.14)] sm:p-10">
            <div className="mb-8 hidden lg:block">
              <h2
                className="text-[1.6rem] font-semibold tracking-tight text-stone-900"
                style={{ fontFamily: fontDisplay }}
              >
                {isForgotPassword ? 'Reset password' : isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
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
                  className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-stone-700">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="name"
                      placeholder="Ada Lovelace"
                      className={`pl-10 ${inputClass}`}
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
                  <Label htmlFor="email" className="text-stone-700">
                    Username
                  </Label>
                  <span className="text-[11px] text-stone-500">use your email address</span>
                </div>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className={`pl-10 ${inputClass}`}
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
                    <Label htmlFor="password" className="text-stone-700">
                      Password
                    </Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                        }}
                        className="text-xs font-medium text-[#b85c4a] hover:text-[#a34f3f]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={`pl-10 ${inputClass}`}
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
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#c97562] to-[#d4896d] text-[15px] font-semibold text-white shadow-[0_10px_32px_-12px_rgba(185,92,74,0.45)] hover:from-[#bf6b58] hover:to-[#cc8069]"
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
                    <span className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-[0.12em] text-stone-400">
                    <span className="bg-white px-3">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-stone-200 bg-white text-stone-800 shadow-sm hover:bg-stone-50"
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

          <div className="mt-8 px-1 text-center text-sm text-stone-600">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="font-medium text-[#b85c4a] hover:text-[#a34f3f]"
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
                  className="font-semibold text-[#b85c4a] hover:text-[#a34f3f]"
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
                  className="font-semibold text-[#b85c4a] hover:text-[#a34f3f]"
                >
                  Create an account
                </button>
              </>
            )}
          </div>
          <p className="mt-6 px-2 text-center text-[11px] leading-relaxed text-stone-500">
            By continuing you acknowledge our acceptable use policy for enterprise infrastructure data.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
