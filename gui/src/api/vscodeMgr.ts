/**
 * VSCode message manager
 * Responsible for managing communication with VSCode extension
 */

interface PendingRequest {
    onSuccess: (response: any) => void;
    onFailure: (error_code: string, error_message: string) => void;
}

// Message manager
const vscodeMgr = {
    // Store pending requests
    pendingRequests: new Map<string, PendingRequest>(),

    // Send message and register callback
    sendMessage: function (data: string, onSuccess: (response: any) => void, onFailure: (error_code: string, error_message: string) => void, requestId?: string): void {
        // Generate unique identifier if not provided
        const finalRequestId = requestId || Math.random().toString(36).substring(2, 15);

        // Store callback functions
        this.pendingRequests.set(finalRequestId, { onSuccess, onFailure });

        // Send message
        window.postMessage({
            "data": data,
            "requestId": finalRequestId // Attach identifier to message
        }, '*');

        // Set timeout
        setTimeout(() => {
            if (this.pendingRequests.has(finalRequestId)) {
                const { onFailure } = this.pendingRequests.get(finalRequestId)!;
                onFailure('TIMEOUT', 'Request timed out: 20 seconds');
                this.pendingRequests.delete(finalRequestId);
                console.info('vscode no response this requestId timeout:', finalRequestId);
            }
        }, 20000); 
    },

    // Initialize message listener
    init: function (): void {
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.requestId && this.pendingRequests.has(message.requestId)) {
                const { onSuccess, onFailure } = this.pendingRequests.get(message.requestId)!;
                if (message.command === 'success') {
                    onSuccess(message.response);
                } else if (message.command === 'failure') {
                    onFailure(message.error_code, message.error_message);
                } else{
                    return
                }
                this.pendingRequests.delete(message.requestId);
            } else if (message.command === "callJavaScript") {
                // Call global processing API
                if (typeof window.callJavaScript === 'function') {
                    window.callJavaScript(message.message);
                }
            }
        });
    }
};

// Initialize message manager
vscodeMgr.init();

// Export vscodeMgr
export default vscodeMgr;