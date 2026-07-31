import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/Button';
import { makeObjectUrl } from '@/api/upload';
import { errorMessage } from '@/lib/apiErrors';
import { useToast } from '@/components/Toast';

interface Props {
  /** Existing server-side path; rendered as the current preview when no local file. */
  currentPath: string | null | undefined;
  /** Called with the selected File once the user confirms upload. */
  onUpload: (file: File) => Promise<void>;
  /** Optional label override. */
  label?: string;
  accept?: string;
  maxBytes?: number;
}

/**
 * Drag-or-pick image uploader with a local preview (blob URL) that revokes on
 * unmount. File size is validated client-side; server also enforces a cap.
 */
export function PhotoUploader({
  currentPath,
  onUpload,
  label = 'Customer photo',
  accept = 'image/*',
  maxBytes = 5 * 1024 * 1024,
}: Props) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!pending) {
      setLocalUrl(null);
      return;
    }
    const obj = makeObjectUrl(pending);
    setLocalUrl(obj.url);
    return () => obj.revoke();
  }, [pending]);

  function onSelect(file: File | null) {
    setError(null);
    if (!file) {
      setPending(null);
      return;
    }
    if (file.size > maxBytes) {
      setError(`File is too large. Max ${(maxBytes / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }
    setPending(file);
  }

  async function onSave() {
    if (!pending) return;
    setIsSaving(true);
    try {
      await onUpload(pending);
      toast.push({ tone: 'success', message: `${label} updated.` });
      setPending(null);
    } catch (err) {
      toast.push({ tone: 'error', message: errorMessage(err, `Failed to upload ${label.toLowerCase()}.`) });
    } finally {
      setIsSaving(false);
    }
  }

  const previewSrc = localUrl ?? (currentPath ? resolveUploadUrl(currentPath) : null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            'h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-midnight-200 bg-midnight-50/60',
            'flex items-center justify-center',
          )}
        >
          {previewSrc ? (
            <img src={previewSrc} alt="Customer preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-midnight-500">No photo</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-medium text-midnight-900">{label}</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="text-sm"
            onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
          />
          {error ? <p className="text-xs text-rose-700">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={!pending || isSaving} onClick={onSave}>
              {isSaving ? 'Uploading…' : 'Upload'}
            </Button>
            {pending ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPending(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Resolve a backend-relative upload path to a URL the browser can fetch.
 * The Vite proxy forwards `/uploads/*` to the backend during dev; in prod
 * the nginx service serves both frontend and uploads from the same origin.
 */
function resolveUploadUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
}
