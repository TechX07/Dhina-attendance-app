/**
 * Get the local IP address using WebRTC
 * This works because WebRTC needs to know your local IP for peer connections
 */
export async function getLocalIP() {
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

        const resolveIP = (ip) => {
            if (!resolved) {
                resolved = true;
                cleanup();
                console.log('[Network] Detected IP:', ip);
                resolve(ip || null);
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
                    resolveIP(null);
                });

            pc.onicecandidate = (ice) => {
                try {
                    if (!ice || !ice.candidate) {
                        console.log('[Network] ICE gathering complete');
                        // If we found IPs, resolve with the first one
                        if (ips.length > 0) {
                            resolveIP(ips[0]);
                        }
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
                            
                            // Resolve immediately with first private IP
                            if (isPrivate) {
                                resolveIP(ipAddress);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[Network] Error in onicecandidate:', err);
                }
            };

            // Timeout - 3 seconds max
            timeoutId = setTimeout(() => {
                console.log('[Network] Timeout reached. Resolving with found IPs:', ips);
                resolveIP(ips.length > 0 ? ips[0] : null);
            }, 3000);

        } catch (error) {
            console.error('[Network] Error in getLocalIP:', error);
            cleanup();
            resolve(null);
        }
    });
}

/**
 * Check if user is on the allowed WiFi network
 * @param {string|string[]} allowedIPs - Single IP or array of allowed IPs
 * @returns {Promise<boolean>} - true if on allowed network
 */
export async function isOnAllowedNetwork(allowedIPs) {
    try {
        const userIP = await getLocalIP();
        
        if (!userIP) {
            console.warn('Could not detect local IP address');
            return false;
        }

        const allowedList = Array.isArray(allowedIPs) ? allowedIPs : [allowedIPs];
        
        // Check if user's IP matches any allowed IP or is on the same subnet
        const isAllowed = allowedList.some(allowedIP => {
            // Exact match
            if (userIP === allowedIP) return true;
            
            // Subnet match (for networks like 192.168.1.0/24)
            const userParts = userIP.split('.');
            const allowedParts = allowedIP.split('.');
            
            // Match first 3 octets for subnet /24
            if (userParts[0] === allowedParts[0] && 
                userParts[1] === allowedParts[1] && 
                userParts[2] === allowedParts[2]) {
                return true;
            }
            
            return false;
        });

        return isAllowed;
    } catch (error) {
        console.error('Error checking network:', error);
        return false;
    }
}

/**
 * Get formatted network info for display
 */
export async function getNetworkInfo() {
    const ip = await getLocalIP();
    return {
        ip,
        timestamp: new Date().toISOString()
    };
}
