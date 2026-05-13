import { useMemo } from 'react';
import { TEMPLATE_PLACEHOLDERS } from '../types';

interface Props {
  subject?: string | null;
  body: string;
  sampleName?: string;
  sampleEmail?: string;
  samplePhone?: string;
}

/**
 * Render a best-effort preview of a template with placeholder substitution.
 * This is for the template editor only and mirrors the backend's
 * `_render_placeholders` helper. No network traffic — pure string replace.
 */
export function PlaceholderPreview({
  subject,
  body,
  sampleName = 'Asha Patel',
  sampleEmail = 'asha@example.com',
  samplePhone = '+91 90000 00000',
}: Props) {
  const context = useMemo(
    () => ({
      customer_name: sampleName,
      customer_email: sampleEmail,
      customer_phone: samplePhone,
    }),
    [sampleName, sampleEmail, samplePhone],
  );

  const renderedSubject = subject ? render(subject, context) : undefined;
  const renderedBody = render(body, context);

  return (
    <aside
      aria-label="Template preview"
      className="rounded-md border border-midnight-200 bg-midnight-50/40 p-3 text-sm text-midnight-900"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-midnight-600">Preview</p>
      {renderedSubject !== undefined ? (
        <p className="mt-2">
          <span className="font-semibold">Subject: </span>
          {renderedSubject || <em className="text-midnight-600">(empty)</em>}
        </p>
      ) : null}
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm">{renderedBody}</pre>
      <div className="mt-3 border-t border-midnight-200 pt-2 text-xs text-midnight-700">
        Placeholders: {TEMPLATE_PLACEHOLDERS.join(', ')}
      </div>
    </aside>
  );
}

function render(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => ctx[key] ?? `{{${key}}}`);
}
