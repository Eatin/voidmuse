import { IStorage } from "../StorageInterface";

/**
 * Web storage implementation - using IndexedDB
 */
export class WebStorage implements IStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ai-chat-storage';
  private readonly STORE_NAME = 'key-value-store';
  private dbInitPromise: Promise<void>;
  
  constructor() {
    this.dbInitPromise = this.initDB();
  }
  
  /**
   * Initialize IndexedDB
   */
  private initDB(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!window.indexedDB) {
        console.error("Your browser does not support IndexedDB");
        reject("IndexedDB not supported");
        return;
      }
      
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onerror = (event) => {
        console.error("IndexedDB open failed:", event);
        reject("IndexedDB open failed");
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }
  
  /**
   * Get stored data
   * @param key Key name
   * @returns Stored data
   */
  async get(key: string): Promise<any> {
    await this.dbInitPromise;
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);
      
      request.onerror = (event) => {
        console.error("Failed to get data:", event);
        reject("Failed to get data");
      };
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Parse stored JSON string
          try {
            resolve(JSON.parse(result.value));
          } catch (e) {
            resolve(result.value);
          }
        } else {
          resolve(null);
        }
      };
    });
  }
  
  /**
   * Set stored data
   * @param key Key name
   * @param value Data value
   */
  async set(key: string, value: any): Promise<void> {
    await this.dbInitPromise;
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      
      // Convert value to JSON string for storage
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      const request = store.put({ key, value: jsonValue });
      
      request.onerror = (event) => {
        console.error("Failed to save data:", event);
        reject("Failed to save data");
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  }
  
  /**
   * Delete stored data
   * @param key Key name
   */
  async delete(key: string): Promise<void> {
    await this.dbInitPromise;
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);
      
      request.onerror = (event) => {
        console.error("Failed to delete data:", event);
        reject("Failed to delete data");
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  }
  
  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    await this.dbInitPromise;
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      
      request.onerror = (event) => {
        console.error("Failed to clear data:", event);
        reject("Failed to clear data");
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  }
}