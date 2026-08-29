import { ArrowLeft, Bell, ChevronDown, CircleHelp, Menu } from "lucide-react";

interface TopBarProps {
  compact?: boolean;
  onReset?: () => void;
}

export function TopBar({ compact = false, onReset }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar__left">
        <button
          className="icon-button top-back"
          aria-label="Go back"
          onClick={onReset}
          title="Back to uploads"
        >
          <ArrowLeft size={compact ? 20 : 25} strokeWidth={2.3} />
        </button>
        <span className="mobile-brand-title mobile-only">VedaAI</span>
        {!compact && (
          <div className="desktop-crumb desktop-only">
            <img src="/icons/icon4.png" alt="" className="soft-icon-img" />
            <span className="crumb">Exams</span>
          </div>
        )}
      </div>
      <div className="top-bar__actions">
        <button className="icon-button desktop-only" aria-label="Help">
          <CircleHelp size={25} strokeWidth={2.1} />
        </button>
        <button className="icon-button notification" aria-label="Notifications">
          <Bell size={24} strokeWidth={2.1} />
          <i />
        </button>
        <button className="top-spark desktop-only" aria-label="AI tools">
          <img src="/single_star.png" alt="AI tools" className="top-star-icon" />
        </button>
        <img
          src="/profile_icon.png"
          alt="Madhur Rastogi"
          className="profile-avatar-img"
        />
        <span className="profile-name desktop-only">Madhur Rastogi</span>
        <ChevronDown size={19} className="desktop-only" />
        <button className="icon-button mobile-only" aria-label="Open menu">
          <Menu size={24} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
