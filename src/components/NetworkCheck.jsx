import { useState, useEffect } from 'react';
import { getNetworkInfo, isOnAllowedNetwork } from '../utils/networkVerification';
import {
    ALLOWED_NETWORKS,
    ALLOWED_PUBLIC_IPS,
    ENABLE_IP_RESTRICTION,
    ENABLE_PUBLIC_IP_FALLBACK,
    SHOW_IP_INFO,
    ALLOW_LOCALHOST,
} from '../config/allowedNetworks';

export default function NetworkCheck({ children, onNetworkCheckComplete }) {
    const [networkStatus, setNetworkStatus] = useState('checking');
    const [userIP, setUserIP] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkNetwork();
    }, []);

    async function checkNetwork() {
        console.log('[NetworkCheck] ENABLE_IP_RESTRICTION:', ENABLE_IP_RESTRICTION);

        if (!ENABLE_IP_RESTRICTION) {
            console.log('[NetworkCheck] IP restriction disabled - allowing access');
            setNetworkStatus('allowed');
            onNetworkCheckComplete?.(true);
            return;
        }

        // Allow localhost for development
        if (ALLOW_LOCALHOST && window.location.hostname === 'localhost') {
            console.log('[NetworkCheck] Localhost detected - allowing');
            setNetworkStatus('allowed');
            onNetworkCheckComplete?.(true);
            return;
        }

        console.log('[NetworkCheck] Starting network check...');

        try {
            // Add a component-level timeout of 5 seconds
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Network check timeout')), 5000)
            );

            const networkInfo = await Promise.race([
                getNetworkInfo(),
                timeoutPromise
            ]);

            console.log('[NetworkCheck] Network info:', networkInfo);
            setUserIP(networkInfo.ip || networkInfo.publicIP);

            // If both local and public IP detection fail, show a helpful state.
            if (!networkInfo.ip && !networkInfo.publicIP) {
                console.warn('[NetworkCheck] Both local and public IP detection returned null');
                setNetworkStatus('detection-failed');
                return;
            }

            const isAllowed = await isOnAllowedNetwork({
                allowedLocalIPs: ALLOWED_NETWORKS,
                allowedPublicIPs: ALLOWED_PUBLIC_IPS,
                enablePublicIPFallback: ENABLE_PUBLIC_IP_FALLBACK,
            });
            console.log('[NetworkCheck] Is allowed:', isAllowed);
            
            if (isAllowed) {
                setNetworkStatus('allowed');
                onNetworkCheckComplete?.(true);
            } else {
                setNetworkStatus('denied');
                setError(`Access denied. You are not on the authorized network. Detected IP: ${networkInfo.ip || networkInfo.publicIP || 'Unknown'}`);
                onNetworkCheckComplete?.(false);
            }
        } catch (err) {
            console.error('[NetworkCheck] Error:', err);
            setNetworkStatus('error');
            setError(err.message || 'Could not verify network. Please check your connection.');
            onNetworkCheckComplete?.(false);
        }
    }

    if (networkStatus === 'checking') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{
                    fontSize: '18px',
                    color: '#666'
                }}>Verifying network connection...</div>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (networkStatus === 'detection-failed') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    maxWidth: '500px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '20px',
                        color: '#f39c12'
                    }}>⚠️</div>
                    <h1 style={{
                        color: '#333',
                        marginBottom: '20px',
                        fontSize: '24px'
                    }}>
                        Network Detection Issue
                    </h1>
                    <p style={{
                        color: '#666',
                        marginBottom: '20px',
                        fontSize: '16px',
                        lineHeight: '1.6'
                    }}>
                        Could not detect your network IP. This may happen due to browser privacy restrictions or network configuration.
                    </p>
                    {SHOW_IP_INFO && (
                        <div style={{
                            backgroundColor: '#f0f0f0',
                            padding: '15px',
                            borderRadius: '4px',
                            marginTop: '20px',
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            <p><strong>Status:</strong> Detection failed</p>
                            <p><strong>Allowed Networks:</strong> {ALLOWED_NETWORKS.join(', ')}</p>
                            <p><strong>Allowed Public IPs:</strong> {ALLOWED_PUBLIC_IPS.join(', ')}</p>
                            <p style={{ marginTop: '10px', fontSize: '12px' }}>Try connecting to your WiFi again or use a different browser.</p>
                        </div>
                    )}
                    <div style={{
                        marginTop: '30px',
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 30px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (networkStatus === 'denied' || networkStatus === 'error') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    maxWidth: '500px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '20px',
                        color: '#e74c3c'
                    }}>🔒</div>
                    <h1 style={{
                        color: '#333',
                        marginBottom: '20px',
                        fontSize: '24px'
                    }}>
                        {networkStatus === 'denied' ? 'Unauthorized Network' : 'Network Verification Failed'}
                    </h1>
                    <p style={{
                        color: '#666',
                        marginBottom: '20px',
                        fontSize: '16px',
                        lineHeight: '1.6'
                    }}>
                        {error}
                    </p>
                    {SHOW_IP_INFO && (
                        <div style={{
                            backgroundColor: '#f0f0f0',
                            padding: '15px',
                            borderRadius: '4px',
                            marginTop: '20px',
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            <p><strong>Your IP:</strong> {userIP || 'Unable to detect'}</p>
                            <p><strong>Allowed Networks:</strong> {ALLOWED_NETWORKS.join(', ')}</p>
                            <p><strong>Allowed Public IPs:</strong> {ALLOWED_PUBLIC_IPS.join(', ')}</p>
                        </div>
                    )}
                    <div style={{
                        marginTop: '30px'
                    }}>
                        <p style={{
                            color: '#999',
                            fontSize: '14px'
                        }}>
                            Please connect to the authorized office network and refresh the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                marginTop: '15px',
                                padding: '10px 30px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
