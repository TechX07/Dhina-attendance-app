/**
 * Configure allowed WiFi networks here
 * Add the office WiFi IP addresses that employees should connect from
 * 
 * Examples:
 * Single IP: '192.168.1.1'
 * Multiple IPs: ['192.168.1.1', '192.168.1.2']
 * Subnet: '192.168.1.0' (will match 192.168.1.X)
 */

export const ALLOWED_NETWORKS = [
    '192.168.29.0',       // Your WiFi subnet (matches 192.168.29.X)
];

// Fallback for hosted environments where browsers hide local IP via WebRTC privacy.
// Replace this if your ISP public IP changes.
export const ALLOWED_PUBLIC_IPS = [
    '49.47.218.139',
];

// Keep TRUE to allow public IP fallback when local IP detection is blocked.
export const ENABLE_PUBLIC_IP_FALLBACK = true;

// Keep this TRUE so the app works only on allowed WiFi networks
export const ENABLE_IP_RESTRICTION = true;

// Show IP info to users for debugging
export const SHOW_IP_INFO = false;

// Set FALSE so localhost is not bypassed
export const ALLOW_LOCALHOST = false;
