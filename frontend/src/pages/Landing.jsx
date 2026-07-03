import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/landing.css";
const FEATURES = [
  {
    title: "Real-time API Monitoring",
    desc: "Continuously monitors registered APIs and displays their current health status.",
  },
  {
    title: "Failure Detection",
    desc: "Detects failed, slow, healthy, and blocked APIs based on response time and status codes.",
  },
  {
    title: "Auto Retry & Recovery",
    desc: "Automatically retries failed APIs and applies cooldown blocking when repeated failures occur.",
  },
  {
    title: "Dashboard & Health History",
    desc: "View API status, response times, SLA metrics, and monitoring history from a centralized dashboard.",
  },
];

function Landing() {
  const cardsRef = useRef([]);

  const navigate = useNavigate();
  const { login } = useAuth();

  const [loadingDemo, setLoadingDemo] = useState(false);

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
      { threshold: 0.25 },
    );

    cardsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);
  async function handleDemoLogin() {
    try {
      setLoadingDemo(true);

      await login("demo@smartapi.com", "Demo@123");

      navigate("/dashboard");
    } catch (err) {
      alert("Unable to login to demo account.");
    } finally {
      setLoadingDemo(false);
    }
  }
  return (
    <div className="landing-page">
      <section className="hero">
        <p className="hero-eyebrow">Monitor • Detect • Recover</p>
        <h1 className="hero-title">
          Smart API Failure Detection & Auto-Recovery System
        </h1>
        <p className="hero-subtitle">
          Monitor API health in real time, detect failures instantly, and
          automate recovery using intelligent retry and cooldown mechanisms.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="hero-cta primary">
            Get Started
          </Link>

          <Link to="/login" className="hero-cta">
            Login
          </Link>

          <button
            type="button"
            className="hero-cta demo-btn"
            onClick={handleDemoLogin}
            disabled={loadingDemo}
          >
            {loadingDemo ? "Entering Demo..." : "Explore Demo"}
          </button>
        </div>
        <p className="demo-note">
          ✨ No signup required. Explore the platform instantly with our demo
          account.
        </p>

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
