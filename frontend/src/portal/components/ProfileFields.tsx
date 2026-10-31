import type { ReactNode } from 'react';
import type { PortalProfileFields } from '../types';

export type ProfileFormValues = Required<{ [K in keyof PortalProfileFields]: string }>;

export const EMPTY_PROFILE: ProfileFormValues = {
  email: '',
  gender: '',
  date_of_birth: '',
  birth_time: '',
  birth_place: '',
  occupation: '',
  marital_status: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  rashi: '',
  nakshatra: '',
  gotra: '',
};

const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

export const portalFieldClass =
  'mt-1.5 block h-11 w-full rounded-xl border border-amber-200 bg-white/90 px-3.5 text-[15px] font-normal text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-300 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-200/60';

/** Converts form strings to an API payload; blanks become null so they can be cleared. */
export function profilePayload(values: ProfileFormValues): PortalProfileFields {
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(values)) out[k] = v.trim() ? v.trim() : null;
  return out as PortalProfileFields;
}

export function profileToForm(p: PortalProfileFields): ProfileFormValues {
  const out = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof ProfileFormValues)[]) {
    const value = p[key];
    out[key] = value == null ? '' : key === 'birth_time' ? String(value).slice(0, 5) : String(value);
  }
  return out;
}

export function ProfileFields({
  values,
  onChange,
}: {
  values: ProfileFormValues;
  onChange: (key: keyof ProfileFormValues, value: string) => void;
}) {
  const text = (key: keyof ProfileFormValues, label: string, props: Record<string, unknown> = {}) => (
    <Field label={label}>
      <input
        name={key}
        value={values[key]}
        onChange={(e) => onChange(key, e.target.value)}
        className={portalFieldClass}
        {...props}
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-6">
      <Group title="About you" hint="Helps Guruji prepare for your visit">
        {text('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
        <Field label="Gender">
          <select
            name="gender"
            value={values.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className={portalFieldClass}
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </Field>
        {text('occupation', 'Occupation', { autoComplete: 'organization-title' })}
        <Field label="Marital status">
          <select
            name="marital_status"
            value={values.marital_status}
            onChange={(e) => onChange('marital_status', e.target.value)}
            className={portalFieldClass}
          >
            <option value="">Prefer not to say</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </Field>
      </Group>

      <Group title="Birth details" hint="Used for kundali and horoscope reading">
        {text('date_of_birth', 'Date of birth', { type: 'date' })}
        {text('birth_time', 'Birth time', { type: 'time' })}
        {text('birth_place', 'Birth place', { placeholder: 'City / village' })}
        {text('rashi', 'Rashi', { list: 'portal-rashi-options', placeholder: 'If known' })}
        {text('nakshatra', 'Nakshatra', { list: 'portal-nakshatra-options', placeholder: 'If known' })}
        {text('gotra', 'Gotra', { placeholder: 'If known' })}
        <datalist id="portal-rashi-options">
          {RASHIS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <datalist id="portal-nakshatra-options">
          {NAKSHATRAS.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Group>

      <Group title="Address">
        <div className="sm:col-span-2">
          {text('address', 'Street address', { autoComplete: 'street-address' })}
        </div>
        {text('city', 'City', { autoComplete: 'address-level2' })}
        {text('state', 'State', { autoComplete: 'address-level1' })}
        {text('pincode', 'PIN code', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 12 })}
      </Group>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 sm:p-5">
      <legend className="px-1 text-sm font-bold text-amber-950">
        {title}{' '}
        <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
          Optional
        </span>
      </legend>
      {hint ? <p className="mb-3 text-xs text-amber-900/70">{hint}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-amber-900">
      {label}
      {children}
    </label>
  );
}
