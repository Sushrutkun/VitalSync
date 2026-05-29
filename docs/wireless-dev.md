# Wireless Dev — Running on Physical Device Without USB

## Option A — Same WiFi (active setup)

Mac IP: `192.168.1.36`  
`.env.local` already set to `http://192.168.1.36:8083`.

**Every session:**

1. Make sure phone and Mac are on the **same WiFi network**.

2. Start the backend (from `backend/`):
   ```bash
   ./mvnw spring-boot:run
   ```

3. Start Metro (from `frontend/`):
   ```bash
   npx expo start --port 8082
   ```

4. On phone, open the **VitalSync dev client**:
   - Tap **Tools → Enter URL manually**
   - Enter: `http://192.168.1.36:8082`

5. App loads. Backend calls hit `192.168.1.36:8083` over WiFi.

**If IP changes** (router reassigns it):
```bash
ipconfig getifaddr en0          # get new IP
```
Update `.env.local` and re-run Metro.

---

## Option B — Tunnel (different network / hotspot)

Use this when phone and Mac are on **different networks** (e.g. phone on mobile data, or Mac on ethernet and phone on hotspot).

### One-time setup

Install ngrok globally:
```bash
npm install -g ngrok
```

Create a free account at https://ngrok.com and authenticate:
```bash
ngrok config add-authtoken <your-token>
```

Install Expo's ngrok adapter:
```bash
cd frontend
npx expo install @expo/ngrok
```

### Every tunnel session

**Terminal 1 — expose Metro:**
```bash
cd frontend
npx expo start --tunnel --port 8082
```
Expo prints a tunnel URL like:
```
exp+vitalsync://expo-development-client/?url=https://xxxx.ngrok-free.app
```

**Terminal 2 — expose backend:**
```bash
ngrok http 8083
```
Note the forwarding URL, e.g. `https://yyyy.ngrok-free.app`.

**Update `.env.local`** with the backend tunnel URL:
```
EXPO_PUBLIC_API_BASE_URL=https://yyyy.ngrok-free.app
```
Restart Metro after changing the env file.

**On phone:**
- Open VitalSync dev client → **Tools → Enter URL manually**
- Paste the Metro tunnel URL shown in Terminal 1
- Or scan the QR code printed in the terminal

### Notes

- Free ngrok accounts get a **random URL each session** — update `.env.local` every time.
- Paid ngrok gives a stable subdomain (skip the update step).
- Tunnel adds ~100–300 ms latency vs WiFi — fine for dev, not for perf testing.
- Backend tunnel URL expires when you kill `ngrok http 8083` — restart both if connection drops.

### Revert to USB / localhost

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8083
```
Then use `adb reverse tcp:8082 tcp:8082 && adb reverse tcp:8083 tcp:8083` as before.
