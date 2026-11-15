import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={close}>
          <span className="brand-dot" />
          <span>API Health</span>
        </NavLink>

        <button
          className="navbar-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-menu${open ? " open" : ""}`}>
          {user && (
            <div className="navbar-links">
              <NavLink to="/dashboard" className={linkClass} onClick={close}>
                Dashboard
              </NavLink>
              <NavLink to="/monitoring" className={linkClass} onClick={close}>
                API Monitoring
              </NavLink>
              <NavLink to="/events" className={linkClass} onClick={close}>
                Event Center
              </NavLink>
              <NavLink to="/add-api" className={linkClass} onClick={close}>
                Add API
              </NavLink>
            </div>
          )}

          <div className="navbar-auth">
            {user ? (
              <>
                <span className="navbar-user">{user.name || user.email}</span>
                <button
                  className="auth-btn logout"
                  onClick={() => {
                    close();
                    logout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="auth-btn" onClick={close}>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="auth-btn primary"
                  onClick={close}
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;