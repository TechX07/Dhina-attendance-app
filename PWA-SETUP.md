# PWA (Progressive Web App) Setup Guide

Your Attendance Manager app is now configured as a Progressive Web App! Here's what was added and how to use it.

## ✨ PWA Features Added

### 1. **Service Worker** (`public/service-worker.js`)
   - **Offline Support**: Works without internet connection
   - **Caching Strategy**: 
     - Static assets cached for fast load times
     - API calls use network-first with fallback to cache
   - **Background Sync**: Prepares infrastructure for background syncing
   - **Push Notifications**: Ready for remote notifications

### 2. **Web App Manifest** (`public/manifest.json`)
   - Defines app metadata (name, description, icons, colors)
   - Enables "Add to Home Screen" on mobile devices
   - Sets display mode as standalone (full-screen app experience)
   - Includes app shortcuts for quick access

### 3. **Meta Tags** (`index.html`)
   - Apple iOS compatibility tags
   - Theme color configuration
   - Mobile web app capabilites

### 4. **Installation Prompt** (`src/components/PWAInstallPrompt.jsx`)
   - Beautiful install prompt banner
   - Shows on browser's install trigger
   - Can be dismissed or installed

### 5. **PWA Utilities** (`src/utils/pwa.js`)
   - `usePWAInstall()` - React hook for installation handling
   - `isPWASupported()` - Check browser support
   - `checkPWAStatus()` - Diagnostic information
   - `requestNotificationPermission()` - Ask for notifications
   - `sendNotification()` - Send push notifications

## 🚀 Getting Started

### Step 1: Generate App Icons

Run the icon generation script:

```bash
npm run pwa:icons
```

This creates 4 PNG icon files in the `public/` directory:
- `icon-192.png` - Standard icon (192x192)
- `icon-512.png` - Large icon (512x512)
- `icon-192-maskable.png` - Maskable icon for adaptive display
- `icon-512-maskable.png` - Large maskable icon

**Note**: If you don't have the `canvas` package installed, it will generate SVG versions. For PNG icons:
```bash
npm install --save-dev canvas
npm run pwa:icons
```

### Step 2: Build the App

```bash
npm run build
```

### Step 3: Test with HTTPS

PWA features require HTTPS (except localhost). Test locally with:

```bash
npm install -g http-server
http-server dist -p 8080
```

Then visit `https://localhost:8080` (use `http://localhost:8080` for local testing)

## 📱 Installation Methods

### Web Browser
1. Visit the app in a supported browser (Chrome, Edge, Firefox, Safari)
2. Look for the install prompt (banner or address bar icon)
3. Click "Install"
4. App appears on home screen/app drawer

### Manual Installation (Chrome/Edge)
1. Click the menu (⋮) in browser
2. Select "Install app" or "Add to home screen"
3. Confirm

## 🔧 Using PWA Features in Your App

### Show Custom Install Prompt

```jsx
import { usePWAInstall } from '../utils/pwa';

export function MyComponent() {
  const { canInstall, isInstalled, install } = usePWAInstall();

  return (
    <>
      {canInstall && (
        <button onClick={install}>
          Get App
        </button>
      )}
      {isInstalled && <p>App is installed!</p>}
    </>
  );
}
```

### Check PWA Status

```jsx
import { checkPWAStatus } from '../utils/pwa';

const status = checkPWAStatus();
console.log('Is installed:', status.isStandalone);
console.log('Is online:', status.isOnline);
```

### Send Notifications

```jsx
import { requestNotificationPermission, sendNotification } from '../utils/pwa';

async function notifyUser() {
  const granted = await requestNotificationPermission();
  if (granted) {
    await sendNotification('Attendance Marked', {
      body: 'Your attendance has been recorded successfully',
      tag: 'attendance',
    });
  }
}
```

## 📋 Checklist for Full PWA Compliance

- [x] Service Worker registered
- [x] Web App Manifest
- [x] HTTPS ready (for production)
- [x] Icons (192x192 and 512x512)
- [x] Install prompt
- [x] Offline support
- [ ] Custom splash screens (optional - `screenshots` in manifest)
- [ ] Theme color matching
- [ ] Responsive design (already done!)

## 🐛 Testing & Debugging

### Check Service Worker Status
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### Clear Cache (if needed)
```javascript
// In browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Check Manifest
- DevTools → Application → Manifest
- Should show all app info

### Test Offline Mode
1. DevTools → Network
2. Select "Offline" from throttle dropdown
3. Reload page - should still load from cache

## 📱 Attendance App Shortcuts

The app includes a home screen shortcut:
- **Mark Attendance** - Quick link to `/employee` dashboard

## 🎨 Customization

### Change App Colors
Edit `manifest.json`:
```json
"theme_color": "#4f46e5",
"background_color": "#09090b"
```

### Change App Name
Edit `manifest.json` and `index.html`:
```json
"name": "Your Custom Name"
```

### Update Icons
Replace PNG files in `public/` with your custom icons

## 🌐 Deployment

### For Vercel
- PWA features work out of the box
- Ensure HTTPS is enabled (default)

### For Netlify
- PWA features work out of the box
- Custom headers may be needed for service worker

### For Custom Server
- Ensure HTTPS is enabled
- Set proper CORS headers for service worker
- Example (Express.js):
  ```javascript
  app.get('/service-worker.js', (req, res) => {
    res.header('Service-Worker-Allowed', '/');
    res.sendFile('public/service-worker.js');
  });
  ```

## 📚 References

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA Checklist](https://web.dev/pwa-checklist/)
- [Google - Service Worker API](https://developers.google.com/web/fundamentals/primers/service-workers)

## 💡 Next Steps

1. Generate icons: `npm run pwa:icons`
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Deploy to HTTPS hosting
5. Test installation on mobile devices

Ready to go! Your app is now a fully-featured PWA. 🚀
