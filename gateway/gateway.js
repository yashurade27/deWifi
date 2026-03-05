/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 * â•‘              AirLink Local Gateway Server (Windows)                  â•‘
 * â•‘                                                                    â•‘
 * â•‘  This script runs on the WiFi OWNER'S laptop and:                  â•‘
 * â•‘  1. Starts an HTTP server that acts as a captive portal gateway    â•‘
 * â•‘  2. Intercepts requests from hotspot-connected devices             â•‘
 * â•‘  3. Redirects unauthenticated devices to the captive portal page   â•‘
 * â•‘  4. Manages Windows Firewall rules to allow/block internet access  â•‘
 * â•‘  5. Periodically validates sessions against the backend API        â•‘
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *
 * PREREQUISITES:
 *   - Windows Mobile Hotspot enabled (Settings â†’ Network â†’ Mobile Hotspot)
 *   - Run this script as ADMINISTRATOR (required for firewall rules)
 *   - Backend server running at BACKEND_URL
 *
 * USAGE:
 *   node gateway.js --spot <SPOT_ID> [--port 8080] [--backend http://localhost:3000]
 */

const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// File shared with dns-redirect.js to sync authenticated IPs
const AUTH_IPS_FILE = path.join(__dirname, ".authenticated-ips.json");

function syncAuthenticatedIPs() {
    try {
        const ips = Array.from(authenticatedClients.entries())
            .filter(([, s]) => s.expiresAt > new Date())
            .map(([ip]) => ip);
        fs.writeFileSync(AUTH_IPS_FILE, JSON.stringify(ips));
    } catch (e) {
        // Ignore file write errors
    }
}

// â”€â”€â”€ Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Parse command-line args
const args = process.argv.slice(2);
function getArg(flag, defaultVal) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const SPOT_ID = getArg("--spot", process.env.SPOT_ID || "");
const GATEWAY_PORT = parseInt(getArg("--port", process.env.GATEWAY_PORT || "8080"), 10);
const BACKEND_URL = getArg("--backend", process.env.BACKEND_URL || "http://localhost:3000");
const PORTAL_URL = getArg("--portal", process.env.PORTAL_URL || "http://localhost:5173");
const HOTSPOT_INTERFACE = getArg("--interface", process.env.HOTSPOT_INTERFACE || "");
const SESSION_CHECK_INTERVAL = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute

if (!SPOT_ID) {
    console.error("â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
    console.error("â•‘  ERROR: --spot <SPOT_ID> is required                      â•‘");
    console.error("â•‘                                                           â•‘");
    console.error("â•‘  Usage:                                                   â•‘");
    console.error("â•‘    node gateway.js --spot 6789abc123def456                â•‘");
    console.error("â•‘                                                           â•‘");
    console.error("â•‘  Get your Spot ID from the Owner Dashboard on AirLink      â•‘");
    console.error("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
    process.exit(1);
}

// â”€â”€â”€ In-Memory State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Map of authenticated client IPs -> session data
 * { "192.168.137.5": { sessionToken, expiresAt, authenticatedAt } }
 */
const authenticatedClients = new Map();

/**
 * Set of IPs that have been blocked via Windows Firewall
 * We track these so we can clean up on shutdown
 */
const blockedIPs = new Set();

/**
 * Set of IPs allowed via firewall (rules created)
 */
const allowedIPs = new Set();

// â”€â”€â”€ Windows Firewall Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function runCmd(command) {
    return new Promise((resolve, reject) => {
        exec(command, { shell: "powershell.exe" }, (error, stdout, stderr) => {
            if (error) {
                // Some firewall commands fail silently (e.g., rule already exists), that's ok
                resolve({ stdout, stderr, error: error.message });
            } else {
                resolve({ stdout, stderr, error: null });
            }
        });
    });
}

/**
 * Get the name of the Mobile Hotspot network interface.
 * On Windows, it's usually "Local Area Connection* X" or similar.
 */
async function getHotspotInterface() {
    if (HOTSPOT_INTERFACE) return HOTSPOT_INTERFACE;

    const result = await runCmd(
        `Get-NetAdapter | Where-Object { $_.InterfaceDescription -like '*Microsoft Wi-Fi Direct Virtual*' -or $_.Name -like '*Local Area Connection*' } | Select-Object -First 1 -ExpandProperty Name`
    );

    const iface = result.stdout.trim();
    if (iface) {
        console.log(`  Detected hotspot interface: "${iface}"`);
        return iface;
    }

    // Fallback: try to find any active virtual adapter
    const fallback = await runCmd(
        `Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -like '*Virtual*' } | Select-Object -First 1 -ExpandProperty Name`
    );

    return fallback.stdout.trim() || "Local Area Connection* 1";
}

/**
 * Block internet access for a specific IP on the hotspot.
 * Creates an INBOUND Windows Firewall rule to drop packets arriving from that
 * client IP on the hotspot interface.  "Inbound" is correct because, from the
 * Windows machine's perspective, traffic that originates from a hotspot client
 * and is destined for the internet arrives *inbound* on the hotspot adapter
 * before being NAT-forwarded outward.
 */
async function blockIP(ip) {
    const ruleName = `AirLink_Block_${ip.replace(/\./g, "_")}`;
    // Remove any stale rule first to avoid duplicates
    await runCmd(`netsh advfirewall firewall delete rule name="${ruleName}"`);
    await runCmd(
        `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=block remoteip=${ip} enable=yes`
    );
    blockedIPs.add(ip);
    console.log(`  ðŸš« Blocked: ${ip}`);
}

/**
 * Allow internet access for an authenticated IP.
 * 1. Removes any block rule for this IP.
 * 2. Adds an explicit INBOUND ALLOW rule so that even if a default-block
 *    policy is later applied to the hotspot interface, this client stays open.
 */
async function allowIP(ip) {
    const blockRule = `AirLink_Block_${ip.replace(/\./g, "_")}`;
    const allowRule = `AirLink_Allow_${ip.replace(/\./g, "_")}`;

    // Remove any existing block rule for this IP
    await runCmd(`netsh advfirewall firewall delete rule name="${blockRule}"`);

    // Remove any stale allow rule first to avoid duplicates
    await runCmd(`netsh advfirewall firewall delete rule name="${allowRule}"`);

    // Add an explicit inbound allow rule
    await runCmd(
        `netsh advfirewall firewall add rule name="${allowRule}" dir=in action=allow remoteip=${ip} enable=yes`
    );

    blockedIPs.delete(ip);
    allowedIPs.add(ip);
    console.log(`  âœ… Allowed: ${ip}`);
}

/**
 * Apply default-block policy: clean up any stale AirLink rules from a previous
 * run.  We use individual rule-name deletes (safe) rather than bulk deletes.
 */
async function setupDefaultBlock(hotspotInterface) {
    // Delete stale block/allow rules by name pattern using PowerShell.
    // We do NOT call `delete rule name=all` because that removes ALL system rules.
    await runCmd(
        `(netsh advfirewall firewall show rule name=all) -split '\r?\n' | ` +
        `Where-Object { $_ -match 'Rule Name:' -and $_ -match 'AirLink_' } | ` +
        `ForEach-Object { $n = ($_ -replace '.*Rule Name:\\s*', '').Trim(); netsh advfirewall firewall delete rule name="$n" }`
    );
    console.log("  Cleaned up stale AirLink firewall rules");
}

/**
 * Clean up ALL AirLink firewall rules. Called on shutdown.
 */
async function cleanupFirewallRules() {
    console.log("\nðŸ§¹ Cleaning up firewall rules...");

    // Remove all AirLink_Block_* rules
    for (const ip of blockedIPs) {
        const ruleName = `AirLink_Block_${ip.replace(/\./g, "_")}`;
        await runCmd(`netsh advfirewall firewall delete rule name="${ruleName}"`);
    }

    // Remove all AirLink_Allow_* rules
    for (const ip of allowedIPs) {
        const ruleName = `AirLink_Allow_${ip.replace(/\./g, "_")}`;
        await runCmd(`netsh advfirewall firewall delete rule name="${ruleName}"`);
    }

    console.log("  âœ… All AirLink firewall rules removed");
}

// â”€â”€â”€ Backend API Communication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Validate an access token against the backend.
 * Returns session data if valid.
 */
async function validateTokenWithBackend(accessToken, otp) {
    try {
        const fetch = (await import("node-fetch")).default;
        const res = await fetch(`${BACKEND_URL}/api/captive/authenticate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                spotId: SPOT_ID,
                accessToken: accessToken || undefined,
                otp: otp || undefined,
            }),
        });
        return await res.json();
    } catch (err) {
        console.error("  âŒ Backend communication failed:", err.message);
        return { success: false, message: "Cannot reach backend server" };
    }
}

/**
 * Validate an existing session token against the backend.
 */
async function validateSessionWithBackend(sessionToken) {
    try {
        const fetch = (await import("node-fetch")).default;
        const res = await fetch(`${BACKEND_URL}/api/captive/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken, spotId: SPOT_ID }),
        });
        return await res.json();
    } catch (err) {
        return { success: false, authenticated: false };
    }
}

/**
 * Disconnect a session on the backend.
 */
async function disconnectSessionOnBackend(sessionToken) {
    try {
        const fetch = (await import("node-fetch")).default;
        await fetch(`${BACKEND_URL}/api/captive/disconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken }),
        });
    } catch (err) {
        // Ignore disconnect errors
    }
}

// â”€â”€â”€ Express Gateway Server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const app = express();

// CORS â€” allow the React frontend (any origin) to call gateway endpoints
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve a minimal static portal page for devices that can't reach the frontend
app.use("/portal-assets", express.static(path.join(__dirname, "portal-assets")));

/**
 * GET / â€” Captive portal detection.
 * When a device connects to the hotspot and opens a browser,
 * the OS sends probe requests (Apple: /hotspot-detect.html, Android: /generate_204, etc.)
 * We intercept ALL requests and check if the client IP is authenticated.
 */

// Standard captive portal detection URLs
const CAPTIVE_DETECT_PATHS = [
    "/hotspot-detect.html",        // Apple/iOS
    "/library/test/success.html",  // Apple macOS
    "/generate_204",               // Android/Chrome
    "/gen_204",                    // Android alt
    "/ncsi.txt",                   // Windows NCSI
    "/connecttest.txt",            // Windows 10+
    "/redirect",                   // Firefox
    "/success.txt",                // Firefox alt
    "/canonical.html",             // HTC
];

// Middleware: extract client IP
app.use((req, res, next) => {
    // Get the real client IP from the hotspot subnet
    req.clientIP = req.ip || req.socket.remoteAddress || "";
    // Normalize IPv6-mapped IPv4
    if (req.clientIP.startsWith("::ffff:")) {
        req.clientIP = req.clientIP.slice(7);
    }
    next();
});

// â”€â”€â”€ Portal Authentication Endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// This is the LOCAL endpoint that devices post to for authentication.
// It proxies the request to the backend and manages firewall rules.

app.post("/api/gateway/authenticate", async (req, res) => {
    const { accessToken, otp } = req.body;
    const clientIP = req.clientIP;

    console.log(`\nðŸ”‘ Auth attempt from ${clientIP}`, { accessToken: accessToken ? "***" : "", otp: otp ? "***" : "" });

    if (!accessToken && !otp) {
        return res.status(400).json({
            success: false,
            message: "Access token or OTP required",
        });
    }

    // Validate with backend
    const result = await validateTokenWithBackend(accessToken, otp);

    if (result.success && result.sessionToken) {
        // Store authenticated client
        authenticatedClients.set(clientIP, {
            sessionToken: result.sessionToken,
            expiresAt: new Date(result.expiresAt),
            authenticatedAt: new Date(),
        });

        // Allow this IP through the firewall
        await allowIP(clientIP);
        syncAuthenticatedIPs();

        console.log(`  âœ… Authenticated: ${clientIP} (expires: ${result.expiresAt})`);

        res.json({
            success: true,
            message: "Connected! You now have internet access.",
            sessionToken: result.sessionToken,   // forwarded so the React portal can use it
            expiresAt: result.expiresAt,
            spot: result.spot,
            deviceInfo: result.deviceInfo,
        });
    } else {
        console.log(`  âŒ Auth failed for ${clientIP}: ${result.message}`);
        // Ensure they're blocked
        await blockIP(clientIP);

        res.status(401).json({
            success: false,
            message: result.message || "Invalid access token",
            errorCode: result.errorCode,
        });
    }
});

// â”€â”€â”€ Register Session (called by React CaptivePortal after backend auth) â”€â”€â”€â”€
// The React captive portal authenticates with the backend directly.
// This endpoint lets it also notify the gateway so the IP gets whitelisted.
app.post("/api/gateway/register-session", async (req, res) => {
    const { sessionToken } = req.body;
    const clientIP = req.clientIP;

    if (!sessionToken) {
        return res.status(400).json({ success: false, message: "Session token required" });
    }

    // Validate the session token with the backend
    const result = await validateSessionWithBackend(sessionToken);

    if (result.authenticated) {
        // Store authenticated client and allow through firewall
        authenticatedClients.set(clientIP, {
            sessionToken,
            expiresAt: new Date(result.expiresAt),
            authenticatedAt: new Date(),
        });
        await allowIP(clientIP);
        syncAuthenticatedIPs();

        console.log(`  âœ… Registered via React portal: ${clientIP} (expires: ${result.expiresAt})`);
        res.json({ success: true, message: "Device registered with gateway" });
    } else {
        console.log(`  âŒ Register-session rejected for ${clientIP}: invalid session`);
        res.status(401).json({ success: false, message: "Invalid session token" });
    }
});

// â”€â”€â”€ Session Status Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/gateway/status", (req, res) => {
    const clientIP = req.clientIP;
    const session = authenticatedClients.get(clientIP);

    if (session && session.expiresAt > new Date()) {
        const timeRemaining = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
        res.json({
            authenticated: true,
            timeRemaining,
            expiresAt: session.expiresAt,
        });
    } else {
        res.json({ authenticated: false });
    }
});

// â”€â”€â”€ Spot Info Endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Proxies spot metadata from the backend to clients that have no internet.
// Clients on the captive portal hotspot call this so the React portal can
// render spot details and unblock auto-authentication.

app.get("/api/gateway/spot-info", async (req, res) => {
    try {
        const fetch = (await import("node-fetch")).default;
        const r = await fetch(`${BACKEND_URL}/api/captive/detect/${SPOT_ID}`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await r.json();
        res.json(data);
    } catch (err) {
        console.error("  âš ï¸  spot-info: backend unreachable, returning placeholder");
        // Return a minimal placeholder so the portal form still renders
        res.json({
            authenticated: false,
            spot: { id: SPOT_ID, name: "AirLink Hotspot", address: "Local hotspot" },
        });
    }
});

// â”€â”€â”€ Disconnect Endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.post("/api/gateway/disconnect", async (req, res) => {
    const clientIP = req.clientIP;
    const session = authenticatedClients.get(clientIP);

    if (session) {
        await disconnectSessionOnBackend(session.sessionToken);
        authenticatedClients.delete(clientIP);
        await blockIP(clientIP);
        syncAuthenticatedIPs();
        console.log(`  ðŸ“´ Disconnected: ${clientIP}`);
    }

    res.json({ success: true, message: "Disconnected" });
});

// â”€â”€â”€ Captive Portal Detection & Redirect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Handle all standard captive portal probe URLs
CAPTIVE_DETECT_PATHS.forEach((detectPath) => {
    app.get(detectPath, (req, res) => {
        const clientIP = req.clientIP;
        const session = authenticatedClients.get(clientIP);

        if (session && session.expiresAt > new Date()) {
            // Client is authenticated â€” return success response
            // This tells the OS "you have internet, no captive portal"
            if (detectPath.includes("generate_204") || detectPath.includes("gen_204")) {
                return res.status(204).send();
            }
            if (detectPath.includes("ncsi.txt")) {
                return res.send("Microsoft NCSI");
            }
            if (detectPath.includes("connecttest.txt")) {
                return res.send("Microsoft Connect Test");
            }
            if (detectPath.includes("success")) {
                return res.send("<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>");
            }
            return res.send("OK");
        }

        // Not authenticated â€” redirect to the LOCAL gateway portal (HTTP).
        // We deliberately do NOT redirect to the ngrok HTTPS URL here because
        // the phone has no internet yet and cannot reach ngrok.  More importantly,
        // a page served over HTTPS cannot make fetch() calls to an HTTP endpoint
        // (Mixed Content policy), so auth would silently fail.  Serving from the
        // gateway itself keeps everything on HTTP with no cross-origin issues.
        const gatewayIP = (req.socket.localAddress || '192.168.137.1').replace('::ffff:', '');
        const localUrl = `http://${gatewayIP}:${GATEWAY_PORT}/`;
        console.log(`  ðŸ”„ Redirecting ${clientIP} â†’ local portal ${localUrl}`);
        res.redirect(302, localUrl);
    });
});

// â”€â”€â”€ Catch-All: Redirect unauthenticated to portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("*", (req, res) => {
    const clientIP = req.clientIP;
    const session = authenticatedClients.get(clientIP);

    // If authenticated and session valid, let them through (proxy or pass)
    if (session && session.expiresAt > new Date()) {
        // For the gateway, we don't actually proxy web traffic.
        // Internet access is handled at the firewall level.
        // If they're hitting the gateway directly, serve a status page.
        return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>AirLink - Connected</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #1e3a5f, #2d1b69); color: white; }
          .card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; }
          .check { font-size: 48px; margin-bottom: 16px; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 0; opacity: 0.8; font-size: 14px; }
          .timer { font-family: monospace; font-size: 32px; margin: 20px 0; }
        </style>
        </head>
        <body>
          <div class="card">
            <div class="check">âœ…</div>
            <h1>You're Connected!</h1>
            <p>Internet access is active</p>
            <div class="timer" id="timer"></div>
            <p>Session expires at ${session.expiresAt.toLocaleTimeString()}</p>
          </div>
          <script>
            function updateTimer() {
              const exp = new Date("${session.expiresAt.toISOString()}").getTime();
              const now = Date.now();
              const diff = Math.max(0, Math.floor((exp - now) / 1000));
              const h = Math.floor(diff / 3600);
              const m = Math.floor((diff % 3600) / 60);
              const s = diff % 60;
              document.getElementById("timer").textContent = 
                h.toString().padStart(2,"0") + ":" + m.toString().padStart(2,"0") + ":" + s.toString().padStart(2,"0");
              if (diff <= 0) { location.reload(); }
              else { setTimeout(updateTimer, 1000); }
            }
            updateTimer();
          </script>
        </body>
      </html>
    `);
    }

    // Not authenticated â€” serve the inline portal (everything stays HTTP,
    // no Mixed Content issues, works even when the phone has no internet).
    // URL parameters:
    //   ?token=XXX  â€” pre-fill the access token (used when booking email link
    //                  redirected here with the token already in the URL)
    const urlToken = (req.query.token || '').toString().toUpperCase().substring(0, 16);
    const gatewayIP = (req.socket.localAddress || '192.168.137.1').replace('::ffff:', '');
    const sessionPortalUrl = `${PORTAL_URL}/portal?spot=${SPOT_ID}`;

    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AirLink - Connect to WiFi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e3a5f 0%, #2d1b69 100%); padding: 16px; }
          .container { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 40px; max-width: 420px; width: 100%; color: white; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
          .shield { text-align: center; margin-bottom: 24px; }
          .shield-icon { width: 72px; height: 72px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 36px; }
          h1 { text-align: center; font-size: 26px; font-weight: 700; margin-bottom: 4px; }
          .subtitle { text-align: center; opacity: 0.7; font-size: 14px; margin-bottom: 28px; }
          .tabs { display: flex; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 4px; margin-bottom: 24px; }
          .tab { flex: 1; padding: 10px; text-align: center; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
          .tab.active { background: #3b82f6; }
          .tab:not(.active):hover { background: rgba(255,255,255,0.1); }
          label { display: block; font-size: 13px; opacity: 0.8; margin-bottom: 6px; }
          input { width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: white; font-size: 20px; font-family: monospace; text-align: center; letter-spacing: 4px; outline: none; text-transform: uppercase; }
          input::placeholder { color: rgba(255,255,255,0.3); text-transform: none; letter-spacing: normal; font-size: 14px; }
          input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.3); }
          .hint { font-size: 11px; opacity: 0.5; text-align: center; margin-top: 6px; }
          .btn { width: 100%; padding: 16px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .btn:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); border-radius: 10px; padding: 14px 16px; font-size: 13px; margin-bottom: 16px; display: none; color: #fca5a5; }
          .success-card { display: none; text-align: center; padding: 8px 0; }
          .success-icon { font-size: 52px; margin-bottom: 12px; }
          .success-title { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #4ade80; }
          .success-msg { font-size: 13px; opacity: 0.7; margin-bottom: 20px; }
          .timer-box { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 20px; }
          .timer-label { font-size: 12px; opacity: 0.6; margin-bottom: 4px; }
          .timer-value { font-family: monospace; font-size: 32px; font-weight: 700; color: #4ade80; }
          .open-btn { display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.15); border-radius: 10px; font-size: 14px; color: white; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); }
          .footer { text-align: center; margin-top: 24px; font-size: 12px; opacity: 0.5; }
          .link { color: #60a5fa; text-decoration: underline; }
          .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          #otpSection { display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="shield">
            <div class="shield-icon">ðŸ›œ</div>
            <h1>AirLink Portal</h1>
            <p class="subtitle">Enter your booking credentials to connect</p>
          </div>

          <div id="errorMsg" class="error"></div>

          <!-- â”€â”€ Login form â”€â”€ -->
          <div id="loginSection">
            <form id="authForm">
              <div class="tabs">
                <div class="tab active" id="tabToken" onclick="switchTab('token')">Access Token</div>
                <div class="tab" id="tabOtp" onclick="switchTab('otp')">OTP Code</div>
              </div>

              <div id="tokenSection">
                <label>Access Token</label>
                <input type="text" id="tokenInput" placeholder="Enter your 16-character token"
                       maxlength="16" autocomplete="off" value="${urlToken}" />
                <p class="hint">Find this in your booking confirmation email</p>
              </div>

              <div id="otpSection">
                <label>OTP Code</label>
                <input type="text" id="otpInput" placeholder="Enter 6-digit OTP"
                       maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
              </div>

              <button type="submit" class="btn" id="submitBtn">
                <span>ðŸ“¶</span> Connect to WiFi
              </button>
            </form>
          </div>

          <!-- â”€â”€ Success view (shown after auth) â”€â”€ -->
          <div id="successSection" class="success-card">
            <div class="success-icon">âœ…</div>
            <div class="success-title">Connected!</div>
            <p class="success-msg">Internet access is now active.</p>
            <div class="timer-box">
              <div class="timer-label">Time remaining</div>
              <div class="timer-value" id="countdown">--:--:--</div>
            </div>
            <a id="sessionLink" href="${sessionPortalUrl}" class="open-btn">ðŸ“Š View session details</a>
          </div>

          <div class="footer">
            Don't have a booking? <a href="${PORTAL_URL}/book/${SPOT_ID}" class="link">Book now</a>
            &nbsp;Â·&nbsp; Secured by AirLink
          </div>
        </div>

        <script>
          let mode = 'token';
          let expiresAt = null;
          let countdownInterval = null;

          // Auto-focus: if token was pre-filled, focus the submit button instead
          window.addEventListener('DOMContentLoaded', function() {
            const tok = document.getElementById('tokenInput');
            if (tok.value.length > 0) {
              document.getElementById('submitBtn').focus();
            } else {
              tok.focus();
            }
          });

          function switchTab(newMode) {
            mode = newMode;
            document.getElementById('tabToken').classList.toggle('active', mode === 'token');
            document.getElementById('tabOtp').classList.toggle('active', mode === 'otp');
            document.getElementById('tokenSection').style.display = mode === 'token' ? 'block' : 'none';
            document.getElementById('otpSection').style.display = mode === 'otp' ? 'block' : 'none';
            document.getElementById(mode === 'token' ? 'tokenInput' : 'otpInput').focus();
          }

          document.getElementById('tokenInput').addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          });
          document.getElementById('otpInput').addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\\D/g, '');
          });

          function startCountdown(expIso) {
            expiresAt = new Date(expIso).getTime();
            function tick() {
              const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
              const h = Math.floor(diff / 3600).toString().padStart(2, '0');
              const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
              const s = (diff % 60).toString().padStart(2, '0');
              document.getElementById('countdown').textContent = h + ':' + m + ':' + s;
              if (diff <= 0) {
                clearInterval(countdownInterval);
                document.getElementById('countdown').textContent = '00:00:00';
                document.getElementById('successSection').innerHTML =
                  '<div class="success-icon">â°</div><div class="success-title" style="color:#f87171">Session Expired</div><p class="success-msg">Reload the page to authenticate again.</p>';
              }
            }
            tick();
            countdownInterval = setInterval(tick, 1000);
          }

          function showSuccess(data) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('errorMsg').style.display = 'none';
            document.getElementById('successSection').style.display = 'block';
            if (data.expiresAt) startCountdown(data.expiresAt);
            // After 4 s open the full session page on the React portal
            // (user now has internet so ngrok is reachable)
            if ('${sessionPortalUrl}') {
              setTimeout(function() {
                window.location.href = '${sessionPortalUrl}';
              }, 4000);
            }
          }

          document.getElementById('authForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const errorDiv = document.getElementById('errorMsg');
            errorDiv.style.display = 'none';
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span>&nbsp; Authenticating...';

            const body = {};
            if (mode === 'token') {
              body.accessToken = document.getElementById('tokenInput').value.trim();
              if (!body.accessToken) {
                errorDiv.textContent = 'Please enter your access token.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span>ðŸ“¶</span> Connect to WiFi';
                return;
              }
            } else {
              body.otp = document.getElementById('otpInput').value.trim();
              if (body.otp.length < 6) {
                errorDiv.textContent = 'Please enter a 6-digit OTP.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span>ðŸ“¶</span> Connect to WiFi';
                return;
              }
            }

            try {
              const res = await fetch('/api/gateway/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              const data = await res.json();

              if (data.success) {
                showSuccess(data);
              } else {
                errorDiv.textContent = data.message || 'Authentication failed. Please check your token.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span>ðŸ“¶</span> Connect to WiFi';
              }
            } catch (err) {
              errorDiv.textContent = 'Could not reach the gateway. Make sure you are connected to this WiFi hotspot.';
              errorDiv.style.display = 'block';
              btn.disabled = false;
              btn.innerHTML = '<span>ðŸ“¶</span> Connect to WiFi';
            }
          });
        </script>
      </body>
    </html>
  `);
});

// â”€â”€â”€ Session Validation Loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Periodically check all active sessions.
 * Revoke access for expired sessions.
 */
async function validateAllSessions() {
    const now = new Date();

    for (const [ip, session] of authenticatedClients.entries()) {
        // Check local expiry first
        if (session.expiresAt <= now) {
            console.log(`  â° Session expired for ${ip}`);
            authenticatedClients.delete(ip);
            await blockIP(ip);
            await disconnectSessionOnBackend(session.sessionToken);
            continue;
        }

        // Validate with backend (less frequently to reduce load)
        const result = await validateSessionWithBackend(session.sessionToken);
        if (!result.authenticated) {
            console.log(`  ðŸš« Session invalidated by backend for ${ip}: ${result.message || "unknown reason"}`);
            authenticatedClients.delete(ip);
            await blockIP(ip);
            syncAuthenticatedIPs();
        }
    }
}

// â”€â”€â”€ Cleanup expired sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function cleanupExpired() {
    const now = new Date();
    let cleaned = 0;
    for (const [ip, session] of authenticatedClients.entries()) {
        if (session.expiresAt <= now) {
            authenticatedClients.delete(ip);
            await blockIP(ip);
            await disconnectSessionOnBackend(session.sessionToken);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        syncAuthenticatedIPs();
        console.log(`  ðŸ§¹ Cleaned ${cleaned} expired session(s)`);
    }
}

// â”€â”€â”€ Connected Clients Monitor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function showConnectedClients() {
    const result = await runCmd(
        `Get-NetNeighbor -AddressFamily IPv4 | Where-Object { $_.State -eq 'Reachable' -or $_.State -eq 'Stale' } | Select-Object IPAddress, LinkLayerAddress, State | Format-Table -AutoSize | Out-String`
    );
    return result.stdout;
}

// â”€â”€â”€ Startup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function start() {
    console.log("â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
    console.log("â•‘           AirLink Local Gateway Server v1.0                  â•‘");
    console.log("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
    console.log("");
    console.log(`  ðŸ“¡ Spot ID:    ${SPOT_ID}`);
    console.log(`  ðŸŒ Backend:    ${BACKEND_URL}`);
    console.log(`  ðŸ–¥ï¸  Portal:     ${PORTAL_URL}`);
    console.log(`  ðŸ”Œ Port:       ${GATEWAY_PORT}`);
    console.log("");

    // Detect hotspot interface
    const hotspotIface = await getHotspotInterface();
    console.log(`  ðŸ“¶ Hotspot Interface: ${hotspotIface}`);

    // Setup firewall defaults
    await setupDefaultBlock(hotspotIface);

    // Start express server
    const server = app.listen(GATEWAY_PORT, "0.0.0.0", () => {
        console.log("");
        console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        console.log(`  âœ… Gateway running at http://0.0.0.0:${GATEWAY_PORT}`);
        console.log("");
        console.log("  ðŸ“± SETUP INSTRUCTIONS:");
        console.log("  1. Enable Mobile Hotspot in Windows Settings");
        console.log("  2. Set your router's DHCP to point DNS to this laptop's IP");
        console.log("     OR tell users to navigate to http://192.168.137.1:" + GATEWAY_PORT);
        console.log("  3. Devices connecting to the hotspot will see the captive portal");
        console.log("  4. Users enter their Access Token or OTP to get internet access");
        console.log("");
        console.log("  âŒ¨ï¸  Press Ctrl+C to stop the gateway and clean up firewall rules");
        console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
    });

    server.on("error", async (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`\nâŒ Port ${GATEWAY_PORT} is already in use.`);
            console.error("   Killing the stale process and retrying in 2s...\n");
            await runCmd(
                `Get-NetTCPConnection -LocalPort ${GATEWAY_PORT} -State Listen -ErrorAction SilentlyContinue |` +
                ` Select-Object -ExpandProperty OwningProcess |` +
                ` ForEach-Object { Stop-Process -Id $_ -Force }`
            );
            setTimeout(() => server.listen(GATEWAY_PORT, "0.0.0.0"), 2000);
        } else {
            console.error("Server error:", err);
            process.exit(1);
        }
    });

    // Start periodic session validation
    setInterval(validateAllSessions, SESSION_CHECK_INTERVAL);
    setInterval(cleanupExpired, CLEANUP_INTERVAL);
}

// â”€â”€â”€ Graceful Shutdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function shutdown() {
    console.log("\n\nðŸ›‘ Shutting down gateway...");

    // Disconnect all sessions on backend
    for (const [ip, session] of authenticatedClients.entries()) {
        await disconnectSessionOnBackend(session.sessionToken);
        console.log(`  Disconnected ${ip}`);
    }

    // Clean up firewall rules
    await cleanupFirewallRules();

    // Clean up auth IPs file
    try { fs.unlinkSync(AUTH_IPS_FILE); } catch { }

    console.log("  âœ… Gateway stopped. All rules cleaned up.");
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", async (err) => {
    console.error("Uncaught exception:", err);
    await cleanupFirewallRules();
    process.exit(1);
});

// Start the gateway
start().catch(console.error);

