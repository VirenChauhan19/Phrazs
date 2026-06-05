import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * A touch/pointer-driven 3D tilt surface. The card rotates toward the finger
 * with springy physics and casts a moving light "glare". Children placed in
 * elements with `.lift-1` / `.lift-2` float above the surface for real parallax
 * depth (the wrapper is `transform-style: preserve-3d`).
 */
export default function Tilt3D({
  children,
  className = "",
  max = 14,
  scale = 1.03,
  glare = true,
  style,
  ...rest
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);

  // Normalised pointer position over the card (0..1 on each axis).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 250, damping: 20, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 250, damping: 20, mass: 0.4 });

  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glareX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(sy, [0, 1], ["0%", "100%"]);

  if (reduce) {
    return (
      <div className={`tilt3d ${className}`} style={style} {...rest}>
        {children}
      </div>
    );
  }

  const track = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      className={`tilt3d ${className}`}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
      whileTap={{ scale: 0.985 }}
      whileHover={{ scale }}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={reset}
      onPointerUp={reset}
      onPointerCancel={reset}
      {...rest}
    >
      {children}
      {glare && (
        <motion.span
          className="tilt3d__glare"
          aria-hidden="true"
          style={{ "--gx": glareX, "--gy": glareY }}
        />
      )}
    </motion.div>
  );
}
