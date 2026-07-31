import { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { errorMessage } from '@/lib/apiErrors';
import { useToast } from '@/components/Toast';

interface Props {
  currentFilePath: string | null | undefined;
  currentOriginalName: string | null | undefined;
  onUpload: (file: File) => Promise<void>;
  /** Max size in bytes (default 10 MB). */
  maxBytes?: number;
}

/**
 * Generic file uploader for the customer's kundali (typically PDF/image).
 * Keeps the existing file visible as a link, plus a "Replace" control.
 */
export function KundaliUploader({
  currentFilePath,
  currentOriginalName,
  onUpload,
  maxBytes = 10 * 1024 * 1024,
}: Props) {
  const [pending, setPending] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

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
      toast.push({ tone: 'success', message: 'Kundali uploaded.' });
      setPending(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      toast.push({ tone: 'error', message: errorMessage(err, 'Failed to upload kundali.') });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-midnight-900">Kundali file</p>
      {currentFilePath ? (
        <p className="text-sm">
          Current:{' '}
          <a
            href={currentFilePath.startsWith('/') ? currentFilePath : `/${currentFilePath}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {currentOriginalName ?? 'Open current file'}
          </a>
        </p>
      ) : (
        <p className="text-sm text-midnight-600">No kundali uploaded yet.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
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
  );
}
