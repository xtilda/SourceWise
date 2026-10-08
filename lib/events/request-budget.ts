import { AsyncLocalStorage } from 'node:async_hooks';
const sourceBudget = new AsyncLocalStorage<AbortSignal>();
export function withSourceBudget<T>(work: () => Promise<T>): Promise<T> {
 return sourceBudget.run(AbortSignal.timeout(40_000), work);
}
export function requestSignal(timeout: number): AbortSignal {
 const budget = sourceBudget.getStore();
 const request = AbortSignal.timeout(timeout);
 return budget ? AbortSignal.any([budget, request]) : request;
}
