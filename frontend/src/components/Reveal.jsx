import { useEffect, useRef, useState } from "react";

/**
 * Wrap any card/section in this to make it fade+slide into view on scroll.
 *
 * Usage:
 *   <Reveal>
 *     <div className="card">...</div>
 *   </Reveal>
 *
 *   <Reveal delay={150}>
 *     <div className="card">second card, slightly delayed</div>
 *   </Reveal>
 */
export default function Reveal({ children, delay = 0, threshold = 0.15 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el); // only animate once
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
