import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  userId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContextData>();

export class TenantContext {
  static get(): TenantContextData | undefined {
    return tenantStorage.getStore();
  }

  static getTenantId(): string {
    const store = tenantStorage.getStore();
    if (!store) throw new Error('TenantContext not initialized');
    return store.tenantId;
  }

  static run<T>(data: TenantContextData, fn: () => T): T {
    return tenantStorage.run(data, fn);
  }
}
