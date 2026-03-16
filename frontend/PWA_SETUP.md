# PWA Icons Setup Guide

Your PWA is configured to use the following icons. You need to create these icon files and place them in the `frontend/static/` directory:

## Required Icons

### App Icons

1. **icon-192.png** (192x192 px)
   - Square icon for app installation
   - Used by most devices and app stores
   - Place in: `frontend/static/icon-192.png`

2. **icon-512.png** (512x512 px)
   - Larger icon for splash screens
   - Used on high-resolution devices
   - Place in: `frontend/static/icon-512.png`

3. **icon-maskable-192.png** (192x192 px)
   - Maskable icon for dynamic icon display
   - Safe area: leave 45px padding on all sides (102px center area)
   - Place in: `frontend/static/icon-maskable-192.png`

4. **icon-maskable-512.png** (512x512 px)
   - Maskable icon for dynamic icon display
   - Safe area: leave 120px padding on all sides (272px center area)
   - Place in: `frontend/static/icon-maskable-512.png`

### Screenshots (Optional)

For app store listings, optionally create:

1. **screenshot-540.png** (540x720 px)
   - Narrow form factor screenshot (mobile)
   - Place in: `frontend/static/screenshot-540.png`

2. **screenshot-1280.png** (1280x720 px)
   - Wide form factor screenshot (tablet/desktop)
   - Place in: `frontend/static/screenshot-1280.png`

## Creating Icons

### Using Online Tools
- **Favicon & Icon Generator**: https://www.favicon-generator.org/
- **Maskable Icon Generator**: https://maskable.app/

### Using Design Software
- Adobe Photoshop, Figma, GIMP, or Inkscape
- Design at 512x512px, then export at different sizes
- Use PNG format with transparency support

### Quick Start (Design Tips)
- Use the app's theme color (#6366f1 - indigo)
- Keep design simple and recognizable at small sizes
- Ensure logo/icon is centered
- For maskable icons, keep important content within the safe area

## Testing Your PWA

After adding icons:

1. **Build the app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the app:**
   ```bash
   npm run preview
   ```

3. **Test on Chrome/Edge (Desktop):**
   - Open DevTools (F12)
   - Go to Application tab
   - Check Manifest tab to verify icons are loaded
   - Look for "Install app" prompt

4. **Test on Android:**
   - Open in Chrome on Android
   - Tap the menu (three dots)
   - Look for "Install app" option

5. **Test on iOS:**
   - Safari > Share > Add to Home Screen
   - Check that icon appears correctly

## Manifest Configuration

The manifest.json is already configured in `frontend/static/manifest.json` with:
- App name and short name
- Icons with "any" and "maskable" purposes
- Maskable icon support for dynamic theming
- Screenshots for app stores
- PWA display mode: "standalone"
- Theme color: #6366f1

## Service Worker

The service worker is configured in `frontend/src/service-worker.ts` and handles:
- **Offline functionality**: Caches app shell and assets
- **Network-first strategy for API calls**: Uses cache as fallback
- **Cache-first strategy for static assets**: Updates in background
- **Automatic cache updates**: Checks for new service worker version every minute

## Next Steps After Icons

1. Place all icon files in `frontend/static/`
2. Run `npm run build` to rebuild
3. Test in DevTools and on mobile devices
4. Deploy to your hosting provider

Your app is now PWA-ready!
