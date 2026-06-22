import Link from 'next/link';

export const metadata = {
  title: 'Automation — SaaS Platform',
  description: 'Streamline your workflow with Automation.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Automation
        </span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 rounded-full">
            SaaS Platform
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Automate everything,<br />effortlessly.
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            A modern platform to manage your team, streamline workflows, and scale your operations — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/login"
              className="px-8 py-3 text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/admin"
              className="px-8 py-3 text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-100 dark:border-zinc-800">
        © {new Date().getFullYear()} Automation. All rights reserved.
      </footer>
    </div>
  );
}
