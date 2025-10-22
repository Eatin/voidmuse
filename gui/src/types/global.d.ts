/**
 * Global type declarations
 */

// Type definition for IDEA JavaBridge API
interface JavaCallParams {
  request: string;
  onSuccess: (response: any) => void;
  onFailure: (error_code: string, error_message: string) => void;
}

// Extend Window interface
interface Window {
  
  /**
   * IDEA JavaBridge API 
   */
  callJava: (options: {
    request: string;
    onSuccess: (response: string) => void;
    onFailure: (error_code: number, error_message: string) => void;
  }) => void;

  /**
   * JavaScript callback API
   * Used to receive JavaScript call requests sent from extensions
   */
  callJavaScript?: (message: any) => void;
  callJavaCallback?: (message: any) => void;
}
