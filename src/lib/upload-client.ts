/**
 * Browser-side upload to a Supabase signed upload URL.
 *
 * Files no longer travel through the Next.js server action (which capped them
 * at the body-size limit and buffered every byte in server memory). This mirrors
 * exactly what `storage-js` `uploadToSignedUrl` sends for a Blob body -- a
 * multipart PUT with `cacheControl` plus the file under the empty key -- but via
 * XHR so we get upload progress, which fetch cannot report.
 */
export function uploadFileToSignedUrl(input: {
  signedUrl: string;
  file: File;
  cacheControl?: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { signedUrl, file, cacheControl = "3600", onProgress, signal } = input;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload aborted", "AbortError"));
      return;
    }

    const body = new FormData();
    body.append("cacheControl", cacheControl);
    body.append("", file);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    // Content-Type is intentionally unset: the browser adds the multipart
    // boundary itself.
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }

      reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText}`));
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed. Check your connection and try again.")),
    );
    xhr.addEventListener("abort", () =>
      reject(new DOMException("Upload aborted", "AbortError")),
    );

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(body);
  });
}
