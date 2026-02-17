import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-2xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Lookin CRM</p>
        <h1 className="text-4xl font-semibold">Base monorepo listo para escalar un CRM multi-tenant</h1>
        <p className="text-slate-300">
          API en NestJS + Prisma y frontend Next.js App Router con Tailwind, shadcn/ui y animaciones.
        </p>
        <Link className="text-indigo-300 underline-offset-4 hover:underline" href="/login">
          Ir al login
        </Link>
      </div>
    </main>
  );
}
