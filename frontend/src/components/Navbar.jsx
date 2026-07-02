import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-dot" />
          <span>API Health</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/monitoring"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            API Monitoring
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Event Center
          </NavLink>

          <NavLink
            to="/add-api"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Add API
          </NavLink>
        </div>

        <div className="navbar-auth">
          {user ? (
            <>
              <span className="navbar-user">{user.name || user.email}</span>
              <button className="auth-btn logout" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="auth-btn">
                Login
              </NavLink>
              <NavLink to="/register" className="auth-btn primary">
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
