# Production Configuration for PWA

This directory contains configuration files for properly serving your PWA in production.

## For Nginx

Use the configuration in `nginx.conf` to:
- Set proper cache headers for service worker (no cache)
- Set long cache for static assets (hash-based)
- Enable HTTPS (required for PWA)
- Handle SPA routing

## For Apache

Use the configuration in `.htaccess` to:
- Set proper cache headers
- Enable gzip compression
- Rewrite URLs for SPA routing
- Enable required security headers

## Docker Configuration

The `Dockerfile` already includes Node.js adapter configuration.

To deploy as PWA:

1. Build the image:
   ```bash
   docker build -t sensorapp-frontend .
   ```

2. Run with proper headers:
   ```bash
   docker run -p 5173:3000 sensorapp-frontend
   ```

## Key PWA Requirements

1. **HTTPS** - PWA requires HTTPS (required for Service Workers)
2. **Service Worker Cache Headers** - Must have:
   ```
   Cache-Control: max-age=0, must-revalidate
   ```
3. **Manifest.json** - Must be served with:
   ```
   Content-Type: application/manifest+json
   ```
4. **Static Assets** - Can have long cache:
   ```
   Cache-Control: public, max-age=31536000, immutable
   ```

## Testing Headers

After deployment, check headers:

```bash
curl -I https://yourdomain.com/service-worker.js
curl -I https://yourdomain.com/manifest.json
curl -I https://yourdomain.com/_app/immutable/...
```

Expected responses:
- service-worker.js: no-cache, must-revalidate
- manifest.json: public, can cache
- _app/immutable/...: public, immutable, long cache

## Deployment Checklist

- [ ] HTTPS/SSL certificate configured
- [ ] Service worker cache headers set to no-cache
- [ ] Manifest.json served with correct content-type
- [ ] Static assets have cache busting (hash-based names)
- [ ] SPA routing configured (fallback to index.html)
- [ ] Gzip compression enabled
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Icons placed in static directory
- [ ] App tested in DevTools PWA mode
- [ ] App testable on mobile devices
