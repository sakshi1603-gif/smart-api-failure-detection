import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Dashboard</Link>

      {" | "}

      <Link to="/monitoring">
        API Monitoring
      </Link>
    </nav>
  );
}

export default Navbar;