import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CachedResponse {
  statusCode: number;
  data: any;
  timestamp: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours sliding window
const MAX_CACHE_ENTRIES = 10000;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly cache = new Map<string, CachedResponse>();

  constructor() {
    // Periodic garbage collection every hour to prevent memory leaks
    const cleanupTimer = setInterval(() => this.cleanExpiredEntries(), 60 * 60 * 1000);
    if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
      cleanupTimer.unref();
    }
  }

  private cleanExpiredEntries() {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        this.cache.delete(key);
        purged++;
      }
    }
    if (purged > 0) {
      this.logger.log(`Purged ${purged} expired idempotency keys from memory cache.`);
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method = req.method?.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const idempotencyKey =
      (req.headers['idempotency-key'] as string) ||
      (req.headers['x-client-mutation-id'] as string) ||
      (req.body && req.body.clientMutationId);

    if (!idempotencyKey) {
      return next.handle();
    }

    const userId = req.user?.id || req.user?._id || 'anonymous';
    const cacheKey = `${userId}:${method}:${req.url}:${idempotencyKey}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      this.logger.log(
        `[Duplicate Submission Prevented] Idempotency key match: '${idempotencyKey}' on ${method} ${req.url}. Returning cached response.`,
      );
      res.status(cached.statusCode);
      res.setHeader('X-Cache-Hit', 'Idempotency-Duplicate-Prevented');
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((data) => {
        const statusCode = res.statusCode || 200;
        
        // Evict oldest entry if max cache size exceeded
        if (this.cache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = this.cache.keys().next().value;
          if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(cacheKey, {
          statusCode,
          data,
          timestamp: Date.now(),
        });
        
        this.logger.debug(
          `[Idempotency Registered] Cached response for key '${idempotencyKey}' on ${method} ${req.url}`,
        );
      }),
    );
  }
}
