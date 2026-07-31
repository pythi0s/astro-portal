import { apiClient } from '@/api/client';

/**
 * Typed multipart/form-data helper. All file uploads in the React app go
 * through this module so FormData assembly, content-type handling, and
 * progress reporting live in exactly one place.
 */
export interface UploadOptions {
  /** Name of the file part on the server. Matches FastAPI parameter names. */
  fieldName: string;
  file: File;
  /**
   * Optional progress callback (0..1). Only fires on XHR transports; fetch
   * does not expose upload progress. We forward axios' numeric progress.
   */
  onProgress?: (fraction: number) => void;
}

export async function uploadFile<T>(url: string, options: UploadOptions): Promise<T> {
  const form = new FormData();
  form.append(options.fieldName, options.file, options.file.name);

  const response = await apiClient.post<T>(url, form, {
    headers: {
      // Let axios set the boundary; explicitly clear the default JSON type.
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (evt) => {
      if (!options.onProgress || !evt.total) return;
      options.onProgress(evt.loaded / evt.total);
    },
  });
  return response.data;
}

/** Typed wrapper for an object URL + its cleanup. */
export interface ObjectUrl {
  url: string;
  revoke: () => void;
}

export function makeObjectUrl(file: File): ObjectUrl {
  const url = URL.createObjectURL(file);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}
