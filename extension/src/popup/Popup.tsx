import React, { useState } from 'react';
import { Bug, Camera, AlertTriangle, Send, Loader2 } from 'lucide-react';
import './Popup.css';

const NEXTJS_API_URL = 'http://localhost:3000/api/bugs/create'; // Development URL
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000000'; // Replace with actual logic

const Popup: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const captureScreen = () => {
        chrome.tabs.captureVisibleTab(
            chrome.windows.WINDOW_ID_CURRENT,
            { format: 'png' },
            (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error("Capture error:", chrome.runtime.lastError.message);
                    setStatusMsg("Capture failed.");
                    return;
                }
                setScreenshotBase64(dataUrl);
                setStatusMsg('Screenshot captured!');
                setTimeout(() => setStatusMsg(''), 2000);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!summary) return;

        setIsLoading(true);
        setStatusMsg('Gathering environment data...');

        try {
            // 1. Get active tab
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab?.id) throw new Error("No active tab found");

            // 2. Request environment data from content script
            let envData = {};
            try {
                envData = await new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(activeTab.id!, { type: 'CAPTURE_ENVIRONMENT' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn("Could not contact content script. Is it loaded?", chrome.runtime.lastError);
                            resolve({ url: activeTab.url || 'unknown', note: "Content script unavailable" });
                        } else {
                            resolve(response || {});
                        }
                    });
                });
            } catch (e) {
                console.warn("Failed to get env data", e);
            }

            setStatusMsg('Analyzing with Gemini AI...');

            // 3. Send payload to Next.js Backend
            const payload = {
                projectId: DEMO_PROJECT_ID,
                summary,
                severity,
                environmentInfo: envData,
                screenshotBase64,
                // In reality, you'd pull logs from envData if available
                consoleLogs: (envData as any).consoleLogs || [],
                networkLogs: (envData as any).networkErrors || []
            };

            const response = await fetch(NEXTJS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit bug report');
            }

            setStatusMsg('Bug logged successfully! (Under 10s)');
            setSummary('');
            setScreenshotBase64(null);

            // Close popup after success
            setTimeout(() => window.close(), 2000);

        } catch (error: any) {
            console.error('Submission error:', error);
            setStatusMsg(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="popup-container">
            <header className="popup-header">
                <Bug className="icon" size={20} />
                <h1>Report Bug</h1>
            </header>

            <form onSubmit={handleSubmit} className="popup-form">
                <div className="form-group">
                    <label htmlFor="summary">What went wrong?</label>
                    <textarea
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="E.g. The login button doesn't work on mobile..."
                        required
                        autoFocus
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="severity">Severity</label>
                    <div className="severity-options">
                        {['low', 'medium', 'high', 'critical'].map((level) => (
                            <label key={level} className={`severity-label ${severity === level ? 'active' : ''} ${level} ${isLoading ? 'disabled' : ''}`}>
                                <input
                                    type="radio"
                                    name="severity"
                                    value={level}
                                    checked={severity === level}
                                    onChange={(e) => setSeverity(e.target.value)}
                                    className="sr-only"
                                    disabled={isLoading}
                                />
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>

                {screenshotBase64 && (
                    <div className="screenshot-preview" style={{ position: 'relative', marginTop: "8px" }}>
                        <img src={screenshotBase64} alt="Screenshot" style={{ width: '100%', borderRadius: '4px', border: '1px solid #30363d' }} />
                        <button
                            type="button"
                            onClick={() => setScreenshotBase64(null)}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', padding: 0 }}
                        >×</button>
                        <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px', textAlign: 'center' }}>Screenshot captured successfully</div>
                    </div>
                )}

                {statusMsg && (
                    <div style={{ fontSize: '12px', color: statusMsg.includes('Error') ? '#f85149' : '#58a6ff', textAlign: 'center', marginTop: '4px' }}>
                        {statusMsg}
                    </div>
                )}

                <div className="actions">
                    <button type="button" className="btn-secondary" onClick={captureScreen} disabled={isLoading || !!screenshotBase64}>
                        <Camera size={16} /> {screenshotBase64 ? 'Captured' : 'Capture'}
                    </button>
                    <button type="submit" className="btn-primary" disabled={isLoading || !summary}>
                        {isLoading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                        {isLoading ? 'Processing...' : 'Send with AI'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Popup;
