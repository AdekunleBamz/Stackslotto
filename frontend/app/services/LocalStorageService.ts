export class LocalStorageService {
  private prefix = 'stackslotto_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('localStorage set error:', error);
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('localStorage get error:', error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('localStorage remove error:', error);
    }
  }

  clear(): void {
    try {
      if (typeof window === 'undefined') return;
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('localStorage clear error:', error);
    }
  }
}

export const storageService = new LocalStorageService();
