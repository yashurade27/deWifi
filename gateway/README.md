# AirLink Local Gateway Server

This is the **local gateway server** that runs on the WiFi **owner's laptop** to control internet access through a captive portal system.

## How It Works

```
Your Home WiFi (Internet Source)
        â”‚
        â–¼
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚  Your Laptop     â”‚
  â”‚  â”œâ”€ Mobile Hotspot (Open/No password)
  â”‚  â”œâ”€ Gateway Server (port 8080)
  â”‚  â””â”€ DNS Redirect (port 53, optional)
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚
  â”Œâ”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”
  â”‚  User's    â”‚
  â”‚  Device    â”‚
  â”‚  connects  â”‚
  â”‚  to hotspotâ”‚
  â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
        â”‚
        â–¼
  Captive Portal Appears
  â†’ User enters Access Token
  â†’ Gateway validates with backend
  â†’ Firewall allows internet access
  â†’ Access revoked when booking expires
```

## Prerequisites

1. **Windows 10/11** with Mobile Hotspot capability
2. **Node.js 18+** installed
3. **Admin privileges** (needed for firewall rules)
4. Backend server running (`cd backend && npm run dev`)
5. Frontend server running (`cd frontend && npm run dev`)

## Setup

### 1. Install Dependencies

```powershell
cd gateway
npm install
```

### 2. Enable Mobile Hotspot

- Open **Settings â†’ Network & Internet â†’ Mobile Hotspot**
- Toggle **ON**
- For captive portal mode, optionally set network to **Open** (no password)
- Note the network name

### 3. Start the Gateway (Run PowerShell as Administrator)

```powershell
# Replace <YOUR_SPOT_ID> with your actual Spot ID from the Owner Dashboard
node gateway.js --spot <YOUR_SPOT_ID>
```

#### Optional Flags

| Flag          | Default                 | Description                                |
| ------------- | ----------------------- | ------------------------------------------ |
| `--spot`      | (required)              | Your WiFi Spot ID from the Owner Dashboard |
| `--port`      | `8080`                  | Port for the gateway HTTP server           |
| `--backend`   | `http://localhost:3000` | URL of the AirLink backend API              |
| `--portal`    | `http://localhost:5173` | URL of the AirLink frontend app             |
| `--interface` | (auto-detect)           | Name of the hotspot network interface      |

### 4. (Optional) Start DNS Redirect

This makes the captive portal appear **automatically** when users open any website:

```powershell
# Must run as Administrator (binds to port 53)
node dns-redirect.js
```

### 5. Alternative: Use the Setup Wizard

```powershell
node setup-hotspot.js
```

This interactive wizard walks you through the entire setup process.

## User Flow

1. **User books WiFi** on the website and pays via Razorpay
2. **User receives** an Access Token (e.g., `A3B5C7D9E1F2G4H6`) and OTP (e.g., `847293`)
3. **User connects** to your Mobile Hotspot WiFi
4. **Portal appears** (or user navigates to `http://192.168.137.1:8080`)
5. **User enters** Access Token or OTP
6. **Gateway validates** with the backend API
7. **Firewall allows** internet access for that device
8. **When booking expires**, gateway blocks the device automatically

## Architecture

| Component         | Port | Purpose                                              |
| ----------------- | ---- | ---------------------------------------------------- |
| `gateway.js`      | 8080 | HTTP server for captive portal + firewall management |
| `dns-redirect.js` | 53   | DNS server that redirects all queries to gateway IP  |
| Backend API       | 3000 | Validates tokens, manages bookings & sessions        |
| Frontend          | 5173 | User-facing app for booking & portal UI              |

## Troubleshooting

### "Permission denied" / Firewall rules not working

- Run PowerShell as **Administrator**
- Right-click PowerShell â†’ "Run as administrator"

### Captive portal not appearing automatically

- Start `dns-redirect.js` (requires admin)
- Or tell users to manually navigate to `http://192.168.137.1:8080`

### Mobile Hotspot not starting

- Check Windows Services: "Windows Mobile Hotspot Service"
- Ensure WiFi adapter supports hosted networks
- Try: `netsh wlan show drivers` â†’ check "Hosted network supported: Yes"

### Can't reach backend API

- Make sure backend is running: `cd backend && npm run dev`
- Check BACKEND_URL flag matches your backend address

## Cleanup

The gateway automatically cleans up all firewall rules on shutdown (Ctrl+C).
If it crashes, run:

```powershell
# Remove all AirLink firewall rules manually
netsh advfirewall firewall show rule name=all | Select-String "AirLink"
# Delete them
netsh advfirewall firewall delete rule name="AirLink_Block_192_168_137_X"
```

