import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

// No local particle canvas here — Background3D is already mounted
// globally in App.jsx (fixed, full-viewport, behind everything),
// so this page just needs a transparent background to let it show through.

const FEATURES = [
  {
    title: "Real-time health checks",
    desc: "Pings every registered endpoint on a schedule and flags failures the moment they happen.",
  },
  {
    title: "Auto-recovery engine",
    desc: "Retries with backoff, fails over to a backup, or restarts the service automatically.",
  },
  {
    title: "Incident timeline",
    desc: "Every failure and recovery attempt is logged so you can see exactly what happened, when.",
  },
  {
    title: "Alerting",
    desc: "Get notified the instant something goes down, before your users notice.",
  },
];

function Landing() {
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    cardsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <section className="hero">
        <p className="hero-eyebrow">Uptime, watched closely</p>
        <h1 className="hero-title">Smart API Failure Detection</h1>
        <p className="hero-subtitle">
          Move your mouse — the particles drift in 3D space with a parallax effect.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="hero-cta primary">
            Open dashboard
          </Link>
          <Link to="/monitoring" className="hero-cta">
            View monitoring
          </Link>
        </div>
        <div className="scroll-cue">
          <span>scroll</span>
          <span className="scroll-line" />
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            ref={(el) => (cardsRef.current[i] = el)}
            className="feature-card glass-panel"
          >
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Landing;
