import { IdempotencyInterceptor } from './idempotency.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;

  beforeEach(() => {
    interceptor = new IdempotencyInterceptor();
  });

  it('should pass through GET requests without idempotency caching', (done) => {
    const mockRequest = { method: 'GET', url: '/courses', headers: {} };
    const mockResponse = { status: jest.fn(), setHeader: jest.fn() };
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of([{ id: 1, title: 'Course 1' }]),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual([{ id: 1, title: 'Course 1' }]);
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      done();
    });
  });

  it('should cache non-GET response when idempotency key is provided', (done) => {
    const key = 'test-uuid-0001';
    const mockRequest = {
      method: 'POST',
      url: '/enrollments',
      headers: { 'idempotency-key': key },
      user: { id: 'user-123' },
    };
    const mockResponse = { statusCode: 201, status: jest.fn(), setHeader: jest.fn() };
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ success: true, enrollmentId: 'e-100' }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((firstResult) => {
      expect(firstResult).toEqual({ success: true, enrollmentId: 'e-100' });

      // Simulate second request with SAME idempotency key
      let handlerCalled = false;
      const secondCallHandler: CallHandler = {
        handle: () => {
          handlerCalled = true;
          return of({ success: true, enrollmentId: 'e-100' });
        },
      };

      interceptor.intercept(mockExecutionContext, secondCallHandler).subscribe((secondResult) => {
        expect(secondResult).toEqual({ success: true, enrollmentId: 'e-100' });
        expect(handlerCalled).toBe(false); // Handler was skipped due to deduplication
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'X-Cache-Hit',
          'Idempotency-Duplicate-Prevented',
        );
        done();
      });
    });
  });
});
