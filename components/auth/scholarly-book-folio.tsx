"use client";

import { useSyncExternalStore, useRef, useState } from "react";

function getReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

/**
 * ScholarlyBookFolio
 *
 * An abstract, cinematic open-book form constructed entirely from light,
 * layered geometric planes, and translucent cyan/electric-blue facets.
 *
 * Characteristics:
 * - Floating geometric glass pages opening from a vertical central luminous spine.
 * - Layered translucent facet planes suggesting dimensional depth.
 * - Crisp cyan and icy-blue illuminated outer page edges.
 * - Central spine emitting a brilliant concentrated beam of blue-white light.
 * - Staggered manuscript lines of light across pages that progressively illuminate
 *   and glow when hovered/approached, as though living scholarship is being inscribed.
 * - Subtle floating breathing animation with pointer tilt response.
 * - Fully accessible and graceful under prefers-reduced-motion or touch devices.
 */
export function ScholarlyBookFolio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5, active: false });
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType === "touch") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPointer({ x, y, active: true });
  };

  const handlePointerLeave = () => {
    setPointer({ x: 0.5, y: 0.5, active: false });
  };

  // Dimensional tilt parameters
  const tiltX = pointer.active && !reducedMotion ? (pointer.y - 0.5) * -12 : 0;
  const tiltY = pointer.active && !reducedMotion ? (pointer.x - 0.5) * 16 : 0;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="group relative mx-auto w-full max-w-[340px] py-1 select-none sm:max-w-[390px]"
      aria-hidden="true"
    >
      {/* ── Dimensional Wrapper with Perspective ── */}
      <div
        className="relative aspect-[16/10] w-full"
        style={{
          transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: reducedMotion
            ? "none"
            : pointer.active
              ? "transform 0.15s ease-out"
              : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <svg
          viewBox="0 0 540 330"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full overflow-visible"
        >
          <defs>
            {/* Core blue-white nebula bloom behind the book */}
            <radialGradient
              id="folio-aura"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="48%"
            >
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#032b45" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#010c16" stopOpacity="0" />
            </radialGradient>

            {/* Cyan luminous spine glow */}
            <linearGradient id="spine-beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>

            {/* Left primary facet gradient (translucent crystalline electric blue) */}
            <linearGradient
              id="facet-left-primary"
              x1="0"
              y1="0"
              x2="1"
              y2="0.3"
            >
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
            </linearGradient>

            {/* Right primary facet gradient */}
            <linearGradient
              id="facet-right-primary"
              x1="1"
              y1="0"
              x2="0"
              y2="0.3"
            >
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
            </linearGradient>

            {/* Secondary underlying facet gradients for depth */}
            <linearGradient
              id="facet-left-secondary"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#075985" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient
              id="facet-right-secondary"
              x1="1"
              y1="0"
              x2="0"
              y2="0"
            >
              <stop offset="0%" stopColor="#075985" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
            </linearGradient>

            {/* Tertiary background facet for layered thickness */}
            <linearGradient id="facet-left-base" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#032b45" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="facet-right-base" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#032b45" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
            </linearGradient>

            {/* Glow filter for manuscript light lines */}
            <filter
              id="light-bloom"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Intense core laser beam filter */}
            <filter
              id="spine-bloom"
              x="-50%"
              y="-20%"
              width="200%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="4" result="glow" />
              <feGaussianBlur stdDeviation="1" result="core" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="core" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── 1. Celestial Backdrop & Radial Aura ── */}
          <ellipse
            cx="270"
            cy="165"
            rx="250"
            ry="125"
            fill="url(#folio-aura)"
          />

          {/* Concentric restrained orbital rings */}
          <ellipse
            cx="270"
            cy="168"
            rx="235"
            ry="75"
            stroke="rgba(56, 189, 248, 0.16)"
            strokeWidth="0.8"
            strokeDasharray="4 8"
            transform="rotate(-5 270 168)"
          />
          <ellipse
            cx="270"
            cy="168"
            rx="205"
            ry="60"
            stroke="rgba(14, 165, 233, 0.12)"
            strokeWidth="0.8"
            transform="rotate(6 270 168)"
          />

          {/* Ambient micro-particles / celestial nodes */}
          <circle cx="85" cy="115" r="1.5" fill="#38bdf8" opacity="0.6" />
          <circle cx="120" cy="72" r="1" fill="#ffffff" opacity="0.8" />
          <circle cx="435" cy="98" r="1.8" fill="#38bdf8" opacity="0.7" />
          <circle cx="475" cy="145" r="1.2" fill="#ffffff" opacity="0.6" />
          <circle cx="195" cy="50" r="1.2" fill="#bae6fd" opacity="0.75" />
          <circle cx="345" cy="45" r="1.5" fill="#38bdf8" opacity="0.7" />
          <circle
            cx="270"
            cy="40"
            r="2"
            fill="#ffffff"
            opacity="0.9"
            filter="url(#light-bloom)"
          />

          {/* ── 2. Layered Translucent Base Facets (Deep Layer) ── */}
          {/* Base Left Underlay */}
          <path
            d="M 52 228 C 110 236, 195 240, 266 248 L 266 98 C 195 90, 110 82, 52 74 Z"
            fill="url(#facet-left-base)"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth="0.75"
          />
          {/* Base Right Underlay */}
          <path
            d="M 488 228 C 430 236, 345 240, 274 248 L 274 98 C 345 90, 430 82, 488 74 Z"
            fill="url(#facet-right-base)"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth="0.75"
          />

          {/* ── 3. Middle Tier Facets (Floating Translucent Glass Planes) ── */}
          {/* Middle Left Folio Plane */}
          <path
            d="M 64 218 C 122 225, 202 230, 267 238 L 267 86 C 202 78, 122 70, 64 62 Z"
            fill="url(#facet-left-secondary)"
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth="1"
          />
          {/* Middle Right Folio Plane */}
          <path
            d="M 476 218 C 418 225, 338 230, 273 238 L 273 86 C 338 78, 418 70, 476 62 Z"
            fill="url(#facet-right-secondary)"
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth="1"
          />

          {/* ── 4. Forefront Primary Luminous Geometric Pages ── */}
          {/* Left Wing / Scholarly Page Plane */}
          <path
            d="M 76 208 C 134 215, 210 220, 268 228 L 268 74 C 210 66, 134 58, 76 50 Z"
            fill="url(#facet-left-primary)"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth="1.25"
          />
          {/* Right Wing / Scholarly Page Plane */}
          <path
            d="M 464 208 C 406 215, 330 220, 272 228 L 272 74 C 330 66, 406 58, 464 50 Z"
            fill="url(#facet-right-primary)"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth="1.25"
          />

          {/* Edge Glow Highlights (Icy-blue and White illuminated contour) */}
          <path
            d="M 76 50 C 134 58, 210 66, 268 74 L 272 74 C 330 66, 406 58, 464 50"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="1"
            filter="url(#light-bloom)"
          />
          <path
            d="M 76 50 L 76 208"
            stroke="rgba(56, 189, 248, 0.8)"
            strokeWidth="1.2"
          />
          <path
            d="M 464 50 L 464 208"
            stroke="rgba(56, 189, 248, 0.8)"
            strokeWidth="1.2"
          />

          {/* ── 5. Living Manuscript Light Lines (Progressively illuminate on hover) ── */}
          {/* Left Folio Manuscript Inscriptions */}
          <g className="transition-all duration-500 ease-out group-hover:opacity-100">
            {/* Title / Section Inscription Header */}
            <line
              x1="110"
              y1="82"
              x2="175"
              y2="89"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-40 transition-opacity duration-300 group-hover:opacity-90"
              filter="url(#light-bloom)"
            />
            <line
              x1="112"
              y1="98"
              x2="245"
              y2="112"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-30 transition-opacity duration-300 group-hover:opacity-85"
            />
            <line
              x1="114"
              y1="114"
              x2="240"
              y2="128"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25 transition-opacity duration-300 group-hover:opacity-80"
            />
            <line
              x1="116"
              y1="130"
              x2="235"
              y2="143"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25 transition-opacity duration-300 group-hover:opacity-80"
            />
            <line
              x1="118"
              y1="146"
              x2="220"
              y2="158"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-20 transition-opacity duration-300 group-hover:opacity-75"
            />

            {/* Paragraph Block 2 */}
            <line
              x1="120"
              y1="168"
              x2="242"
              y2="180"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25 transition-opacity duration-300 group-hover:opacity-80"
            />
            <line
              x1="122"
              y1="184"
              x2="215"
              y2="194"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-20 transition-opacity duration-300 group-hover:opacity-75"
            />
          </g>

          {/* Right Folio Manuscript Inscriptions */}
          <g className="transition-all duration-500 ease-out group-hover:opacity-100">
            {/* Title / Section Inscription Header */}
            <line
              x1="365"
              y1="89"
              x2="430"
              y2="82"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-40 transition-opacity duration-300 group-hover:opacity-90"
              filter="url(#light-bloom)"
            />
            <line
              x1="295"
              y1="112"
              x2="428"
              y2="98"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-30 transition-opacity duration-300 group-hover:opacity-85"
            />
            <line
              x1="300"
              y1="128"
              x2="426"
              y2="114"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25 transition-opacity duration-300 group-hover:opacity-80"
            />
            <line
              x1="305"
              y1="143"
              x2="424"
              y2="130"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25 transition-opacity duration-300 group-hover:opacity-80"
            />
            <line
              x1="320"
              y1="158"
              x2="422"
              y2="146"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-20 transition-opacity duration-300 group-hover:opacity-75"
            />

            {/* Paragraph Block 2 */}
            <line
              x1="298"
              y1="180"
              x2="420"
              y2="168"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25 transition-opacity duration-300 group-hover:opacity-80"
            />
            <line
              x1="325"
              y1="194"
              x2="418"
              y2="184"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-20 transition-opacity duration-300 group-hover:opacity-75"
            />
          </g>

          {/* ── 6. Central Concentrated Luminous Spine (Laser Beam of Light) ── */}
          <path
            d="M 268 62 L 272 62 L 272 242 L 268 242 Z"
            fill="url(#spine-beam)"
            filter="url(#spine-bloom)"
          />
          {/* Intense pure-white center line */}
          <line
            x1="270"
            y1="64"
            x2="270"
            y2="240"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            filter="url(#light-bloom)"
          />

          {/* Spine light crowns (top and bottom focal nodes) */}
          <circle
            cx="270"
            cy="66"
            r="3.5"
            fill="#ffffff"
            filter="url(#spine-bloom)"
          />
          <circle
            cx="270"
            cy="238"
            r="3"
            fill="#38bdf8"
            filter="url(#light-bloom)"
          />
        </svg>
      </div>
    </div>
  );
}
