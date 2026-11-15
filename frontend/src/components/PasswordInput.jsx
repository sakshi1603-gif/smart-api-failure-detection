import { useState } from "react";

export default function PasswordInput(props) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}