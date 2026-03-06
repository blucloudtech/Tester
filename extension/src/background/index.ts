// background/index.ts
console.log('AI Bug Reporter Background Service Worker Loaded');

// Setup command listener for shortcut keys (Ctrl+Shift+B)
chrome.commands.onCommand.addListener((command) => {
    if (command === '_execute_action') {
        // Note: Chrome MV3 doesn't easily let us artificially "open" the popup from a background script 
        // seamlessly without hacks. The manifest handles the hotkey opening the popup automatically.
        console.log('Action shortcut triggered via manifest.');
    }
});
