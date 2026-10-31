import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { CalendarPlusIcon, CheckCircleIcon, ClockIcon, ShieldIcon } from '@/components/icons';

export const portalInputClass =
  'mt-1.5 block h-11 w-full rounded-xl border border-amber-200 bg-white/90 px-3.5 text-[15px] font-normal text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-300 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-200/60';

export const portalPrimaryButtonClass =
  'btn-glass flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60';

const FEATURES = [
  { icon: CalendarPlusIcon, title: 'Book from home', body: "See Guruji's free slots and reserve one in a few taps." },
  { icon: ClockIcon, title: '15 minutes to 1 hour', body: 'Choose how much time you need with Guruji.' },
  { icon: CheckCircleIcon, title: 'No waiting in line', body: 'Your slot is reserved — just arrive on time.' },
  { icon: ShieldIcon, title: 'Private & secure', body: 'Only Guruji and our staff can see your details.' },
];

export function PortalAuthCard({
  title,
  subtitle,
  wide,
  children,
}: {
  title: string;
  subtitle: string;
  /** Single wide card (no showcase panel) for longer forms such as sign-up. */
  wide?: boolean;
  children: ReactNode;
}) {
  if (wide) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="rounded-3xl border border-amber-200/80 bg-white/90 p-6 shadow-[0_30px_60px_-20px_rgba(146,64,14,0.30)] backdrop-blur-md sm:p-9">
          <BrandHeader title={title} subtitle={subtitle} logoClassName="h-28 sm:h-36" />
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl items-stretch gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-14">
      <section
        aria-hidden="true"
        className="relative hidden overflow-hidden rounded-3xl theme-static bg-gradient-to-br from-deep-900 via-violet-900 to-[#5b2a0a] p-10 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between"
      >
        <svg
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] animate-[mandala-spin_120s_linear_infinite] opacity-25"
        >
          <g fill="none" stroke="#E8C14A" strokeWidth="1">
            {[280, 240, 200, 160, 120, 80, 40].map((r) => (
              <circle key={r} cx="300" cy="300" r={r} />
            ))}
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((a) => (
              <line key={a} x1="300" y1="20" x2="300" y2="580" transform={`rotate(${a} 300 300)`} />
            ))}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <ellipse key={a} cx="300" cy="140" rx="26" ry="60" transform={`rotate(${a} 300 300)`} />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-500/30 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
            In-person visits
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-tight">
            Meet Guruji in person,
            <span className="block bg-gradient-to-r from-gold-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              book your time online
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base text-violet-100/80">
            Consultations happen in person at the Pratishthan. Reserve your appointment with Guruji here and skip the queue on the day.
          </p>
        </div>

        <ul className="relative mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title: t, body }) => (
            <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Icon className="h-6 w-6 text-gold-300" />
              <p className="mt-3 text-sm font-semibold">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-violet-100/70">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-amber-200/80 bg-white/90 p-7 shadow-[0_30px_60px_-20px_rgba(146,64,14,0.30)] backdrop-blur-md sm:p-9">
          <BrandHeader title={title} subtitle={subtitle} logoClassName="h-40 sm:h-48" />
          {children}
        </div>
      </section>
    </main>
  );
}

/** Same brand treatment as the staff login: large logo, name, then the page title. */
function BrandHeader({
  title,
  subtitle,
  logoClassName,
}: {
  title: string;
  subtitle: string;
  logoClassName: string;
}) {
  return (
    <div className="mb-7 flex flex-col items-center text-center">
      <BrandLogo size="lg" priority alt="व्यंकटेश प्रतिष्ठाण" className={`${logoClassName} w-auto drop-shadow-md`} />
      <p className="mt-3 px-2 text-2xl font-extrabold leading-[1.35] text-amber-900 sm:text-3xl">व्यंकटेश प्रतिष्ठाण</p>
      <h1 className="mt-3 text-xl font-bold tracking-tight text-amber-950">{title}</h1>
      <p className="mt-1 text-sm text-amber-900/70">{subtitle}</p>
    </div>
  );
}
