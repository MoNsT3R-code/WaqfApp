/**
 * Motion pieces for the marketplace, after the motion.dev examples the app follows:
 * the loading ripple, a cover photo with a magnifying lens that follows the pointer
 * (after "three-uniforms"), tabs whose highlight slides between options (after
 * "shared-layout-animation") and totals that count to their new value.
 * Everything falls back to a still version when the visitor prefers reduced motion.
 */
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "../../lib/utils";
import { formatPkr } from "./helpers";
import { covers, type Cover } from "../../../shared/covers";
import type { translations } from "../../translations";

/** Three rings that grow and fade one after another, in the current text colour (the accent by default) */
export function Ripple({ size = 64, label = "Loading", className }: { size?: number; label?: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span role="status" aria-label={label} className={cn("relative inline-block flex-none text-[var(--accent)]", className)} style={{ width: size, height: size }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ borderWidth: Math.max(2, size / 20), borderStyle: "solid", borderColor: "currentColor" }}
          initial={reduce ? { scale: 1 - i * 0.25, opacity: 0.6 } : { scale: 0, opacity: 0 }}
          animate={reduce ? undefined : { scale: [0, 1], opacity: [1, 0] }}
          transition={reduce ? undefined : { duration: 2, delay: i * 0.66, repeat: Infinity, ease: [0.2, 0.6, 0.35, 1] }}
        />
      ))}
    </span>
  );
}

/**
 * A cover photo. On a pointer device a round lens follows the pointer and magnifies the
 * photo under it; the photo itself eases in a little while hovered.
 */
export function LensCover({ cover, className, ratio, lens = 120, zoom = 1.9, eager = false }: {
  cover: Cover; className?: string; ratio?: number; lens?: number; zoom?: number; eager?: boolean;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(false);

  // Pointer position inside the photo, smoothed by a spring so the lens glides
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 320, damping: 32, mass: 0.6 });
  const y = useSpring(py, { stiffness: 320, damping: 32, mass: 0.6 });
  const lensX = useTransform(x, v => v - lens / 2);
  const lensY = useTransform(y, v => v - lens / 2);
  // object-fit: cover crops the photo; `crop` is where the drawn photo starts inside the box
  const crop = useRef({ x: 0, y: 0 });
  const bgPos = useTransform([x, y], ([vx, vy]: number[]) =>
    `${lens / 2 - (vx - crop.current.x) * zoom}px ${lens / 2 - (vy - crop.current.y) * zoom}px`);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduce) return;
    const rect = box.current!.getBoundingClientRect();
    px.set(e.clientX - rect.left);
    py.set(e.clientY - rect.top);
    if (!active) {
      // Start where the pointer entered, not from the corner
      x.jump(e.clientX - rect.left);
      y.jump(e.clientY - rect.top);
      setActive(true);
    }
  };

  // The cover is drawn with object-fit: cover, so the lens uses the same scaled size
  const scale = size.w && size.h ? Math.max(size.w / cover.width, size.h / cover.height) : 1;
  const drawnW = cover.width * scale;
  const drawnH = cover.height * scale;
  crop.current = { x: (size.w - drawnW) / 2, y: (size.h - drawnH) / 2 };

  return (
    <div
      ref={box}
      onPointerMove={move}
      onPointerLeave={() => setActive(false)}
      className={cn("relative overflow-hidden bg-[var(--raised)]", className)}
      style={ratio ? { aspectRatio: `${1 / ratio}` } : undefined}
    >
      <motion.img
        src={cover.src}
        alt={cover.caption}
        width={cover.width}
        height={cover.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover"
        animate={{ scale: active ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      />
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-full"
          style={{
            width: lens,
            height: lens,
            x: lensX,
            y: lensY,
            backgroundImage: `url(${cover.src})`,
            backgroundSize: `${drawnW * zoom}px ${drawnH * zoom}px`,
            backgroundPosition: bgPos,
            backgroundRepeat: "no-repeat",
            // A glass rim: a bright edge, a darker inner falloff and the shadow it casts on the photo
            boxShadow: "0 0 0 2px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(0,0,0,0.25), inset 0 -14px 28px rgba(0,0,0,0.45), 0 14px 34px rgba(0,0,0,0.5)",
          }}
          initial={false}
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.6 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        />
      )}
      <span className="pointer-events-none absolute bottom-2 start-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
        {cover.caption}
      </span>
    </div>
  );
}

/**
 * Tabs whose highlight and underline slide to the selected option, as in Motion's
 * shared layout example. `id` keeps two tab bars on one screen from sharing a highlight.
 */
export function MotionTabs<T extends string>({ id, tabs, active, onChange, label, className }: {
  id: string; tabs: { id: T; label: string; count?: number }[]; active: T; onChange: (id: T) => void; label: string; className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex overflow-x-auto border-b border-[var(--border)] scrollbar-hide", className)}>
      {tabs.map(tab => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-none whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
              selected ? "font-medium text-[var(--text-p)]" : "text-[var(--text-s)] hover:text-[var(--text-p)]"
            )}
          >
            {selected && (
              <motion.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-t-lg bg-[var(--raised)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
            <span className="relative">
              {tab.label}
              {tab.count !== undefined && <span className="tabular ms-1.5 text-[var(--text-s)]">{tab.count}</span>}
            </span>
            {selected && (
              <motion.span layoutId={`${id}-line`} className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--accent)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A PKR amount that counts to its new value */
export function AnimatedPkr({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, v => formatPkr(v));
  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    const controls = animate(mv, value, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, reduce]);
  return <motion.span className={cn("tabular", className)}>{text}</motion.span>;
}


/** What the photos show and who took them, folded away under the list */
export function PhotoCredits({ ids, t }: { ids: string[]; t: (typeof translations)["en"]["market"] }) {
  const list = ids.map(id => covers[id]).filter(Boolean);
  if (list.length === 0) return null;
  return (
    <details className="mt-6 text-[13px] text-[var(--text-s)]">
      <summary className="cursor-pointer select-none hover:text-[var(--text-p)]">{t.photoCredits}</summary>
      <p className="mt-2">{t.photosNote}</p>
      <ul className="mt-2 space-y-1">
        {list.map(c => (
          <li key={c.src}>
            <span className="text-[var(--text-p)]">{c.caption}</span>{" "}
            <a href={c.page} target="_blank" rel="noreferrer" className="underline decoration-[var(--control)] underline-offset-2 hover:text-[var(--text-p)]">{c.credit}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
