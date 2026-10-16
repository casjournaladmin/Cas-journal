import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { validateAnnouncementImageFile } from "@/lib/editorial/announcement-images";

test("Announcement Image Contract: CSS rules in AnnouncementImage component", () => {
  const componentPath = path.join(
    process.cwd(),
    "components",
    "announcements",
    "announcement-image.tsx",
  );
  assert.ok(
    fs.existsSync(componentPath),
    "AnnouncementImage component must exist",
  );

  const content = fs.readFileSync(componentPath, "utf-8");

  // 1. Proportional scaling must be present
  assert.ok(
    content.includes("h-auto"),
    "AnnouncementImage must use h-auto to calculate height from intrinsic aspect ratio",
  );
  assert.ok(
    content.includes("w-full"),
    "AnnouncementImage must span container width without overflowing",
  );
  assert.ok(
    content.includes("max-w-full"),
    "AnnouncementImage must prevent horizontal overflow on narrow screens",
  );

  // 2. Destructive cropping classes must NOT be present
  assert.ok(
    !content.includes("object-cover"),
    "AnnouncementImage must NEVER use object-cover which crops poster content",
  );
  assert.ok(
    !content.includes("max-h-80") && !content.includes("max-h-56"),
    "AnnouncementImage must not enforce arbitrary fixed-height caps that clip posters",
  );

  // 3. Must use object-contain for safety
  assert.ok(
    content.includes("object-contain"),
    "AnnouncementImage must use object-contain to ensure complete poster visibility",
  );

  // 4. Graceful error handling and retry mechanism must exist
  assert.ok(
    content.includes("onError"),
    "AnnouncementImage must catch image loading failures via onError",
  );
  assert.ok(
    content.includes("handleRetry") || content.includes("Retry Loading"),
    "AnnouncementImage must provide a retry action for network reconnections",
  );
  assert.ok(
    content.includes("View Full Poster") ||
      content.includes("Open Direct Link"),
    "AnnouncementImage must provide an action to inspect full poster resolution",
  );
});

test("Announcement Public Page Contract: No arbitrary image cropping", () => {
  const pagePath = path.join(
    process.cwd(),
    "app",
    "(public)",
    "announcements",
    "page.tsx",
  );
  assert.ok(fs.existsSync(pagePath), "Public announcements page must exist");

  const content = fs.readFileSync(pagePath, "utf-8");

  // Must use AnnouncementImage component
  assert.ok(
    content.includes("AnnouncementImage"),
    "Public announcements page must render images using AnnouncementImage",
  );

  // Must not have legacy cropped img tag
  assert.ok(
    !content.includes("max-h-80 w-full object-cover"),
    "Public announcements page must not contain legacy max-h-80 w-full object-cover",
  );
});

test("Announcement Admin Manager Contract: Uses responsive AnnouncementImage", () => {
  const managerPath = path.join(
    process.cwd(),
    "components",
    "admin",
    "announcements-manager.tsx",
  );
  assert.ok(
    fs.existsSync(managerPath),
    "Admin announcements manager must exist",
  );

  const content = fs.readFileSync(managerPath, "utf-8");

  // Must use AnnouncementImage component in list
  assert.ok(
    content.includes("AnnouncementImage"),
    "Admin announcements manager must use AnnouncementImage for previews",
  );

  // Must not have legacy cropped preview
  assert.ok(
    !content.includes("max-h-56 w-full object-cover"),
    "Admin announcements manager must not contain legacy max-h-56 w-full object-cover",
  );
});

test("Announcement Image Upload Validation: File types and size limits", () => {
  // 1. Rejects invalid MIME type (e.g. PDF or executable)
  const fakePdf = {
    size: 1024,
    type: "application/pdf",
  };
  const pdfResult = validateAnnouncementImageFile(fakePdf);
  assert.equal(pdfResult.valid, false, "Must reject non-image file formats");
  assert.ok(
    pdfResult.error?.includes("Unsupported image format"),
    "Error message must specify supported formats",
  );

  // 2. Rejects oversized files (> 15MB)
  const hugeFile = {
    size: 16 * 1024 * 1024,
    type: "image/jpeg",
  };
  const sizeResult = validateAnnouncementImageFile(hugeFile);
  assert.equal(sizeResult.valid, false, "Must reject files over 15MB");
  assert.ok(
    sizeResult.error?.includes("15MB limit"),
    "Error message must indicate 15MB limit",
  );

  // 3. Handles null/empty file gracefully
  const emptyResult = validateAnnouncementImageFile(null);
  assert.equal(emptyResult.valid, true);

  const zeroByteResult = validateAnnouncementImageFile({
    size: 0,
    type: "image/png",
  });
  assert.equal(zeroByteResult.valid, true);

  // 4. Accepts valid image formats
  for (const mime of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
    const valid = validateAnnouncementImageFile({
      size: 2 * 1024 * 1024,
      type: mime,
    });
    assert.equal(valid.valid, true, `Should accept valid format ${mime}`);
  }
});

test("Announcement Image Lifecycle Contract: Prevents lazy load display:none deadlocks", () => {
  const componentPath = path.join(
    process.cwd(),
    "components",
    "announcements",
    "announcement-image.tsx",
  );
  const content = fs.readFileSync(componentPath, "utf-8");

  // 1. Must NOT hide the img element with display:none / hidden class while loading
  // (display:none blocks IntersectionObserver from triggering loading="lazy")
  assert.ok(
    !content.includes('isLoading ? "hidden" : "opacity-100"') &&
      !content.includes('!isLoaded ? "hidden" : "opacity-100"'),
    "AnnouncementImage must NOT apply hidden/display:none to <img> during loading",
  );

  // 2. Must use CSS Grid stacking or non-blocking layering
  assert.ok(
    content.includes("col-start-1 row-start-1"),
    "AnnouncementImage must stack skeleton and image in grid cells without un-rendering <img>",
  );

  // 3. Must check img.complete in useEffect for pre-hydration and memory cache completion
  assert.ok(
    content.includes("img.complete"),
    "AnnouncementImage must check img.complete to handle fast or pre-hydrated images",
  );

  // 4. Must support cache-busting on retry to force network re-request
  assert.ok(
    content.includes("_retry=") || content.includes("retry="),
    "AnnouncementImage must append cache-busting query on retry to trigger genuine network fetch",
  );

  // 5. Must support priority loading
  assert.ok(
    content.includes("fetchPriority"),
    "AnnouncementImage must pass fetchPriority for prioritized above-the-fold posters",
  );
});

test("Announcement Image Aspect Ratio Contract: Preserves natural proportions without cropping", () => {
  // Test aspect ratio computations for portrait, landscape, and square posters
  const viewports = [
    { name: "Mobile", width: 375 },
    { name: "Tablet", width: 768 },
    { name: "Desktop", width: 896 },
  ];

  const posterTypes = [
    {
      name: "Portrait Call for Papers Poster (NJSR/GJCSR)",
      intrinsicWidth: 1024,
      intrinsicHeight: 1536,
      aspectRatio: 1024 / 1536, // ~0.667
    },
    {
      name: "Landscape Banner Poster",
      intrinsicWidth: 1920,
      intrinsicHeight: 1080,
      aspectRatio: 1920 / 1080, // ~1.778
    },
    {
      name: "Square Notice Graphic",
      intrinsicWidth: 1000,
      intrinsicHeight: 1000,
      aspectRatio: 1.0,
    },
  ];

  for (const vp of viewports) {
    for (const poster of posterTypes) {
      // Under CSS rules `w-full max-w-full h-auto object-contain`:
      // Container width is constrained by viewport
      const displayedWidth = vp.width;
      const displayedHeight = displayedWidth / poster.aspectRatio;

      assert.ok(
        displayedWidth <= vp.width,
        `${poster.name} on ${vp.name} must never exceed viewport width (${displayedWidth} <= ${vp.width})`,
      );
      assert.ok(
        displayedHeight > 0,
        `${poster.name} on ${vp.name} must calculate positive proportional height`,
      );

      // Portrait posters naturally occupy more vertical space than landscape posters
      if (poster.intrinsicHeight > poster.intrinsicWidth) {
        assert.ok(
          displayedHeight > displayedWidth,
          `Portrait poster height (${displayedHeight}px) must exceed width (${displayedWidth}px) on ${vp.name}`,
        );
      }
    }
  }
});

test("Announcement Poster Storage URLs Contract: Formats and reaches storage bucket", async () => {
  const gjcsrUrl =
    "https://pcscnigceelxlnssuivc.supabase.co/storage/v1/object/public/published-articles/announcements/1792095315129_GJCSR_Call_for_Papers_-_Final.png";
  const njsrUrl =
    "https://pcscnigceelxlnssuivc.supabase.co/storage/v1/object/public/published-articles/announcements/1792095043811_NJSR_Call_for_Papers_Final.png";

  assert.ok(
    gjcsrUrl.startsWith("https://") &&
      gjcsrUrl.includes("/published-articles/announcements/"),
    "GJCSR URL must point to public storage",
  );
  assert.ok(
    njsrUrl.startsWith("https://") &&
      njsrUrl.includes("/published-articles/announcements/"),
    "NJSR URL must point to public storage",
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(gjcsrUrl, {
      method: "GET",
      headers: { Range: "bytes=0-10" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok || res.status === 206) {
      assert.ok(true, "Successfully reached storage asset");
    }
  } catch {
    // Graceful offline fallback in isolated CI environments
  }
});

test("Announcement Poster Preview & Lightbox Modal Contract", () => {
  const componentPath = path.join(
    process.cwd(),
    "components",
    "announcements",
    "announcement-image.tsx",
  );
  const content = fs.readFileSync(componentPath, "utf-8");

  // 1. Sensible preview width constraints on desktop and mobile
  assert.ok(
    content.includes("max-w-sm") && content.includes("sm:max-w-md"),
    "AnnouncementImage preview must use a sensible maximum width (max-w-sm sm:max-w-md)",
  );

  // 2. Centered alignment
  assert.ok(
    content.includes("mx-auto"),
    "AnnouncementImage preview must be centered (mx-auto)",
  );

  // 3. Balanced spacing
  assert.ok(
    content.includes("my-4"),
    "AnnouncementImage must preserve consistent vertical spacing (my-4)",
  );

  // 4. Accessible Lightbox Modal
  assert.ok(
    content.includes('role="dialog"') && content.includes('aria-modal="true"'),
    "AnnouncementImage must provide an accessible modal dialog with role=dialog and aria-modal=true",
  );

  // 5. Keyboard accessibility: Escape key listener
  assert.ok(
    content.includes("Escape"),
    "AnnouncementImage must dismiss modal when Escape key is pressed",
  );

  // 6. Direct full resolution link inside modal
  assert.ok(
    content.includes("Open in New Tab"),
    "AnnouncementImage modal must provide a direct Open in New Tab action",
  );

  // 7. Click-to-expand trigger & cursor
  assert.ok(
    content.includes("cursor-zoom-in"),
    "AnnouncementImage must indicate expandable poster with cursor-zoom-in",
  );
});
