import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { projects } from "@/content";
import { useFinePointer, useReducedMotion } from "@/hooks";

const N = projects.length;

/* Orbit "slots", clockwise from the selected (top) position. Each is an angle on
 * the ellipse and a radius factor, measured from the Figma export so the default
 * state reproduces the original placement. Items travel between slots along
 * the ellipse when the orbit rotates. */
const SLOT_ANGLES = [-90, -50.8, 36.5, 146, 217.8];
const SLOT_R_DESKTOP = [0.594, 1.165, 1.033, 1.223, 1.33];
const SLOT_R_MOBILE = [0.62, 1.12, 1.08, 1.08, 1.12];

type Geometry = {
  width: number;
  height: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  scale: number;
  mobile: boolean;
};

function geometryFor(width: number): Geometry {
  if (width >= 768) {
    const scale = Math.min(width, 1920) / 1440;
    const offset = (width - 1440 * scale) / 2;
    return {
      width,
      height: Math.max(765 * scale, 520),
      cx: offset + 720 * scale,
      cy: Math.max(382.5 * scale, 300),
      rx: 560 * scale,
      ry: Math.max(246.5 * scale, 170),
      scale,
      mobile: false,
    };
  }
  return { width, height: 580, cx: width / 2, cy: 300, rx: Math.max(width / 2 - 38, 100), ry: 195, scale: 1, mobile: true };
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Position of an item that is `p` slots (fractional) clockwise from the top. */
function slotPoint(p: number, g: Geometry) {
  const pos = mod(p, N);
  const k = Math.floor(pos);
  const t = pos - k;
  const a0 = SLOT_ANGLES[k];
  const a1 = k + 1 < N ? SLOT_ANGLES[k + 1] : SLOT_ANGLES[0] + 360;
  const R = g.mobile ? SLOT_R_MOBILE : SLOT_R_DESKTOP;
  const r = lerp(R[k], R[(k + 1) % N], t);
  const a = (lerp(a0, a1, t) * Math.PI) / 180;
  // closeness to the selected (top) slot: 1 at the top, 0 one slot away
  const focus = Math.max(0, 1 - Math.min(pos, N - pos));
  return { x: g.cx + Math.cos(a) * g.rx * r, y: g.cy + Math.sin(a) * g.ry * r, focus };
}

export default function Questions() {
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [geo, setGeo] = useState<Geometry>(() => geometryFor(typeof window === "undefined" ? 1440 : window.innerWidth));
  const [rot, setRot] = useState(0); // fractional rotation, in slots
  const rotRef = useRef(0);
  const anim = useRef(0);
  const drag = useRef<{ id: number; x: number; start: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const reduced = useReducedMotion();
  const fine = useFinePointer();

  const selected = mod(Math.round(rot), N);
  const project = projects[selected];

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setGeo(geometryFor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setRotation = (v: number) => {
    rotRef.current = v;
    setRot(v);
  };

  const animateTo = useCallback(
    (target: number) => {
      cancelAnimationFrame(anim.current);
      const from = rotRef.current;
      if (reduced || Math.abs(target - from) < 0.001) {
        setRotation(target);
        return;
      }
      const duration = 520 + 140 * Math.min(2, Math.abs(target - from));
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const e = 1 - Math.pow(1 - t, 3);
        setRotation(lerp(from, target, e));
        if (t < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    },
    [reduced],
  );
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  /** Rotate the shortest way so that project `i` reaches the top. */
  const select = (i: number) => {
    const current = Math.round(rotRef.current);
    let delta = mod(i - current, N);
    if (delta > N / 2) delta -= N;
    animateTo(current + delta);
  };

  // ── Drag / swipe to orbit ────────────────────────────────────────────
  const pxPerSlot = geo.mobile ? 110 : 190 * Math.max(geo.scale, 0.7);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(anim.current);
    drag.current = { id: e.pointerId, x: e.clientX, start: rotRef.current, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // dragging right carries the top item clockwise (to the right)
    if (d.moved) setRotation(d.start - dx / pxPerSlot);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) {
      setDragging(false);
      animateTo(Math.round(rotRef.current));
    }
  };
  // Suppress the click that ends a drag gesture.
  const onClickCapture = (e: MouseEvent) => {
    if (dragging) e.stopPropagation();
  };

  // ── Keyboard (radio group: arrows move + select) ──────────────────────
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = mod(selected + 1, N);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = mod(selected - 1, N);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = N - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    itemRefs.current[next]?.focus();
  };

  const questionSize = geo.mobile ? 24 : Math.max(26, 42 * geo.scale);
  const topSlot = slotPoint(0, geo);

  return (
    <section id="questions" aria-labelledby="questions-title" className="night relative overflow-clip bg-ink text-paper">
      <div className="absolute top-8 left-5 z-10 md:top-10 md:left-10">
        <h2 id="questions-title" className="text-[10px] leading-normal font-normal text-night-text">
          02 / QUESTIONS
        </h2>
        <div aria-hidden="true" className="mt-2 h-px w-20 bg-night-line" />
      </div>

      <div
        ref={stageRef}
        className="orbit-stage relative mx-auto w-full"
        style={{ height: geo.height }}
        data-dragging={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {/* Orbit path */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" width={geo.width} height={geo.height}>
          <ellipse
            cx={geo.cx}
            cy={geo.cy}
            rx={geo.rx}
            ry={geo.ry}
            fill="none"
            stroke="var(--color-orbit)"
            strokeWidth={1}
            strokeDasharray="3 10"
            strokeLinecap="butt"
          />
        </svg>

        {/* Central question for the selected project */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 text-center"
          style={{
            left: geo.cx,
            top: topSlot.y + (geo.mobile ? 30 : Math.max(50 * geo.scale, 34)),
            width: geo.mobile ? Math.min(geo.width - 64, 340) : Math.max(800 * geo.scale, 420),
          }}
        >
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-display leading-[1.2] font-bold text-balance text-paper"
            style={{ fontSize: questionSize }}
          >
            <span className="sr-only">{project.name}: </span>
            {project.question ?? project.name}
          </p>
          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto mt-6 inline-block text-[11px] text-night-text transition-colors hover:text-pink"
            >
              {/github\.com/.test(project.href) ? "VIEW ON GITHUB" : "OPEN PROJECT"} <span aria-hidden="true">↗</span>
              <span className="sr-only"> — {project.name} (opens in a new tab)</span>
            </a>
          )}
        </div>

        {/* Projects on the orbit */}
        <div role="radiogroup" aria-label="Projects" onKeyDown={onKeyDown}>
          {projects.map((p, i) => {
            const pt = slotPoint(i - rot, geo);
            const isSelected = i === selected;
            const showSub = !geo.mobile && !!p.question;
            // keep labels (and their questions) inside the stage
            const half = showSub ? 110 : 48;
            const pad = geo.mobile ? 12 : 40;
            const x = Math.min(Math.max(pt.x, half + pad), geo.width - half - pad);
            return (
              <button
                key={p.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(i)}
                className="group absolute flex flex-col items-center px-2 py-1.5 text-center"
                style={{
                  left: x,
                  top: pt.y,
                  transform: "translate(-50%, -14px)",
                  cursor: dragging ? "grabbing" : "pointer",
                }}
              >
                <span
                  className="bg-ink px-1 text-[12px] leading-normal whitespace-nowrap transition-colors"
                  style={{
                    color: pt.focus > 0.5 ? "var(--color-pink)" : "var(--color-night-text)",
                    fontSize: lerp(12, 10, pt.focus),
                  }}
                >
                  {p.name}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 h-px bg-pink"
                  style={{ width: 48 * pt.focus, opacity: pt.focus }}
                />
                {showSub && (
                  <span
                    className="mt-0.5 block w-[220px] bg-ink text-[10px] leading-[1.4] text-night-soft group-hover:text-night-text"
                    style={{ opacity: Math.max(0, 1 - pt.focus * 2), display: pt.focus > 0.5 ? "none" : undefined }}
                  >
                    {p.question}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p
          className="pointer-events-none absolute left-1/2 w-60 -translate-x-1/2 text-center text-[10px] leading-normal text-night-text"
          style={{ top: geo.mobile ? geo.height - 48 : geo.height - 68 * Math.max(geo.scale, 0.75) }}
        >
          <span aria-hidden="true">{fine ? "DRAG TO ORBIT" : "SWIPE OR TAP TO ORBIT"}</span>
          <span className="sr-only">Use the arrow keys to move between projects.</span>
        </p>
      </div>
    </section>
  );
}
