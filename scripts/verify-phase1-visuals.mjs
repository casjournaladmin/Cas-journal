import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { WebSocket } from "ws";

const ARTIFACT_DIR =
  "/Users/mac/.gemini/antigravity/brain/86b4d169-6959-4948-9518-f6691f527afb";

function launchChrome(debuggingPort = 9444) {
  const chromePath =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${debuggingPort}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/cas-chrome-phase1-profile",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
}

async function waitForCdp(port = 9444, maxRetries = 30) {
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
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
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

async function capture(cdp, url, outPath, { width = 1280, height = 900, isMobile = false } = {}) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
  });

  await cdp.send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 1500));

  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });

  const buffer = Buffer.from(screenshot.data, "base64");
  await fs.writeFile(outPath, buffer);
  console.log(`Saved screenshot: ${path.basename(outPath)} (${width}x${height})`);
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const chromeProc = launchChrome(9444);
  await waitForCdp(9444);

  const listRes = await fetch("http://127.0.0.1:9444/json/list");
  const pages = await listRes.json();
  const page = pages.find((p) => p.type === "page") || pages[0];
  const pageWsUrl = page.webSocketDebuggerUrl;

  const ws = new WebSocket(pageWsUrl);
  await new Promise((res) => ws.once("open", res));
  const cdp = new CdpClient(ws);

  await cdp.send("Page.enable");

  const baseUrl = "http://localhost:3000";

  console.log("Capturing Phase 1 verification views...");

  // 1. Homepage desktop & mobile
  await capture(cdp, `${baseUrl}/#journals`, path.join(ARTIFACT_DIR, "01_homepage_journals_desktop.png"), { width: 1280, height: 900 });
  await capture(cdp, `${baseUrl}/#journals`, path.join(ARTIFACT_DIR, "01_homepage_journals_mobile.png"), { width: 390, height: 844, isMobile: true });

  // 2. POLIS landing page desktop & mobile
  await capture(cdp, `${baseUrl}/journals/polis`, path.join(ARTIFACT_DIR, "02_polis_landing_desktop.png"), { width: 1280, height: 950 });
  await capture(cdp, `${baseUrl}/journals/polis`, path.join(ARTIFACT_DIR, "02_polis_landing_mobile.png"), { width: 390, height: 844, isMobile: true });

  // 3. EXISTENTIA, CJMR, IZU landing pages
  await capture(cdp, `${baseUrl}/journals/existentia`, path.join(ARTIFACT_DIR, "03_existentia_landing_desktop.png"), { width: 1280, height: 950 });
  await capture(cdp, `${baseUrl}/journals/cjmr`, path.join(ARTIFACT_DIR, "04_cjmr_landing_desktop.png"), { width: 1280, height: 950 });
  await capture(cdp, `${baseUrl}/journals/izu`, path.join(ARTIFACT_DIR, "05_izu_landing_desktop.png"), { width: 1280, height: 950 });

  // 4. Current Issue pages
  await capture(cdp, `${baseUrl}/current-issue?journal=polis`, path.join(ARTIFACT_DIR, "06_current_issue_polis.png"), { width: 1280, height: 850 });
  await capture(cdp, `${baseUrl}/current-issue?journal=cjmr`, path.join(ARTIFACT_DIR, "07_current_issue_cjmr.png"), { width: 1280, height: 850 });

  // 5. Announcements with no cross-journal selector
  await capture(cdp, `${baseUrl}/announcements?journal=polis`, path.join(ARTIFACT_DIR, "08_announcements_polis_no_selector.png"), { width: 1280, height: 850 });

  // 6. Archives with no cross-journal selector
  await capture(cdp, `${baseUrl}/archives?journal=polis`, path.join(ARTIFACT_DIR, "09_archives_polis_no_selector.png"), { width: 1280, height: 850 });

  // 7. Main Archives page with preserved selector
  await capture(cdp, `${baseUrl}/archives`, path.join(ARTIFACT_DIR, "10_archives_main_with_selector.png"), { width: 1280, height: 850 });

  ws.close();
  chromeProc.kill();
  console.log("All Phase 1 screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
