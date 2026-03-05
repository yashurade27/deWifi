/**
 * â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
 * â•‘         AirLink DNS Redirect Server                                  â•‘
 * â•‘                                                                    â•‘
 * â•‘  A simple DNS server that redirects ALL DNS queries to the         â•‘
 * â•‘  gateway IP. This makes the captive portal appear automatically    â•‘
 * â•‘  when users open ANY website on their browser.                      â•‘
 * â•‘                                                                    â•‘
 * â•‘  MUST BE RUN AS ADMINISTRATOR (binds to port 53)                   â•‘
 * â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *
 * HOW IT WORKS:
 *   1. Runs a UDP DNS server on port 53
 *   2. For unauthenticated clients: resolves ALL domains to the gateway IP
 *   3. For authenticated clients: forwards DNS to the real DNS server (8.8.8.8)
 *   4. This causes the browser to hit the gateway server, which shows the portal
 *
 * USAGE:
 *   node dns-redirect.js [--gateway-ip 192.168.137.1] [--real-dns 8.8.8.8]
 *
 * AFTER STARTING:
 *   Configure the Mobile Hotspot's DHCP to use THIS computer's IP as DNS:
 *   netsh interface ip set dns "Local Area Connection* X" static 192.168.137.1
 */

const dgram = require("dgram");

// Parse args
const args = process.argv.slice(2);
function getArg(flag, defaultVal) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const GATEWAY_IP = getArg("--gateway-ip", "192.168.137.1");
const REAL_DNS = getArg("--real-dns", "8.8.8.8");
const DNS_PORT = 53;

// Share authenticated clients map with gateway via a simple file-based approach
// In production, you'd use IPC or shared memory
const AUTH_FILE = require("path").join(__dirname, ".authenticated-ips.json");
const fs = require("fs");

function getAuthenticatedIPs() {
    try {
        if (fs.existsSync(AUTH_FILE)) {
            return JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
        }
    } catch { }
    return [];
}

/**
 * Parse a DNS query packet (simplified).
 * Returns the domain name being queried.
 */
function parseDNSQuery(msg) {
    try {
        // DNS header is 12 bytes
        // Question section starts at byte 12
        let offset = 12;
        const labels = [];

        while (offset < msg.length) {
            const len = msg[offset];
            if (len === 0) break;
            offset++;
            labels.push(msg.slice(offset, offset + len).toString("ascii"));
            offset += len;
        }

        return labels.join(".");
    } catch {
        return "unknown";
    }
}

/**
 * Build a DNS response that resolves to the gateway IP.
 * This is a minimal DNS response.
 */
function buildRedirectResponse(query, gatewayIP) {
    const response = Buffer.alloc(query.length + 16);

    // Copy the query
    query.copy(response);

    // Set response flags
    response[2] = 0x81; // QR=1 (response), RD=1
    response[3] = 0x80; // RA=1

    // Set answer count to 1
    response[6] = 0x00;
    response[7] = 0x01;

    // Append answer section
    const answerOffset = query.length;

    // Name pointer to question
    response[answerOffset] = 0xc0;
    response[answerOffset + 1] = 0x0c;

    // Type A (1)
    response[answerOffset + 2] = 0x00;
    response[answerOffset + 3] = 0x01;

    // Class IN (1)
    response[answerOffset + 4] = 0x00;
    response[answerOffset + 5] = 0x01;

    // TTL (5 seconds â€” short so it doesn't cache)
    response[answerOffset + 6] = 0x00;
    response[answerOffset + 7] = 0x00;
    response[answerOffset + 8] = 0x00;
    response[answerOffset + 9] = 0x05;

    // Data length (4 bytes for IPv4)
    response[answerOffset + 10] = 0x00;
    response[answerOffset + 11] = 0x04;

    // IP address
    const ipParts = gatewayIP.split(".").map(Number);
    response[answerOffset + 12] = ipParts[0];
    response[answerOffset + 13] = ipParts[1];
    response[answerOffset + 14] = ipParts[2];
    response[answerOffset + 15] = ipParts[3];

    return response.slice(0, answerOffset + 16);
}

/**
 * Forward a DNS query to the real DNS server and return the response.
 */
function forwardDNS(query) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket("udp4");
        const timeout = setTimeout(() => {
            client.close();
            reject(new Error("DNS forward timeout"));
        }, 3000);

        client.on("message", (msg) => {
            clearTimeout(timeout);
            client.close();
            resolve(msg);
        });

        client.on("error", (err) => {
            clearTimeout(timeout);
            client.close();
            reject(err);
        });

        client.send(query, DNS_PORT, REAL_DNS);
    });
}

// â”€â”€â”€ DNS Server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const server = dgram.createSocket("udp4");

server.on("message", async (msg, rinfo) => {
    const domain = parseDNSQuery(msg);
    const clientIP = rinfo.address;

    // Check if this client is authenticated
    const authenticatedIPs = getAuthenticatedIPs();

    if (authenticatedIPs.includes(clientIP)) {
        // Forward to real DNS
        try {
            const response = await forwardDNS(msg);
            server.send(response, rinfo.port, rinfo.address);
        } catch {
            // If forward fails, redirect anyway
            const redirect = buildRedirectResponse(msg, GATEWAY_IP);
            server.send(redirect, rinfo.port, rinfo.address);
        }
    } else {
        // Redirect to gateway (captive portal)
        // Allow certain domains through for the portal to work
        const allowedDomains = ["localhost", "captive.apple.com", "connectivitycheck.gstatic.com"];
        const shouldAllow = allowedDomains.some((d) => domain.includes(d));

        if (shouldAllow) {
            try {
                const response = await forwardDNS(msg);
                server.send(response, rinfo.port, rinfo.address);
            } catch {
                const redirect = buildRedirectResponse(msg, GATEWAY_IP);
                server.send(redirect, rinfo.port, rinfo.address);
            }
        } else {
            // Redirect to gateway IP
            const redirect = buildRedirectResponse(msg, GATEWAY_IP);
            server.send(redirect, rinfo.port, rinfo.address);
            console.log(`  ðŸ”„ ${clientIP} â†’ ${domain} â†’ ${GATEWAY_IP} (portal)`);
        }
    }
});

server.on("error", (err) => {
    console.error("DNS server error:", err);
    if (err.code === "EACCES") {
        console.error("\nâŒ Permission denied! Port 53 requires Administrator privileges.");
        console.error("   Right-click PowerShell â†’ 'Run as Administrator' â†’ try again");
    }
    server.close();
});

server.bind(DNS_PORT, "0.0.0.0", () => {
    console.log("â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
    console.log("â•‘           AirLink DNS Redirect Server                        â•‘");
    console.log("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
    console.log("");
    console.log(`  ðŸŒ DNS server running on port ${DNS_PORT}`);
    console.log(`  ðŸ“ Redirecting to: ${GATEWAY_IP}`);
    console.log(`  ðŸ”€ Real DNS: ${REAL_DNS}`);
    console.log("");
    console.log("  All DNS queries from unauthenticated devices will resolve to");
    console.log(`  the gateway IP (${GATEWAY_IP}), triggering the captive portal.`);
    console.log("");
    console.log("  âŒ¨ï¸  Press Ctrl+C to stop");
    console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
});

