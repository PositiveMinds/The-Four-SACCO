# PWA Installation Guide - The Four SACCO

## Overview
The Four SACCO is a Progressive Web App (PWA) that can be installed on any device - desktop, tablet, or mobile phone. This guide explains the installation requirements and how the app ensures installation happens.

---

## Requirements for PWA Installation

### 1. **HTTPS Connection** (Production Only)
- ✅ **Localhost/Development**: Works fine
- ✅ **HTTPS Websites**: Fully supported
- ❌ **HTTP (non-HTTPS)**: PWA features disabled for security

**Why**: PWA requires secure connections to protect user data.

### 2. **Valid Web Manifest** ✅
The `manifest.json` file must include:
```json
{
  "name": "Full app name",
  "short_name": "Short name",
  "description": "App description",
  "start_url": "/",           // Entry point
  "scope": "/",               // Navigation scope
  "display": "standalone",    // Standalone mode
  "theme_color": "#FFCC00",   // App theme
  "background_color": "#ffffff",
  "icons": [                  // At least 192x192 required
    { "src": "/images/image-192.png", "sizes": "192x192", "type": "image/png" }
  ]
}
```

### 3. **Service Worker** ✅
- Must be registered at `/service-worker.js`
- Must handle cache and offline functionality
- Required for offline support

**Status**: `service-worker.js` is registered and configured.

### 4. **Icons** ✅
Icons are required in the manifest:
- **192x192px**: Minimum required (displayed on home screen)
- **384x384px**: Tablet/larger screens
- **512x512px**: Splash screens (with "maskable" purpose for rounded icons)

**Status**: All required icons are present:
```
/images/image-192.png   ✅
/images/image-384.png   ✅
/images/image-512.png   ✅ (maskable)
```

### 5. **Viewport Meta Tag** ✅
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Status**: Present and configured correctly.

### 6. **HTTPS Meta Tags** ✅
```html
<meta name="theme-color" content="#FFCC00">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-standalone" content="yes">
```

**Status**: All required meta tags present.

---

## How Installation Works

### Browser Detection & Installation Flow

#### **Step 1: beforeinstallprompt Event**
When a user visits the app on a supported browser, the `beforeinstallprompt` event fires automatically if:
1. HTTPS is enabled (or localhost)
2. Manifest is valid
3. Service Worker is registered
4. All icons exist and are accessible

#### **Step 2: Installation Prompt**
- The install button appears in the header
- A notification shows: "App is being prepared for installation"
- After 1 second, the installation prompt automatically triggers
- User can **Accept** (installs app) or **Decline** (can install later)

#### **Step 3: Post-Installation**
- App appears on home screen (mobile) or Start Menu/Taskbar (desktop)
- App runs in standalone mode (no browser UI)
- Full offline support enabled
- Success message displays: "The Four SACCO is now installed"

---

## Installation by Device

### **Android Phones & Tablets**
1. Click the **Install App** button in the header
2. Tap the install prompt when it appears
3. App is added to home screen immediately
4. Launch from home screen anytime

**Alternative** (if prompt doesn't appear):
- Tap menu (⋮) → "Install app" or "Add to home screen"

### **iOS (iPhone, iPad, iPod)**
iOS doesn't support the `beforeinstallprompt` event, so:
1. Open the app in Safari
2. Tap Share (⬆️) button at bottom
3. Scroll and tap "Add to Home Screen"
4. Customize name if needed
5. Tap "Add" to confirm

### **Windows/Mac/Linux Desktop**
1. Click **Install App** button in the header
2. Follow browser prompts:
   - **Chrome/Edge**: Click install icon (⬇️) in address bar
   - **Firefox**: Menu → Install The Four
3. App appears in:
   - Start Menu (Windows)
   - Applications folder (Mac)
   - App drawer (Linux)

---

## Debugging: Check Installation Status

### Open Browser Console
Press **F12** or **Right-click → Inspect → Console**

### Run PWA Checker
```javascript
window.pwaChecker.getReport()
```

This returns:
```javascript
{
  requirements: {
    https: true,
    manifest: true,
    serviceWorker: true,
    icons: true,
    viewport: true,
    displayMode: false  // false = not installed yet
  },
  errors: [],
  isValid: true
}
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No install button | beforeinstallprompt not firing | Check console errors; ensure HTTPS/localhost |
| "Invalid manifest" | Manifest has errors | Check manifest.json syntax |
| Icons missing | Wrong paths in manifest | Verify icon URLs: `/images/image-192.png` |
| Service Worker error | Registration failed | Check service-worker.js exists and loads |
| Still in browser mode | App not installed | Manually install via menu → Install |

### View Console Logs
The app logs PWA status on every page load:
```
✅ HTTPS check passed
📋 Manifest loaded...
✅ Manifest has name or short_name
✅ Service Worker is registered and ready
✅ Icon found: /images/image-192.png (192x192)
...
✅ All PWA requirements met! Installation should work.
```

---

## Manifest Configuration

### Current manifest.json Structure
```json
{
  "name": "The Four - SACCO Management System",
  "short_name": "The Four",
  "description": "Savings and Credit Cooperative Society Management System",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui"],
  "orientation": "portrait-primary",
  "theme_color": "#FFCC00",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/images/image-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/image-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Key Settings
- **`display: "standalone"`**: Runs without browser UI
- **`start_url: "/"`**: Opens at root when installed
- **`scope: "/"`**: App can navigate anywhere on site
- **`theme_color`**: Header color in installed app
- **`icons`**: Must include at least 192x192px

---

## Service Worker Cache Strategy

The app uses a **cache-first with network fallback** strategy:
1. Check cache for requested resource
2. If found, serve from cache
3. If not found, fetch from network
4. Cache new resources for future offline use

### Cached Assets
- All HTML/CSS/JS files
- All images and icons
- External libraries (Chart.js, Bootstrap Icons, etc.)
- User data (stored in IndexedDB)

---

## Testing Installation

### Test on Browser DevTools
1. Open Chrome DevTools
2. Go to **Application** tab
3. Check **Manifest** section:
   - ✅ manifest.json loads successfully
   - ✅ Icons display correctly
4. Check **Service Workers** section:
   - ✅ Service worker is registered
   - ✅ Status shows "activated and running"

### Test beforeinstallprompt Event
Open Console and run:
```javascript
console.log('Deferred prompt:', window.pwaInstaller?.deferredPrompt);
console.log('Is installed:', window.pwaInstaller?.isInstalled);
```

### Test on Real Devices
- **Android**: Open in Chrome, tap menu → Install app
- **iOS**: Open in Safari, tap Share → Add to Home Screen
- **Desktop**: Chrome/Edge should show install icon in address bar

---

## Automatic Installation Flow (Code)

### pwa-install.js Process
1. **Initialization**: Checks if app is already installed
2. **Event Listener**: Waits for `beforeinstallprompt` event
3. **Fallback**: Shows install button if event doesn't fire in 3 seconds
4. **Auto-Trigger**: Automatically shows installation prompt after 1 second
5. **User Choice**: Respects user's accept/decline decision
6. **Post-Install**: Hides button and shows success message

### pwa-checker.js Process
Runs on every page load and validates:
- ✅ HTTPS/localhost status
- ✅ Manifest file and structure
- ✅ Service Worker registration
- ✅ Icon accessibility
- ✅ Viewport meta tag
- ✅ Display mode (installed vs. browser)

All issues are logged in browser console.

---

## Offline Functionality

Once installed, the app works fully offline:
- ✅ All data stored locally in browser (IndexedDB)
- ✅ No server required
- ✅ All features available: Members, Loans, Payments, Reports, Savings
- ✅ PDF export works offline (custom generator)
- ✅ Notifications work offline

---

## Removing/Uninstalling

### Android
1. Long-press app icon
2. Select "Uninstall" or drag to "Uninstall"

### iOS
1. Long-press app icon
2. Tap "Remove App"
3. Tap "Remove from Home Screen"

### Desktop (Windows)
1. Right-click app in Start Menu
2. Select "Uninstall"
3. Or go to Settings → Apps → Apps & features → Uninstall

### Desktop (Mac)
1. Open Applications folder
2. Drag app to Trash
3. Or right-click → Move to Trash

---

## Browser Support

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | Full PWA support |
| Firefox | ✅ | ✅ | Full PWA support |
| Edge | ✅ | ✅ | Full PWA support |
| Safari | ⚠️ Limited | ✅ | Limited PWA (Add to Home Screen) |
| Opera | ✅ | ✅ | Full PWA support |

---

## Troubleshooting

### Install Button Not Appearing
**Check**:
1. Open Console (F12)
2. Verify: `beforeinstallprompt event captured` message
3. Run: `window.pwaChecker.getReport()`
4. Check errors in console

**Solutions**:
- Ensure HTTPS or localhost
- Clear browser cache and reload
- Check manifest.json for errors
- Verify all icons exist

### Installation Prompt Not Triggering
**Check**:
- Is app already installed? (Check: `window.pwaInstaller?.isInstalled`)
- Does localStorage show `pwaInstalled: 'true'`?
- Is browser supported? (Chrome, Firefox, Edge, Opera)

**Solutions**:
- Use manual installation method (menu → Install)
- Clear localStorage: `localStorage.clear()`
- Try different browser

### Icons Not Loading
**Check**:
- Network tab in DevTools
- Console errors about missing images
- Image paths in manifest.json

**Solutions**:
- Verify image files exist in `/images/` folder
- Check file paths in manifest.json
- Ensure images are PNG format

---

## Best Practices for Users

1. **Install on Primary Device**: Install on device you use most
2. **Keep App Updated**: Browser auto-updates when connected to internet
3. **Regular Backups**: Use Export/Backup feature periodically
4. **Use Offline Mode**: Full functionality works without internet
5. **Storage Quota**: App data limited by browser storage (typically 50GB)

---

## Technical Support

For PWA-related issues:
1. Check browser console (F12)
2. Run `window.pwaChecker.checkAll()`
3. Review console logs for specific errors
4. Check manifest.json syntax
5. Verify Service Worker status in DevTools

---

## Additional Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Chrome DevTools Application Tab](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
