export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  textContent?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TEXT_LIKE_EXTENSIONS = [
  "txt", "csv", "tsv", "json", "md", "sql", "xml", "log", "yml", "yaml", "html", "js", "ts",
];

/**
 * Converts a FileList/File array into AttachedFile records.
 * Text-like files are read as text; everything else is attached as
 * metadata-only (name/size/type). No object URLs are created — previewUrl
 * was never rendered anywhere, and the URLs leaked because page-level
 * removal paths never revoked them.
 */
export function processFilesAsync(fileList: FileList | File[]): Promise<AttachedFile[]> {
  const files = Array.from(fileList);

  return Promise.all(
    files.map(
      (file) =>
        new Promise<AttachedFile>((resolve) => {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const ext = file.name.split(".").pop()?.toLowerCase() || "";
          const isTextLike =
            TEXT_LIKE_EXTENSIONS.includes(ext) || file.type.startsWith("text/");

          if (isTextLike) {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id,
                name: file.name,
                size: file.size,
                type: file.type || ext,
                textContent: typeof reader.result === "string" ? reader.result : undefined,
              });
            };
            reader.onerror = () => {
              resolve({
                id,
                name: file.name,
                size: file.size,
                type: file.type || ext,
              });
            };
            // An aborted read must also settle the promise — otherwise the
            // enclosing Promise.all (and the caller's await) hangs forever.
            reader.onabort = () => {
              resolve({
                id,
                name: file.name,
                size: file.size,
                type: file.type || ext,
              });
            };
            reader.readAsText(file);
          } else {
            // Binary files: images, spreadsheets (.xlsx), documents (.pdf, .docx),
            // archives, etc. — attached as metadata only.
            resolve({
              id,
              name: file.name,
              size: file.size,
              type: file.type || ext,
            });
          }
        })
    )
  );
}
