import { IStorage } from "../StorageInterface";

/**
 * IDEA platform storage implementation
 * 
 * Uses IDEA JBCF plugin provided API for data storage
 */
export class IntelliJStorage implements IStorage {
  /**
   * Get data from IDEA plugin persistent storage
   * @param key Key name
   * @returns Stored data
   */
  async get(key: string): Promise<any> {
    try {
      // Check if JavaBridge is available
      if (typeof window.callJava !== 'function') {
        console.error("IDEA JavaBridge is not available");
        return null;
      }
      
      const data = { 'methodName': 'getPersistentState', 'arg': { 'key': key } };
      const param = JSON.stringify(data);
      
      return new Promise((resolve, reject) => {
        window.callJava!({
          request: param,
          onSuccess: function (response: any) {
            try {
              resolve(response ? JSON.parse(response) : null);
            } catch (e) {
              resolve(response);
            }
          },
          onFailure: function (error_code: number, error_message: string) {
            console.error('IDEA storage read error:', error_code, error_message);
            reject(new Error('Failed to read storage data'));
          }
        });
      });
    } catch (error) {
      console.error('IDEA storage read error:', error);
      return null;
    }
  }
  
  /**
   * Save data to IDEA plugin persistent storage
   * @param key Key name
   * @param value Data value
   */
  async set(key: string, value: any): Promise<void> {
    try {
      // Check if JavaBridge is available
      if (typeof window.callJava !== 'function') {
        console.error("IDEA JavaBridge is not available");
        return;
      }
      
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      const data = { 'methodName': 'persistentState', 'arg': { [key]: stringValue } };
      const param = JSON.stringify(data);
      
      return new Promise((resolve, reject) => {
        window.callJava!({
          request: param,
          onSuccess: function () {
            resolve();
          },
          onFailure: function (error_code: number, error_message: string) {
            console.error('IDEA storage write error:', error_code, error_message);
            reject(new Error('Failed to write storage data'));
          }
        });
      });
    } catch (error) {
      console.error('IDEA storage write error:', error);
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    return this.set(key, null);
  }
}