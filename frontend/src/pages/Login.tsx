import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
  };

  return (
    <div className="bg-signal-grid relative flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-ink">
      <ThemeToggle className="absolute right-4 top-4" />

      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-ink">
            <SignalIcon />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-none tracking-tight">HelpDesk Lite</p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-faint">Support console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl2 border border-border bg-panel p-6 shadow-glow sm:p-8">
          <h1 className="font-display text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to reach the queue.</p>

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-border bg-panel-soft px-3 py-2 text-sm outline-none placeholder:text-faint focus:ring-1 focus:ring-accent"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-panel-soft px-3 py-2 text-sm outline-none placeholder:text-faint focus:ring-1 focus:ring-accent"
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-4 rounded-md border border-red/30 bg-red/10 px-3 py-2 text-xs font-medium text-red">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-xs text-muted">
            No account yet?{" "}
            <Link to="/signup" className="font-semibold text-accent hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <p className="mt-5 text-center text-[11px] text-faint">
          Backed by the HelpDesk Lite API — accounts and tickets are stored on the server.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      {children}
    </label>
  );
}

function SignalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16 L9 8 L13 14 L20 5" />
      <circle cx="20" cy="5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
