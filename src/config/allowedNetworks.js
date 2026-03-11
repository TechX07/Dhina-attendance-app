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
    '192.168.1.37',      // Change this to your office WiFi subnet
    '192.168.1.0',       // Add more networks if needed
];

// Set to FALSE for development/testing - IP checking is disabled
export const ENABLE_IP_RESTRICTION = true;

// Show IP info to users for debugging
export const SHOW_IP_INFO = true;

// Allow localhost for development (useful for testing on localhost:5173)
export const ALLOW_LOCALHOST = true;
