import { useEffect, useRef, useState, type CSSProperties } from "react";
import { hero } from "@/content";
import { useFinePointer, useReducedMotion } from "@/hooks";

import cloudMask from "@/assets/ebf4d.svg";
import moonMask from "@/assets/4b51f.svg";
import catMask from "@/assets/4c708.svg";
import performanceMask from "@/assets/fdfd3.svg";

import cloud480 from "@/assets/img/cloud-480.webp";
import cloud800 from "@/assets/img/cloud-800.webp";
import cloud1152 from "@/assets/img/cloud-1152.webp";
import moon480 from "@/assets/img/moon-480.webp";
import moon864 from "@/assets/img/moon-864.webp";
import cat480 from "@/assets/img/cat-480.webp";
import cat800 from "@/assets/img/cat-800.webp";
import cat1152 from "@/assets/img/cat-1152.webp";
import perf480 from "@/assets/img/performance-480.webp";
import perf864 from "@/assets/img/performance-864.webp";
import portrait560 from "@/assets/img/portrait-560.webp";
import portrait928 from "@/assets/img/portrait-928.webp";

type Rect = [x: number, y: number, w: number, h: number];

type Fragment = {
  id: string;
  caption: string;
  /** Read by screen readers via the reveal button. */
  description: string;
  srcSet: string;
  src: string;
  mask: string;
  /** Resting opacity before attention. */
  opacity: number;
  /** Desktop: photo box in the 1440 canvas, and the visible window inside it. */
  box: Rect;
  window: Rect;
  /** Mobile: window position in the 390 canvas; the photo box is derived to keep the same crop. */
  mobileWindow: [x: number, y: number, w: number];
  captionSide: "below" | "above";
  mobileCaptionSide: "below" | "above";
  eager?: boolean;
};

/* Coordinates come from the Figma export (canvas origin = below the masthead, y − 130). */
const FRAGMENTS: Fragment[] = [
  {
    id: "cloud",
    caption: "PINK CLOUD",
    description: "Photo fragment: a pink-lit cloud against a blue evening sky.",
    srcSet: `${cloud480} 480w, ${cloud800} 800w, ${cloud1152} 1152w`,
    src: cloud800,
    mask: cloudMask,
    opacity: 1,
    box: [120, 80, 420, 560],
    window: [60, 140, 340, 170],
    mobileWindow: [10, 105, 150],
    captionSide: "below",
    mobileCaptionSide: "below",
    eager: true,
  },
  {
    id: "moon",
    caption: "MOON",
    description: "Photo fragment: a low orange moon above a city street at dusk.",
    srcSet: `${moon480} 480w, ${moon864} 864w`,
    src: moon480,
    mask: moonMask,
    opacity: 0.35,
    box: [883, 305, 240, 426],
    window: [132, 135, 56, 150],
    mobileWindow: [344, 245, 30],
    captionSide: "above",
    mobileCaptionSide: "above",
  },
  {
    id: "cat",
    caption: "CAT",
    description: "Photo fragment: a small black cat on the pavement beside a long shadow.",
    srcSet: `${cat480} 480w, ${cat800} 800w, ${cat1152} 1152w`,
    src: cat480,
    mask: catMask,
    opacity: 0.3,
    box: [325, 645, 280, 373],
    window: [60, 100, 94, 160],
    mobileWindow: [36, 505, 52],
    captionSide: "below",
    mobileCaptionSide: "below",
  },
  {
    id: "performance",
    caption: "LIVE",
    description: "Photo fragment: a singer performing on a smoky, blue-lit stage.",
    srcSet: `${perf480} 480w, ${perf864} 864w`,
    src: perf480,
    mask: performanceMask,
    opacity: 0.25,
    box: [770, 610, 380, 675],
    window: [180, 270, 170, 64],
    mobileWindow: [226, 560, 104],
    captionSide: "below",
    mobileCaptionSide: "below",
  },
];

function fragmentStyle(f: Fragment): CSSProperties {
  const [bx, by, bw, bh] = f.box;
  const [ox, oy, ww, wh] = f.window;
  const [mwx, mwy, mww] = f.mobileWindow;
  const s = mww / ww; // mobile scale, keeps the same crop of the photo
  const vars: Record<string, string | number> = {
    "--x": bx, "--y": by, "--w": bw, "--h": bh,
    "--ox": ox, "--oy": oy, "--ww": ww, "--wh": wh,
    "--mx": mwx - ox * s, "--my": mwy - oy * s, "--mw": bw * s, "--mh": bh * s,
    "--mox": ox * s, "--moy": oy * s, "--mww": mww, "--mwh": wh * s,
    "--o": f.opacity,
  };
  return vars as CSSProperties;
}

/** CSS vars for an element in the scaled canvas: desktop [x,y,w?,h?,fs?] and mobile counterpart. */
function place(d: (number | undefined)[], m: (number | undefined)[]): CSSProperties {
  const keys = ["x", "y", "w", "h", "fs"];
  const vars: Record<string, number> = {};
  keys.forEach((k, i) => {
    if (d[i] !== undefined) vars[`--${k}`] = d[i]!;
    if (m[i] !== undefined) vars[`--m${k}`] = m[i]!;
  });
  return vars as CSSProperties;
}

/** Map distance → attention intensity (1 = touching, 0 = far). */
const falloff = (d: number, radius: number) => Math.max(0, Math.min(1, 1 - d / radius)) ** 1.6;

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const reduced = useReducedMotion();
  const fine = useFinePointer();

  // Attention field: pointer proximity on mouse devices, the viewport's
  // centre line while scrolling on touch devices. Pinned (tapped / focused)
  // fragments stay fully revealed. Writes CSS vars directly — no re-render.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    const apply = () => {
      frame = 0;
      FRAGMENTS.forEach((f, idx) => {
        const el = groupRefs.current[idx];
        const hit = el?.querySelector<HTMLElement>(".frag-hit");
        if (!el || !hit) return;
        const r = hit.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let i = 0;
        if (fine && pointer) {
          // distance from the pointer to the window's edge, not centre
          const dx = Math.max(0, Math.abs(pointer.x - cx) - r.width / 2);
          const dy = Math.max(0, Math.abs(pointer.y - cy) - r.height / 2);
          i = falloff(Math.hypot(dx, dy), 240);
        } else if (!fine) {
          const line = window.innerHeight * 0.5;
          i = falloff(Math.abs(cy - line), window.innerHeight * 0.32);
        }
        if (pinnedRef.current[f.id]) i = 1;
        i = Math.round(i * 100) / 100;
        el.style.setProperty("--i", String(i));
        el.dataset.on = String(i >= 0.75);
      });
      if (fine && !reduced && pointer) {
        const rect = root.getBoundingClientRect();
        const px = ((pointer.x - rect.left) / rect.width) * 2 - 1;
        const py = ((pointer.y - rect.top) / Math.min(rect.height, window.innerHeight * 1.2)) * 2 - 1;
        root.style.setProperty("--px", (Math.max(-1, Math.min(1, px)) ).toFixed(3));
        root.style.setProperty("--py", (Math.max(-1, Math.min(1, py)) ).toFixed(3));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const onLeave = () => {
      pointer = null;
      root.style.setProperty("--px", "0");
      root.style.setProperty("--py", "0");
      schedule();
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [fine, reduced, pinned]);

  const setPin = (id: string, value: boolean) =>
    setPinned((p) => (p[id] === value ? p : { ...p, [id]: value }));

  return (
    <section
      ref={rootRef}
      aria-labelledby="hero-title"
      className="relative overflow-clip"
    >
      <h1 id="hero-title" className="sr-only">
        JOO JOO
      </h1>

      <div className="canvas hero-canvas">
        {/* In-page anchor for "01 ATTENTION": the fragment field. */}
        <div id="attention" className="cv scroll-mt-6" style={place([0, 150], [0, 70])} aria-hidden="true" />

        {/* Photo fragments — the photo sits behind the letters; its reveal
            control and caption sit above them (z-20) so they stay reachable. */}
        {FRAGMENTS.map((f, idx) => (
          <div
            key={f.id}
            ref={(el) => {
              groupRefs.current[idx] = el;
            }}
            className="frag-group contents"
            style={fragmentStyle(f)}
            data-on="false"
          >
            <div
              aria-hidden="true"
              className="cv frag drift"
              style={
                {
                  WebkitMaskImage: `url("${f.mask}")`,
                  maskImage: `url("${f.mask}")`,
                  "--depth": -4,
                } as CSSProperties
              }
            >
              <img
                alt=""
                src={f.src}
                srcSet={f.srcSet}
                sizes={`(min-width: 768px) ${Math.round((f.box[2] / 1440) * 100)}vw, ${Math.round(
                  ((f.box[2] * (f.mobileWindow[2] / f.window[2])) / 390) * 100,
                )}vw`}
                loading={f.eager ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
              />
            </div>
            <button
              type="button"
              className="frag-hit z-20"
              aria-label={f.description}
              aria-pressed={!!pinned[f.id]}
              onClick={() => setPin(f.id, !pinned[f.id])}
              onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) setPin(f.id, true);
              }}
              onBlur={() => setPin(f.id, false)}
            />
            <span
              aria-hidden="true"
              className="frag-cap z-20 bg-paper/90 px-1 text-[10px] leading-normal tracking-wide text-ink"
              data-side={f.captionSide}
              data-mside={f.mobileCaptionSide}
            >
              <span className="mr-1.5 inline-block size-1.5 bg-lime align-middle" />
              {f.caption}
            </span>
          </div>
        ))}

        {/* JOO — oversized type */}
        <p
          aria-hidden="true"
          className="cv cv-type drift pointer-events-none font-display leading-none font-extrabold whitespace-nowrap text-ink select-none"
          style={{ ...place([-180, 60, , , 270], [-100, 10, , , 140]), "--depth": -10 } as CSSProperties}
        >
          JOO
        </p>
        <p
          aria-hidden="true"
          className="cv cv-type drift pointer-events-none font-display leading-none font-extrabold whitespace-nowrap text-ink select-none"
          style={{ ...place([620, 490, , , 270], [60, 362, , , 140]), "--depth": -14 } as CSSProperties}
        >
          JOO
        </p>

        {/* Digital portrait */}
        <div className="cv pointer-events-none" style={place([520, 96, 520, 680], [95, 75, 250, 327])}>
          <img
            src={portrait928}
            srcSet={`${portrait560} 560w, ${portrait928} 928w`}
            sizes="(min-width: 768px) 36vw, 64vw"
            alt="Digital portrait of JOO: a 3D-rendered figure with short black hair and clear-framed glasses, wearing a black top."
            width={928}
            height={1152}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="tilt absolute inset-0 size-full max-w-none object-cover"
          />
        </div>

        {/* Tagline */}
        <div
          className="cv text-[12px] leading-[1.55] text-soft"
          style={place([690, 1010], [150, 668])}
        >
          {hero.tagline.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

      </div>
    </section>
  );
}
