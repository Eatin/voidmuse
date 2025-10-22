import { IStorage } from "./StorageInterface";
import { WebStorage } from "./implementations/WebStorage";
import { VSCodeStorage } from "./implementations/VSCodeStorage";
import { IntelliJStorage } from "./implementations/IntelliJStorage";
import { getPlatform } from "../utils/PlatformUtils";

/**
 * Storage Factory Class - Creates appropriate storage implementation based on current platform
 */
export class StorageFactory {
  private static instance: IStorage | null = null;
  
  /**
   * Get storage instance (singleton pattern)
   * @returns Storage implementation suitable for current platform
   */
  public static getInstance(): IStorage {
    if (!this.instance) {
      // Create corresponding storage implementation based on platform
      const platform = getPlatform();
      switch (platform) {
        case 'vscode':
          this.instance = new VSCodeStorage();
          break;
        case 'idea':
          this.instance = new IntelliJStorage();
          break;
        case 'web':
        default:
          this.instance = new WebStorage();
          break;
      }
    }
    
    return this.instance;
  }
}