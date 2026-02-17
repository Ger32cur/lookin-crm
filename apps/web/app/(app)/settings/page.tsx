import { PageReveal } from '@/components/ui/page-reveal';

export default function SettingsPage() {
  return (
    <PageReveal className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Settings</p>
      <h1 className="mt-1 text-4xl text-[var(--brand-primary)]">Settings</h1>
      <p className="mt-3 text-sm text-slate-600">
        Placeholder for organization preferences, users and integrations.
      </p>
    </PageReveal>
  );
}
