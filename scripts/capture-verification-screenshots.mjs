import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { WebSocket } from "ws";

globalThis.WebSocket = WebSocket;

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const ARTIFACT_DIR =
  "/Users/mac/.gemini/antigravity/brain/bf07d8bb-b9f0-4c32-9938-2cac80cf84aa";

async function getAdminCookies() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const { data: linkData, error: linkErr } = await sbAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: "casjournaladmin@gmail.com",
  });
  if (linkErr) throw linkErr;

  const token_hash = linkData.properties.hashed_token;
  const { data: verifyData, error: verifyErr } = await sbAnon.auth.verifyOtp({
    token_hash,
    type: "magiclink",
  });
  if (verifyErr) throw verifyErr;

  const savedCookies = [];
  const ssr = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return savedCookies;
        },
        setAll(toSet) {
          savedCookies.push(...toSet);
        },
      },
    },
  );
  await ssr.auth.setSession(verifyData.session);
  return savedCookies;
}

function launchChrome(debuggingPort = 9333) {
  const chromePath =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const proc = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${debuggingPort}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/cas-chrome-test-profile-9333",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  return proc;
}

async function waitForCdp(port = 9333, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const json = await res.json();
        return json.webSocketDebuggerUrl;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Could not connect to Chrome CDP");
}

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.callbacks = new Map();

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) cb.reject(new Error(msg.error.message));
        else cb.resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function run() {
  console.log("Preparing Supabase Super Admin session...");
  const adminCookies = await getAdminCookies();
  console.log("Got cookies:", adminCookies.map((c) => c.name));

  console.log("Launching headless Chrome...");
  const chromeProc = launchChrome(9333);

  try {
    const wsUrl = await waitForCdp(9333);
    console.log("Connected to Chrome CDP:", wsUrl);

    // Connect to the page target
    const listRes = await fetch("http://127.0.0.1:9333/json/list");
    const pages = await listRes.json();
    const page = pages.find((p) => p.type === "page") || pages[0];
    const pageWsUrl = page.webSocketDebuggerUrl;

    const ws = new WebSocket(pageWsUrl);
    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    const cdp = new CdpClient(ws);

    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Runtime.enable");

    // 1. Capture Login (Desktop 1440x900)
    console.log("Capturing 1. Login Desktop...");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 2000));
    const loginDesktop = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await fs.writeFile(
      path.join(ARTIFACT_DIR, "after-login.png"),
      Buffer.from(loginDesktop.data, "base64"),
    );
    console.log("Saved after-login.png");

    // 2. Capture Login (Mobile 390x844)
    console.log("Capturing 2. Login Mobile...");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await cdp.send("Page.navigate", { url: "http://localhost:3000/login" });
    await new Promise((r) => setTimeout(r, 1500));
    const loginMobile = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await fs.writeFile(
      path.join(ARTIFACT_DIR, "after-login-mobile.png"),
      Buffer.from(loginMobile.data, "base64"),
    );
    console.log("Saved after-login-mobile.png");

    // Reset to Desktop for Admin
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    // Set cookies for admin
    for (const cookie of adminCookies) {
      await cdp.send("Network.setCookie", {
        name: cookie.name,
        value: cookie.value,
        domain: "localhost",
        path: "/",
        httpOnly: cookie.options?.httpOnly ?? true,
        sameSite: "Lax",
      });
    }

    // 3. Capture Admin (Light Theme)
    console.log("Capturing 3. Admin Overview (Light Theme)...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin" });
    await new Promise((r) => setTimeout(r, 2500));
    await cdp.send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('app-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      `,
    });
    await new Promise((r) => setTimeout(r, 500));
    const adminLight = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await fs.writeFile(
      path.join(ARTIFACT_DIR, "after-admin-light.png"),
      Buffer.from(adminLight.data, "base64"),
    );
    console.log("Saved after-admin-light.png");

    // 4. Capture Admin (Dark Theme)
    console.log("Capturing 4. Admin Overview (Dark Theme)...");
    await cdp.send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('app-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
    const adminDark = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await fs.writeFile(
      path.join(ARTIFACT_DIR, "after-admin-dark.png"),
      Buffer.from(adminDark.data, "base64"),
    );
    console.log("Saved after-admin-dark.png");

    // 5. Capture Public Landing Page (Light Theme)
    console.log("Capturing 5. Public Landing Page...");
    await cdp.send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('app-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      `,
    });
    await cdp.send("Page.navigate", { url: "http://localhost:3000/" });
    await new Promise((r) => setTimeout(r, 2000));
    const publicLight = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await fs.writeFile(
      path.join(ARTIFACT_DIR, "after-public-light.png"),
      Buffer.from(publicLight.data, "base64"),
    );
    console.log("Saved after-public-light.png");

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
