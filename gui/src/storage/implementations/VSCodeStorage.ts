import { IStorage } from "../StorageInterface";
import vscodeMgr from "../../api/vscodeMgr";

/**
 * VSCode platform storage implementation
 * 
 * Implements storage functionality in VSCode WebView
 */
export class VSCodeStorage implements IStorage {
  /**
   * Get data from VSCode extension persistent storage
   * @param key Key name
   * @returns Stored data
   */
  async get(key: string): Promise<any> {
    try {
      const data = { 'methodName': 'getPersistentState', 'arg': { 'key': key } };
      const param = JSON.stringify(data);
      
      return new Promise((resolve, reject) => {
        vscodeMgr.sendMessage(param,
          function onSuccess(response: any) {
            try {
              resolve(response ? JSON.parse(response) : null);
            } catch (e) {
              resolve(response);
            }
          },
          function onFailure(error_code: string, error_message: string) {
            console.error('VSCode storage read error:', error_code, error_message);
            reject(new Error('Failed to read storage data'));
          }
        );
      });
    } catch (error) {
      console.error('VSCode storage read error:', error);
      return null;
    }
  }
  
  /**
   * Save data to VSCode extension persistent storage
   * @param key Key name
   * @param value Data value
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      const data = { 'methodName': 'persistentState', 'arg': { [key]: stringValue } };
      const param = JSON.stringify(data);
      
      return new Promise((resolve, reject) => {
        vscodeMgr.sendMessage(param,
          function onSuccess() {
            resolve();
          },
          function onFailure(error_code: string, error_message: string) {
            console.error('VSCode storage write error:', error_code, error_message);
            reject(new Error('Failed to write storage data'));
          }
        );
      });
    } catch (error) {
      console.error('VSCode storage write error:', error);
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    return this.set(key, null);
  }
}