import { useEffect, useRef } from "react";

type Node = { x: number; y: number; z: number; blink: boolean; phase: number };

/**
 * Rotating wireframe globe with blinking node markers.
 * Rendered on a canvas, client-side only (no work happens during SSR).
 */
export function WireGlobe({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fibonacci sphere points
    const COUNT = 320;
    const nodes: Node[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      nodes.push({
        x: Math.cos(theta) * r,
        y,
        z: Math.sin(theta) * r,
        blink: i % 23 === 0,
        phase: (i % 7) * 0.9,
      });
    }

    // Connect near neighbours once, up front
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = nodes[i]!.x - nodes[j]!.x;
        const dy = nodes[i]!.y - nodes[j]!.y;
        const dz = nodes[i]!.z - nodes[j]!.z;
        if (dx * dx + dy * dy + dz * dz < 0.055) edges.push([i, j]);
      }
    }

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const rot = reduce ? 0.6 : t * 0.16;
      const tilt = -0.38;
      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.42;

      ctx.clearRect(0, 0, width, height);

      const project = (n: Node) => {
        // yaw
        const x1 = n.x * Math.cos(rot) - n.z * Math.sin(rot);
        const z1 = n.x * Math.sin(rot) + n.z * Math.cos(rot);
        // tilt
        const y2 = n.y * Math.cos(tilt) - z1 * Math.sin(tilt);
        const z2 = n.y * Math.sin(tilt) + z1 * Math.cos(tilt);
        return { sx: cx + x1 * R, sy: cy + y2 * R, z: z2 };
      };

      const pts = nodes.map(project);

      // edges
      for (const [a, b] of edges) {
        const p = pts[a]!;
        const q = pts[b]!;
        const depth = (p.z + q.z) / 2;
        const alpha = depth > 0 ? 0.16 + depth * 0.2 : 0.05 + (depth + 1) * 0.06;
        ctx.strokeStyle = `rgba(28, 25, 23, ${alpha.toFixed(3)})`;
        ctx.lineWidth = depth > 0 ? 0.7 : 0.5;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo(q.sx, q.sy);
        ctx.stroke();
      }

      // nodes
      nodes.forEach((n, i) => {
        const p = pts[i]!;
        if (n.blink) {
          const pulse = reduce ? 0.9 : 0.45 + 0.55 * Math.abs(Math.sin(t * 1.4 + n.phase));
          const front = p.z > -0.1;
          const a = (front ? 0.95 : 0.25) * pulse;
          ctx.fillStyle = `rgba(198, 84, 33, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 2.6 + pulse * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(198, 84, 33, ${(a * 0.14).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 8 + pulse * 7, 0, Math.PI * 2);
          ctx.fill();
        } else if (i % 5 === 0) {
          const front = p.z > 0;
          ctx.fillStyle = `rgba(28, 25, 23, ${front ? 0.55 : 0.16})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, front ? 1.5 : 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
