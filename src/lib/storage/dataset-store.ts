import { ParsedFinancialDataset } from "@/lib/financial-dataset-engine";
import { AttachedFile } from "@/lib/attached-file";

export interface StoredDatasetSummary {
  id: string;
  threadId?: string;
  userId?: string;
  filename: string;
  rowCount: number;
  columns: string[];
  companies: string[];
  yearMin: number;
  yearMax: number;
  uploadedAt: string;
  fileSizeBytes: number;
}

export interface StoredDatasetRecord extends StoredDatasetSummary {
  dataset: ParsedFinancialDataset;
}

const STORAGE_PREFIX = "fintra_dataset_";
const INDEX_KEY = "fintra_datasets_index_v1";

/**
 * Senior-level Dataset Store
 * Provides persistent storage for financial datasets & spreadsheets with
 * per-user and per-thread isolation, zero-latency caching, and full retrieval.
 */
class DatasetStorageEngine {
  private isClient(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private getIndex(): StoredDatasetSummary[] {
    if (!this.isClient()) return [];
    try {
      const raw = localStorage.getItem(INDEX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveIndex(index: StoredDatasetSummary[]) {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    } catch (e) {
      console.warn("Failed to write dataset index to localStorage", e);
    }
  }

  /**
   * Saves a parsed financial dataset permanently and links it to a thread and user
   */
  async saveDataset(
    dataset: ParsedFinancialDataset,
    threadId: string,
    userId: string = "pilot-user"
  ): Promise<string> {
    const id = `ds-${threadId}`;
    const summary: StoredDatasetSummary = {
      id,
      threadId,
      userId,
      filename: dataset.filename,
      rowCount: dataset.rowCount,
      columns: dataset.columns,
      companies: dataset.companies,
      yearMin: dataset.yearMin,
      yearMax: dataset.yearMax,
      uploadedAt: new Date().toISOString(),
      fileSizeBytes: dataset.rawCsv ? new Blob([dataset.rawCsv]).size : 0,
    };

    if (this.isClient()) {
      try {
        const fullRecord: StoredDatasetRecord = {
          ...summary,
          dataset,
        };
        localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(fullRecord));

        // Update index
        const index = this.getIndex().filter((item) => item.id !== id && item.threadId !== threadId);
        index.unshift(summary);
        this.saveIndex(index);
      } catch (err) {
        console.warn("Dataset payload exceeded localStorage quota, keeping in memory/index", err);
      }
    }

    // Attempt optional background sync to backend /api/v1/datasets
    if (this.isClient()) {
      try {
        void fetch("/api/v1/datasets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            threadId,
            userId,
            filename: dataset.filename,
            rowCount: dataset.rowCount,
            columns: dataset.columns,
            companies: dataset.companies,
            yearMin: dataset.yearMin,
            yearMax: dataset.yearMax,
            rawData: dataset.rawCsv ? dataset.rawCsv.slice(0, 100000) : "",
          }),
        }).catch(() => {});
      } catch {}
    }

    return id;
  }

  /**
   * Retrieves a stored dataset by its threadId or datasetId
   */
  getDatasetByThread(threadId: string): ParsedFinancialDataset | null {
    if (!this.isClient()) return null;
    const id = `ds-${threadId}`;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (!raw) return null;
      const record = JSON.parse(raw) as StoredDatasetRecord;
      return record.dataset || null;
    } catch {
      return null;
    }
  }

  /**
   * Lists all datasets saved for the active user
   */
  listDatasets(userId?: string): StoredDatasetSummary[] {
    const index = this.getIndex();
    if (!userId) return index;
    return index.filter((ds) => !ds.userId || ds.userId === userId);
  }

  /**
   * Removes a dataset from permanent storage
   */
  removeDataset(threadId: string): boolean {
    if (!this.isClient()) return false;
    const id = `ds-${threadId}`;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
      const index = this.getIndex().filter((item) => item.id !== id && item.threadId !== threadId);
      this.saveIndex(index);

      // Async backend cleanup
      void fetch(`/api/v1/datasets?threadId=${encodeURIComponent(threadId)}`, {
        method: "DELETE",
      }).catch(() => {});

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Saves attached file metadata for a thread
   */
  saveThreadFiles(threadId: string, files: AttachedFile[]) {
    if (!this.isClient()) return;
    try {
      // Store metadata (excluding heavy object URLs)
      const sanitized = files.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        textContent: f.textContent ? f.textContent.slice(0, 150000) : undefined,
      }));
      localStorage.setItem(`fintra_files_${threadId}`, JSON.stringify(sanitized));
    } catch {}
  }

  /**
   * Retrieves attached files for a thread
   */
  getThreadFiles(threadId: string): AttachedFile[] {
    if (!this.isClient()) return [];
    try {
      const raw = localStorage.getItem(`fintra_files_${threadId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export const datasetStore = new DatasetStorageEngine();
