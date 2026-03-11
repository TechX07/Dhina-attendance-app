# WiFi IP Restriction Setup Guide

## Overview
Your app now has WiFi IP restriction enabled. This means employees can only access the application when connected to your office WiFi network.

## How It Works
1. **Detection**: The app uses WebRTC to detect the employee's local network IP address
2. **Verification**: Compares the IP against your configured allowed networks
3. **Access Control**: Blocks access if the IP doesn't match the allowed networks
4. **Error Message**: Shows a user-friendly error if on wrong network

## Configuration

### Step 1: Find Your Office WiFi IP
To configure the allowed networks, you need to know your office WiFi subnet:

**On Windows:**
```
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter. It will look like: `192.168.1.45`

**On Mac/Linux:**
```
ifconfig
```

### Step 2: Update Allowed Networks
Edit the file: `src/config/allowedNetworks.js`

```javascript
export const ALLOWED_NETWORKS = [
    '192.168.1.0',      // Change this to your office WiFi subnet
    '192.168.0.0',      // Add more networks if needed
];
```

**Examples:**
- If your IP is `192.168.1.45`, set allowed network to `192.168.1.0`
- If your IP is `10.0.0.50`, set allowed network to `10.0.0.0`
- If you have multiple office locations: `['192.168.1.0', '10.0.0.0']`

### Step 3: Enable/Disable Feature
In the same file `src/config/allowedNetworks.js`:

```javascript
// Set to false to disable IP checking (for development/testing)
export const ENABLE_IP_RESTRICTION = true;  // Change to false to disable

// Show IP info to users for debugging
export const SHOW_IP_INFO = false;  // Set to true in development for debugging
```

## Testing

### Enable Debug Mode
Set `SHOW_IP_INFO = true` in config to see user's IP and allowed networks:

```javascript
export const SHOW_IP_INFO = true;
```

### Test the Restriction
1. Connect to your office WiFi
2. Try opening the app - should work ✅
3. Connect to a different WiFi or mobile hotspot
4. Try opening the app - should show access denied ❌

## Security Features
✅ **Client-Side Detection**: Uses WebRTC to detect local IP  
✅ **Subnet Matching**: Allows entire office network, not just specific IPs  
✅ **Error Messages**: Clear feedback about why access is denied  
✅ **Easy Toggle**: Can be disabled for testing/maintenance

## For Your Admin Panel
Add a settings page where admins can update allowed networks:
- They can be stored in a Supabase table
- Update the config dynamically without redeployment
- Monitor which IPs are accessing the app

## Troubleshooting

### "Unauthorized Network" Error
- Verify you're connected to the correct office WiFi
- Check the IP address shown in debug mode
- Ensure allowed network is configured correctly
- Try using a VPN if connecting remotely

### IP Detection Failed
- Check browser console for errors
- Try refreshing the page
- Some networks block WebRTC - you may need to use a backend IP detection method

### Need to Disable Temporarily
Set `ENABLE_IP_RESTRICTION = false` in config and refresh

## Advanced Setup (Optional)
For stronger security, add backend validation:
1. Each login request validates IP on the server
2. Log all access attempts with IP addresses
3. Alert admins of suspicious IP addresses
4. Implement grace period for VPN users
