import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Error 404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Signal lost</h1>
        <p className="mt-3 text-sm text-muted">This page doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90"
        >
          Back to dispatch
        </Link>
      </div>
    </div>
  );
}
