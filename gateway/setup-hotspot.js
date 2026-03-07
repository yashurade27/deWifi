/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║         AirLink Hotspot Setup Script (Windows)                       ║
 * ║                                                                    ║
 * ║  Sets up the Windows Mobile Hotspot and configures DNS redirect    ║
 * ║  so connected devices are directed to the captive portal.          ║
 * ║                                                                    ║
 * ║  MUST BE RUN AS ADMINISTRATOR                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

const { exec } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

function run(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { shell: "powershell.exe" }, (error, stdout, stderr) => {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim(), error });
        });
    });
}

async function checkAdmin() {
    const res = await run(
        `([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)`
    );
    return res.stdout === "True";
}

async function getHotspotStatus() {
    const res = await run(
        `(Get-NetAdapter | Where-Object { $_.InterfaceDescription -like '*Microsoft Wi-Fi Direct Virtual*' }).Status`
    );
    return res.stdout;
}

async function getHotspotIP() {
    const res = await run(
        `(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*Local Area Connection*' }).IPAddress`
    );
    return res.stdout || "192.168.137.1";
}

async function getInternetAdapter() {
    const res = await run(
        `Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notlike '*Virtual*' -and $_.InterfaceDescription -notlike '*Loopback*' } | Select-Object -First 1 -ExpandProperty Name`
    );
    return res.stdout;
}

/**
 * Configure Windows Mobile Hotspot SSID and password via WinRT / PowerShell.
 * Windows Mobile Hotspot CANNOT be open/passwordless — WPA2-PSK is mandatory.
 * The correct captive-portal approach: share the password openly at the venue;
 * actual internet access is gated by the captive portal, not the WiFi key.
 */
async function configureHotspot(ssid, password) {
    // Load System.Runtime.WindowsRuntime.dll first so [System.WindowsRuntimeSystemExtensions]
    // and WinRT namespace types are available in the PowerShell session.
    const psScript = `
try {
    $winRtDll = [System.IO.Path]::Combine(
        [System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory(),
        'System.Runtime.WindowsRuntime.dll')
    [System.Reflection.Assembly]::LoadFrom($winRtDll) | Out-Null

    # Load WinRT namespaces
    [void][Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType=WindowsRuntime]
    [void][Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]

    # Helper: wrap IAsyncAction as a .NET Task and wait for it
    function AwaitAction($winRtTask) {
        $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
            Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
                           $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } |
            Select-Object -First 1)
        if (-not $asTask) { throw 'AsTask(IAsyncAction) method not found' }
        $netTask = $asTask.Invoke($null, @($winRtTask))
        $netTask.Wait(-1) | Out-Null
    }

    $profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
    if (-not $profile) { throw 'No active internet connection found' }

    $manager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile)
    $cfg = $manager.GetCurrentAccessPointConfiguration()
    $cfg.Ssid = '${ssid}'
    $cfg.Passphrase = '${password}'
    AwaitAction($manager.ConfigureAccessPointAsync($cfg))
    Write-Host 'OK'
} catch {
    Write-Host "ERR: $($_.Exception.Message)"
}
`;
    const res = await run(psScript);
    if (res.stdout.trim().startsWith('OK')) return { ok: true };

    // ── Fallback: registry edit (Windows 10 1703+ / Windows 11) ─────────────
    const regScript = `
try {
    $path = 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\icssvc\\Settings'
    if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
    Set-ItemProperty -Path $path -Name 'HotspotSsid'       -Value '${ssid}'     -Type String
    Set-ItemProperty -Path $path -Name 'HotspotPassPhrase' -Value '${password}' -Type String
    Restart-Service -Name icssvc -ErrorAction SilentlyContinue
    Write-Host 'OK'
} catch {
    Write-Host "ERR: $($_.Exception.Message)"
}
`;
    const regRes = await run(regScript);
    if (regRes.stdout.trim().startsWith('OK')) return { ok: true };

    // ── Final fallback: open Mobile Hotspot settings page ────────────────────
    await run(`Start-Process 'ms-settings:network-mobilehotspot'`);
    return {
        ok: false,
        error: res.stdout.replace('ERR: ', '').trim() || res.stderr || 'WinRT unavailable',
    };
}

async function main() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║            AirLink Hotspot Setup Wizard                      ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("  ℹ️  NOTE: Windows Mobile Hotspot requires a WPA2 password (min 8 chars).");
    console.log("     An 'open' (password-less) hotspot is NOT possible on Windows.");
    console.log("     The solution: use a simple, publicly-posted password.");
    console.log("     Internet access is controlled by the captive portal — not the WiFi key.");
    console.log("");

    // Check admin
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        console.error("❌ This script must be run as Administrator!");
        console.error("   Right-click PowerShell → 'Run as Administrator' → try again");
        rl.close();
        process.exit(1);
    }
    console.log("✅ Running as Administrator");

    // Get spot ID
    const spotId = await ask("\n📡 Enter your WiFi Spot ID (from Owner Dashboard): ");
    if (!spotId.trim()) {
        console.error("❌ Spot ID is required");
        rl.close();
        process.exit(1);
    }

    // ── Configure hotspot SSID & password ────────────────────────────────
    console.log("\n📶 Hotspot Configuration");
    console.log("   The WiFi password can be shared publicly — internet is portal-gated.");
    const ssidAnswer = await ask("   Hotspot SSID / name     (default: AirLink-Hotspot): ");
    const ssid = ssidAnswer.trim() || "AirLink-Hotspot";
    const passAnswer = await ask("   Hotspot password min 8  (default: AirLink123): ");
    const password = passAnswer.trim() || "AirLink123";

    if (password.length < 8) {
        console.error("\n❌ Password must be at least 8 characters (Windows WPA2 requirement)");
        rl.close();
        process.exit(1);
    }

    process.stdout.write("   Applying hotspot settings...");
    const hsResult = await configureHotspot(ssid, password);
    if (hsResult.ok) {
        console.log(` ✅  SSID: "${ssid}"  Password: "${password}"`);
    } else {
        console.log(" ⚠️  Auto-configure failed: " + (hsResult.error || "unknown"));
        console.log("");
        console.log("   Set it manually instead:");
        console.log("   1. Win + I  →  Network & Internet  →  Mobile Hotspot");
        console.log("   2. Click Edit  →  enter the values below and Save:");
        console.log(`      Network name : ${ssid}`);
        console.log(`      Password     : ${password}`);
        console.log("");
        await ask("   Press Enter once you've configured it manually...");
    }

    // ── Check hotspot is ON ───────────────────────────────────────────────
    console.log("\n📶 Checking Mobile Hotspot...");
    const hotspotStatus = await getHotspotStatus();

    if (hotspotStatus !== "Up") {
        console.log("⚠️  Mobile Hotspot is not switched on.");
        console.log("");
        console.log("   Please enable it:");
        console.log("   1. Open Windows Settings (Win + I)");
        console.log("   2. Go to Network & Internet → Mobile Hotspot");
        console.log("   3. Toggle 'Share my internet connection' ON");
        console.log("");
        const proceed = await ask("Have you enabled Mobile Hotspot? (y/n): ");
        if (proceed.toLowerCase() !== "y") {
            console.log("Please enable Mobile Hotspot first, then run this script again.");
            rl.close();
            process.exit(0);
        }
    } else {
        console.log("✅ Mobile Hotspot is active");
    }

    // Get hotspot IP
    const hotspotIP = await getHotspotIP();
    console.log(`📍 Hotspot IP: ${hotspotIP}`);

    // Get internet adapter
    const internetAdapter = await getInternetAdapter();
    console.log(`🌐 Internet adapter: ${internetAdapter}`);

    // Determine port
    const portAnswer = await ask("\n🔌 Gateway port (default: 8080): ");
    const port = portAnswer.trim() || "8080";

    // Backend URL
    const backendAnswer = await ask("🖥️  Backend URL (default: http://localhost:3000): ");
    const backendUrl = backendAnswer.trim() || "http://localhost:3000";

    // Portal URL
    const portalAnswer = await ask("🌐 Frontend URL (default: http://localhost:5173): ");
    const portalUrl = portalAnswer.trim() || "http://localhost:5173";

    // Create a .env file for the gateway
    const fs = require("fs");
    const envContent = `SPOT_ID=${spotId.trim()}
GATEWAY_PORT=${port}
BACKEND_URL=${backendUrl}
PORTAL_URL=${portalUrl}
`;

    fs.writeFileSync(`${__dirname}/.env`, envContent);
    console.log("\n✅ Configuration saved to gateway/.env");

    // Summary
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  SETUP COMPLETE! Here's what to do next:");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");
    console.log("  1. Make sure your backend is running:");
    console.log(`     cd backend && npm run dev`);
    console.log("");
    console.log("  2. Make sure your frontend is running:");
    console.log(`     cd frontend && npm run dev`);
    console.log("");
    console.log("  3. Start the gateway (in a NEW admin PowerShell):");
    console.log(`     cd gateway && node gateway.js --spot ${spotId.trim()}`);
    console.log("");
    console.log("  4. Display your WiFi credentials at your spot:");
    console.log(`     📶  WiFi name : ${ssid}`);
    console.log(`     🔑  Password  : ${password}`);
    console.log("     (Share the password openly — internet is gated by the portal)");
    console.log("");
    console.log("  5. Tell users to:");
    console.log(`     a. Connect to WiFi: "${ssid}"  password: "${password}"`);
    console.log(`     b. A captive portal page will open automatically`);
    console.log(`        OR open browser and go to: http://${hotspotIP}:${port}`);
    console.log(`     c. Enter their Access Token or OTP to unlock internet`);
    console.log("");
    console.log("  💡 TIP: Also run dns-redirect.js (as Admin) to make the portal");
    console.log("     pop up automatically when users open any page:");
    console.log(`     node dns-redirect.js --gateway-ip ${hotspotIP}`);
    console.log("");
    console.log("═══════════════════════════════════════════════════════════════");

    rl.close();
}

main().catch((err) => {
    console.error("Setup error:", err);
    rl.close();
    process.exit(1);
});

