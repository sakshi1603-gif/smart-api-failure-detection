import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="brand-dot" />
          <span>API Health</span>
        </div>

        <div className="navbar-links">
          <NavLink
            to="/"
            end
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
              <NavLink to="/signup" className="auth-btn primary">
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
