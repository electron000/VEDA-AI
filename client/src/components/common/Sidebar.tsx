import { ChevronRight, Settings } from "lucide-react";

export const sidebarNavItems = [
  { icon: "/icons/icon1.png", label: "Home" },
  { icon: "/icons/icon2.png", label: "My Classroom" },
  { icon: "/icons/icon3.png", label: "Assignments" },
  { icon: "/icons/icon4.png", label: "Exams" },
  { icon: "/icons/icon5.png", label: "My Library" },
] as const;

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="VedaAI"
      className={`brand-mark ${className} object-contain rounded-xl`}
    />
  );
}

interface SidebarProps {
  onToggle?: () => void;
}

export function LargeSidebar({ onToggle }: SidebarProps) {
  return (
    <aside className="sidebar sidebar--large">
      <div className="sidebar-brand">
        <BrandMark />
        <strong>VedaAI</strong>
        <button
          className="sidebar-collapse-btn"
          aria-label="Collapse sidebar"
          onClick={onToggle}
          title="Collapse sidebar"
        >
          <img src="/close_icon.png" alt="Collapse sidebar" className="collapse-icon-img" />
        </button>
      </div>

      <button className="toolkit-button">
        <img src="/star_icon.png" alt="" className="toolkit-star-icon" />
        <span>AI Teacher's Toolkit</span>
      </button>

      <nav className="sidebar-nav">
        {sidebarNavItems.map(({ icon, label }) => (
          <button
            key={label}
            className={`nav-item ${label === "Exams" ? "is-active" : ""}`}
          >
            <img src={icon} alt="" className="nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-item">
          <Settings size={20} className="nav-icon-lucide" />
          <span>Settings</span>
        </button>
        <div className="school-card">
          <div className="school-seal-box">
            <img
              src="/dps_emblem.png"
              alt="Delhi Public School"
              className="school-seal-img"
            />
          </div>
          <div className="school-card-info">
            <strong>Delhi Public School</strong>
            <span>Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function CompactRail({ onToggle }: SidebarProps) {
  return (
    <aside className="sidebar sidebar--compact">
      <button
        className="rail-brand-btn"
        aria-label="Expand sidebar"
        onClick={onToggle}
        title="Expand sidebar"
      >
        <BrandMark />
      </button>

      <button
        className="toolkit-icon"
        aria-label="AI Teacher's Toolkit"
        onClick={onToggle}
      >
        <img src="/star_icon.png" alt="" className="rail-star-icon" />
      </button>

      <nav className="rail-nav">
        {sidebarNavItems.map(({ icon, label }) => (
          <button
            key={label}
            aria-label={label}
            className={`rail-item ${label === "Exams" ? "is-active" : ""}`}
            onClick={onToggle}
          >
            <img src={icon} alt="" className="nav-icon" />
          </button>
        ))}
      </nav>

      <div className="rail-bottom">
        <button
          className="rail-expand-btn"
          aria-label="Expand sidebar"
          onClick={onToggle}
          title="Expand sidebar"
        >
          <div className="school-seal-box">
            <img
              src="/dps_emblem.png"
              alt="Delhi Public School"
              className="school-seal-img"
            />
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </aside>
  );
}
