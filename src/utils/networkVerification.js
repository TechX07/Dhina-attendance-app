/**
 * Get all local IP addresses using WebRTC.
 * Browsers can expose multiple interfaces (WiFi, VPN, virtual adapters),
 * so we collect all IPs and evaluate them later.
 */
export async function getLocalIPs() {
    return new Promise((resolve) => {
        console.log('[Network] Starting IP detection...');
        
        let timeoutId;
        let pc;
        const ips = [];
        let resolved = false;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            try {
                if (pc) {
                    pc.onicecandidate = null;
                    pc.oniceconnectionstatechange = null;
                    pc.close();
                }
            } catch (e) {
                console.error('[Network] Error cleaning up:', e);
            }
        };

        const resolveIPs = () => {
            if (!resolved) {
                resolved = true;
                cleanup();
                console.log('[Network] Detected IP list:', ips);
                resolve(ips);
            }
        };

        try {
            pc = new RTCPeerConnection({ 
                iceServers: [],
                bundlePolicy: 'max-bundle'
            });

            console.log('[Network] RTCPeerConnection created');

            pc.createDataChannel('');
            
            pc.createOffer()
                .then(offer => {
                    console.log('[Network] Offer created');
                    return pc.setLocalDescription(offer);
                })
                .catch(err => {
                    console.error('[Network] Offer error:', err);
                    resolveIPs();
                });

            pc.onicecandidate = (ice) => {
                try {
                    if (!ice || !ice.candidate) {
                        console.log('[Network] ICE gathering complete');
                        resolveIPs();
                        return;
                    }

                    const candidate = ice.candidate.candidate;
                    if (!candidate || typeof candidate !== 'string') {
                        return;
                    }
                    
                    console.log('[Network] ICE candidate:', candidate.substring(0, 50) + '...');
                    
                    const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                    const match = ipRegex.exec(candidate);
                    
                    if (match && match[1]) {
                        const ipAddress = match[1];
                        console.log('[Network] Extracted IP:', ipAddress);
                        
                        // Filter out loopback and other non-useful IPs
                        const isPrivate = ipAddress.startsWith('192.168.') || 
                                         ipAddress.startsWith('10.') ||
                                         ipAddress.startsWith('172.');
                        
                        const isLocal = ipAddress.startsWith('127.') || 
                                       ipAddress.startsWith('169.254');

                        if (!isLocal && ips.indexOf(ipAddress) === -1) {
                            ips.push(ipAddress);
                            console.log('[Network] Added IP to list. Private:', isPrivate);
                        }
                    }
                } catch (err) {
                    console.error('[Network] Error in onicecandidate:', err);
                }
            };

            // Timeout - 3 seconds max
            timeoutId = setTimeout(() => {
                console.log('[Network] Timeout reached. Resolving with found IPs:', ips);
                resolveIPs();
            }, 3000);

        } catch (error) {
            console.error('[Network] Error in getLocalIP:', error);
            cleanup();
            resolve([]);
        }
    });
}

/**
 * Backward-compatible helper that returns one preferred local IP.
 */
export async function getLocalIP() {
    const ips = await getLocalIPs();
    if (!ips.length) return null;

    const preferred = ips.find(ip => ip.startsWith('192.168.'))
        || ips.find(ip => ip.startsWith('10.'))
        || ips.find(ip => ip.startsWith('172.'))
        || ips[0];

    return preferred;
}

function isIpAllowed(userIP, allowedIP) {
    if (!userIP || !allowedIP) return false;
    if (userIP === allowedIP) return true;

    const userParts = userIP.split('.');
    const allowedParts = allowedIP.split('.');

    if (userParts.length !== 4 || allowedParts.length !== 4) {
        return false;
    }

    return (
        userParts[0] === allowedParts[0] &&
        userParts[1] === allowedParts[1] &&
        userParts[2] === allowedParts[2]
    );
}

async function fetchPublicIPFrom(url, isJson = false) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return null;

        const value = isJson
            ? (await response.json())?.ip
            : (await response.text())?.trim();

        return /^\d{1,3}(\.\d{1,3}){3}$/.test(value || '') ? value : null;
    } catch (_error) {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function getPublicIP() {
    const providers = [
        () => fetchPublicIPFrom('https://api.ipify.org?format=json', true),
        () => fetchPublicIPFrom('https://ipv4.icanhazip.com'),
        () => fetchPublicIPFrom('https://ifconfig.me/ip')
    ];

    for (const provider of providers) {
        const ip = await provider();
        if (ip) return ip;
    }

    return null;
}

/**
 * Check if user is on the allowed WiFi network
 * @param {string|string[]} allowedIPs - Single IP or array of allowed IPs
 * @returns {Promise<boolean>} - true if on allowed network
 */
export async function isOnAllowedNetwork(allowedIPs) {
    try {
        const options = Array.isArray(allowedIPs) || typeof allowedIPs === 'string'
            ? {
                allowedLocalIPs: Array.isArray(allowedIPs) ? allowedIPs : [allowedIPs],
                allowedPublicIPs: [],
                enablePublicIPFallback: false,
            }
            : {
                allowedLocalIPs: allowedIPs?.allowedLocalIPs || [],
                allowedPublicIPs: allowedIPs?.allowedPublicIPs || [],
                enablePublicIPFallback: Boolean(allowedIPs?.enablePublicIPFallback),
            };

        const userLocalIPs = await getLocalIPs();

        const localMatch = userLocalIPs.some(userIP =>
            options.allowedLocalIPs.some(allowedIP => isIpAllowed(userIP, allowedIP))
        );
        if (localMatch) return true;

        if (options.enablePublicIPFallback && options.allowedPublicIPs.length) {
            const publicIP = await getPublicIP();
            if (!publicIP) return false;

            return options.allowedPublicIPs.some(allowedIP => isIpAllowed(publicIP, allowedIP));
        }

        return false;
    } catch (error) {
        console.error('Error checking network:', error);
        return false;
    }
}

/**
 * Get formatted network info for display
 */
export async function getNetworkInfo() {
    const ips = await getLocalIPs();
    const publicIP = await getPublicIP();
    return {
        ip: ips[0] || null,
        ips,
        publicIP,
        timestamp: new Date().toISOString()
    };
}
