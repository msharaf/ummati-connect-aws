# Tunnel Mode Failed - Use LAN Mode Instead

## Issue
Tunnel mode failed with: `ngrok tunnel took too long to connect`

This is common - tunnel mode can be slow or fail due to network/firewall issues.

## Solution: Use LAN Mode

LAN mode is faster and more reliable for local development.

### Step 1: Check Requirements

1. **Ensure API server is running:**
   ```bash
   pnpm dev:api
   ```
   Should show: `🚀 API server running on http://localhost:3001`

2. **Verify both devices on same WiFi:**
   - Check WiFi network name on your phone
   - Verify it matches your computer's WiFi network

### Step 2: Start with LAN Mode

```bash
pnpm dev:mobile -- --lan
```

### Step 3: Verify Connection URL

Look for a line showing:
```
Metro waiting on exp://192.168.123.223:8081
```

**If it shows `exp://127.0.0.1:8081` instead:**

### Fix: Windows Firewall Configuration

1. **Allow Node.js through Firewall:**
   - Open Windows Security → Firewall & network protection
   - Click "Allow an app through firewall"
   - Find "Node.js" and check both Private and Public
   - If not listed, click "Allow another app" and add Node.js executable

2. **Alternatively, temporarily disable firewall for testing:**
   - Windows Security → Firewall & network protection
   - Turn off (temporary - remember to turn back on)

3. **Restart Expo:**
   ```bash
   # Stop (Ctrl+C), then:
   pnpm dev:mobile -- --lan
   ```

### Alternative: Use Manual IP Entry

If LAN mode still doesn't work:

1. Start Expo normally:
   ```bash
   pnpm dev:mobile
   ```

2. In Expo DevTools, manually enter:
   ```
   exp://192.168.123.223:8081
   ```

3. Or use Expo Go app:
   - Tap "Enter URL manually"
   - Type: `exp://192.168.123.223:8081`

## Quick Test

```bash
# Terminal 1: Start API server
pnpm dev:api

# Terminal 2: Start mobile with LAN
pnpm dev:mobile -- --lan
```

**Expected output:**
```
Metro waiting on exp://192.168.123.223:8081
```

Scan the QR code - it should connect successfully!

## Troubleshooting

**Still showing 127.0.0.1?**
1. Check Windows Firewall (allow Node.js)
2. Verify same WiFi network
3. Try: `ipconfig` to confirm IP is still `192.168.123.223`
4. Restart router/network adapter

**Connection still fails?**
- Check `apps/mobile/.env` has correct API URL
- Restart Expo server after firewall changes
- Try scanning QR code again
