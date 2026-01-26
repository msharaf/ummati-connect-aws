# Mobile App Connection Fix

## Problem
Expo Go is trying to connect to `127.0.0.1:8081` (localhost on the phone), which won't work. The phone needs to connect to your computer's IP address.

## Quick Fix (Choose One Method)

### Method 1: Use Tunnel Mode (Easiest - Recommended)

Tunnel mode works even if devices are on different networks.

1. **Stop any running Expo server** (Ctrl+C)

2. **Start Expo with tunnel:**
   ```bash
   cd apps/mobile
   pnpm start --tunnel
   ```

3. **Scan the QR code** that appears - it will use Expo's tunnel service

**Note**: Tunnel mode requires an Expo account (free) and internet connection.

---

### Method 2: Use LAN Mode (Faster - Same Network Required)

For this to work, your phone and computer must be on the **same WiFi network**.

1. **Stop any running Expo server** (Ctrl+C)

2. **Start Expo with LAN:**
   ```bash
   cd apps/mobile
   pnpm start --lan
   ```

3. **Verify the connection URL shows your LAN IP:**
   - Should show: `exp://192.168.123.223:8081` (or similar)
   - NOT `exp://127.0.0.1:8081`

4. **Scan the QR code** from Expo DevTools

**If it still shows 127.0.0.1:**
- Check firewall settings (Windows Firewall may be blocking)
- Ensure both devices are on the same WiFi network
- Try restarting the Expo server

---

### Method 3: Update API URL for Physical Device

If using a physical device, you also need to update the API URL:

1. **Create/update `apps/mobile/.env`:**
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
   EXPO_PUBLIC_API_URL="http://192.168.123.223:3001"
   ```

2. **Restart Expo server** after creating/updating `.env`

---

## Complete Setup Steps

### 1. Ensure API Server is Running

```bash
# From project root
pnpm dev:api
```

Should show: `🚀 API server running on http://localhost:3001`

### 2. Start Mobile App with Correct Mode

```bash
# Option A: Tunnel (easiest)
pnpm dev:mobile -- --tunnel

# Option B: LAN (faster, same network required)
pnpm dev:mobile -- --lan
```

### 3. Update Mobile Environment (For Physical Devices)

Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
EXPO_PUBLIC_API_URL="http://192.168.123.223:3001"
```

**Note**: 
- For iOS Simulator/Android Emulator: Use `http://localhost:3001`
- For Physical Device: Use `http://192.168.123.223:3001` (your LAN IP)

---

## Troubleshooting

### Issue: Still shows `127.0.0.1` after using `--lan`

**Solutions:**
1. Check Windows Firewall - allow Node.js/Expo
2. Verify same WiFi network (check WiFi name on both devices)
3. Try tunnel mode instead: `pnpm start --tunnel`
4. Restart Expo: `Ctrl+C` then start again

### Issue: "Could not connect to the server"

**Solutions:**
1. Ensure Expo dev server is running
2. Check your computer's IP hasn't changed (run `ipconfig` again)
3. Update `apps/mobile/.env` with correct `EXPO_PUBLIC_API_URL`
4. Restart Expo server after env changes

### Issue: API calls fail on physical device

**Solution:**
- Update `apps/mobile/.env` with your LAN IP:
  ```env
  EXPO_PUBLIC_API_URL="http://192.168.123.223:3001"
  ```
- Restart Expo server

---

## Quick Reference

**Your Computer's LAN IP:** `192.168.123.223`

**Common Commands:**
```bash
# Start mobile with tunnel
pnpm dev:mobile -- --tunnel

# Start mobile with LAN
pnpm dev:mobile -- --lan

# Check your IP address
ipconfig | Select-String "IPv4"
```

**Connection URLs:**
- Expo Dev Server: `exp://192.168.123.223:8081` (LAN) or tunnel URL
- API Server: `http://192.168.123.223:3001` (for physical devices)
