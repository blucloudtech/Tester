// content/index.ts
console.log('AI Bug Reporter Content Script Initialized');

interface CapturedData {
    url: string;
    resolution: string;
    userAgent: string;
    consoleLogs: any[];
    networkErrors: any[];
}

const consoleLogs: any[] = [];
const networkErrors: any[] = [];

// 1. Capture Console Errors
const originalConsoleError = console.error;
console.error = (...args) => {
    consoleLogs.push({ type: 'error', message: args.join(' '), time: Date.now() });
    originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
    consoleLogs.push({ type: 'warn', message: args.join(' '), time: Date.now() });
    originalConsoleWarn.apply(console, args);
};

// 2. Capture Network Errors (simplified fetch wrapper for demo purposes)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    try {
        const response = await originalFetch(...args);
        if (!response.ok) {
            networkErrors.push({
                url: args[0]?.toString() || 'unknown',
                status: response.status,
                time: Date.now()
            });
        }
        return response;
    } catch (error: any) {
        networkErrors.push({
            url: args[0]?.toString() || 'unknown',
            error: error.message,
            time: Date.now()
        });
        throw error;
    }
};


// Listen for requests from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CAPTURE_ENVIRONMENT') {
        const environmentData: CapturedData = {
            url: window.location.href,
            resolution: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent,
            consoleLogs: [...consoleLogs], // Send what we have so far
            networkErrors: [...networkErrors]
        };
        sendResponse(environmentData);
    }
    return true; // Keep channel open for async response
});
