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
 * Text-like files are read as text; images get an object-URL preview;
 * everything else is treated as a binary/document attachment.
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
            reader.readAsText(file);
          } else if (file.type.startsWith("image/")) {
            resolve({
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              previewUrl: URL.createObjectURL(file),
            });
          } else {
            // Binary files: spreadsheets (.xlsx), documents (.pdf, .docx), archives, etc.
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
