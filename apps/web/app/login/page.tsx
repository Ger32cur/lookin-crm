'use client';

import { motion } from 'framer-motion';
import { Building2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-950/40"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-slate-400">Sign in to your organization workspace</p>
          </div>
        </div>

        <form className="space-y-4">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm text-slate-300">
              <Mail className="h-4 w-4" /> Email
            </span>
            <input
              type="email"
              placeholder="agent@your-org.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm text-slate-300">
              <Lock className="h-4 w-4" /> Password
            </span>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <Button className="w-full" size="lg" type="button">
            Sign in (placeholder)
          </Button>
        </form>
      </motion.section>
    </main>
  );
}
