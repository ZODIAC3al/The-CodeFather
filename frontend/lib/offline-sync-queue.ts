import { api } from './api';

export interface QueuedOperation {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
  attemptCount: number;
  timestamp: number;
  idempotencyKey: string;
  clientMutationId: string;
  version?: string | number;
  status: 'pending' | 'processing' | 'failed' | 'conflict';
  lastError?: string;
  nextRetryAt?: number;
}

const STORAGE_KEY = 'learnlocal_offline_sync_queue';
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const JITTER_MS = 500;
const MAX_ATTEMPTS = 10;

/**
 * Calculates backoff delay with exponential scaling and random jitter.
 */
export function calculateBackoffDelay(attempt: number): number {
  const exponential = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));
  const jitter = Math.random() * JITTER_MS;
  return Math.floor(exponential + jitter);
}

/**
 * Determines whether an error is transient and eligible for retry.
 */
export function isTransientError(error: any): boolean {
  if (!error) return false;
  
  // Network failures or timeouts (no response)
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
    return true;
  }
  
  const status = error.response?.status;
  // HTTP 429 (Rate Limit), 502, 503 (Service Unavailable), 504 (Gateway Timeout)
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * Offline Sync Queue Manager
 * Ensures pending offline mutations survive refreshes, crashes, and network loss.
 */
class OfflineSyncQueueManager {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    if (this.isInitialized) return;
    this.loadFromStorage();
    this.isInitialized = true;
    
    console.log(`[OfflineSyncQueue] Queue initialized with ${this.queue.length} pending operations.`);
    
    if (navigator.onLine && this.queue.length > 0) {
      this.processQueue();
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
        console.log(`[OfflineSyncQueue] Queue recovered from storage. ${this.queue.length} items restored.`);
      }
    } catch (e) {
      console.error('[OfflineSyncQueue] Failed to load offline queue from localStorage:', e);
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('[OfflineSyncQueue] Failed to persist offline queue to localStorage:', e);
    }
  }

  /**
   * Generates a unique UUIDv4 string for idempotency keys.
   */
  public generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Enqueues an operation safely avoiding duplicate submissions.
   */
  public enqueue(op: Omit<QueuedOperation, 'id' | 'attemptCount' | 'timestamp' | 'status'>): string {
    const existing = this.queue.find(
      (item) => item.idempotencyKey === op.idempotencyKey || item.clientMutationId === op.clientMutationId
    );

    if (existing) {
      console.log(`[OfflineSyncQueue] Duplicate prevention: Operation with key ${op.idempotencyKey} is already enqueued.`);
      return existing.id;
    }

    const id = 'op-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newOp: QueuedOperation = {
      ...op,
      id,
      attemptCount: 0,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.queue.push(newOp);
    this.saveToStorage();
    console.log(`[OfflineSyncQueue] Operation enqueued: ${newOp.id} (${newOp.method} ${newOp.url}) with idempotency key ${newOp.idempotencyKey}`);

    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process pending queued operations in order.
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineSyncQueue] Connection offline. Queue processing deferred.');
      return;
    }

    this.isProcessing = true;
    console.log(`[OfflineSyncQueue] Starting queue processing for ${this.queue.length} items...`);

    const now = Date.now();
    const pendingItems = this.queue.filter(
      (item) => item.status === 'pending' && (!item.nextRetryAt || item.nextRetryAt <= now)
    );

    for (const item of pendingItems) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log('[OfflineSyncQueue] Network disconnected mid-sync. Pausing processing.');
        break;
      }

      item.status = 'processing';
      this.saveToStorage();

      try {
        console.log(`[OfflineSyncQueue] Executing ${item.method} ${item.url} (Attempt #${item.attemptCount + 1})...`);
        
        const headers: Record<string, string> = {
          ...(item.headers || {}),
          'Idempotency-Key': item.idempotencyKey,
          'x-client-mutation-id': item.clientMutationId,
        };

        if (item.version) {
          headers['If-Match'] = String(item.version);
        }

        await api.request({
          url: item.url,
          method: item.method,
          headers,
          data: item.data,
        });

        console.log(`[OfflineSyncQueue] Operation successfully synchronized: ${item.id} (${item.url})`);
        this.queue = this.queue.filter((op) => op.id !== item.id);
        this.saveToStorage();
      } catch (error: any) {
        const status = error.response?.status;

        if (status === 409) {
          console.warn(`[OfflineSyncQueue] Conflict detected for ${item.id} (${item.url}). Marking as conflict.`);
          item.status = 'conflict';
          item.lastError = 'HTTP 409 Conflict';
          this.saveToStorage();
          continue;
        }

        if (isTransientError(error)) {
          item.attemptCount += 1;
          if (item.attemptCount >= MAX_ATTEMPTS) {
            console.error(`[OfflineSyncQueue] Max attempts (${MAX_ATTEMPTS}) reached for ${item.id}. Marking as failed.`);
            item.status = 'failed';
            item.lastError = error.message || 'Max retries exceeded';
          } else {
            const delay = calculateBackoffDelay(item.attemptCount);
            item.nextRetryAt = Date.now() + delay;
            item.status = 'pending';
            item.lastError = error.message || 'Transient error';
            console.warn(
              `[OfflineSyncQueue] Transient failure for ${item.id} (Attempt #${item.attemptCount}). Retrying in ${delay}ms...`
            );
          }
        } else {
          console.error(
            `[OfflineSyncQueue] Permanent error (HTTP ${status || 'Unknown'}) for ${item.id}. Aborting retries.`,
            error
          );
          item.status = 'failed';
          item.lastError = error.response?.data?.message || error.message || 'Permanent failure';
        }
        this.saveToStorage();
      }
    }

    this.isProcessing = false;
    console.log(`[OfflineSyncQueue] Queue processing step completed. Remaining: ${this.queue.length}`);
  }

  public getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  public clearFailed(): void {
    this.queue = this.queue.filter((op) => op.status !== 'failed');
    this.saveToStorage();
  }
}

export const offlineSyncQueue = new OfflineSyncQueueManager();
