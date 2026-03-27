import { ChevronDown } from "lucide-react";

export function Header() {
  return (
    <nav style={{
      background: "white",
      borderBottom: "1px solid var(--perch-border)",
      padding: "16px 0",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Left Side: Logo & Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <img src="/perch-logo.png" alt="Perch" width="28" height="28" style={{ borderRadius: "4px" }} />
            <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--perch-green)", letterSpacing: "-0.5px" }}>perch</span>
          </div>

          {/* Navigation Links */}
          <div style={{ display: "flex", gap: "28px", fontSize: "15px", fontWeight: 600, color: "#333" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              Solutions <ChevronDown size={14} color="#666" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              Tools <ChevronDown size={14} color="#666" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              Learn <ChevronDown size={14} color="#666" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              About <ChevronDown size={14} color="#666" />
            </div>
          </div>
        </div>

        {/* Right Side: Auth Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button style={{
            background: "transparent",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            color: "#333",
            cursor: "pointer",
            padding: "8px 16px"
          }}>
            Log in
          </button>
          <button style={{
            background: "var(--perch-green)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            fontWeight: 600,
            padding: "10px 20px",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(36, 92, 85, 0.2)"
          }}>
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
}
