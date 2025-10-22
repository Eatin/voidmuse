export function extractErrorMessage(error: unknown): string {
    console.log('extract error ', JSON.stringify(error));
    
    // Handle nested HTTP API errors (error.error contains statusCode and responseBody)
    if (error && typeof error === 'object' && 'error' in error) {
      const nestedError = (error as any).error;
      if (nestedError && typeof nestedError === 'object' && 'statusCode' in nestedError && 'responseBody' in nestedError) {
        const statusCode = nestedError.statusCode;
        const responseBody = nestedError.responseBody;
        
        return `status code: ${statusCode}, full error message: ${responseBody}`;
      }
    }
    
    // Handle direct HTTP API errors (contains statusCode and responseBody)
    if (error && typeof error === 'object' && 'statusCode' in error && 'responseBody' in error) {
      const statusCode = (error as any).statusCode;
      const responseBody = (error as any).responseBody;
      
      return `status code: ${statusCode}, full error message: ${responseBody}`;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (error && typeof error === 'object' && 'error' in error) {
      const nestedError = (error as any).error;
      if (nestedError instanceof Error) {
        return nestedError.message;
      }
      if (typeof nestedError === 'string') {
        return nestedError;
      }
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as any).message;
      if (typeof message === 'string') {
        return message;
      }
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    try {
      return JSON.stringify(error);
    } catch {
      return 'unknown error';
    }
  }