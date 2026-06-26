import { Link, useLocation } from "react-router-dom";
import { Diamond } from "lucide-react";

export default function TopNav() {
  const { pathname } = useLocation();
  const link = (to, label, tid) => (
    <Link
      to={to}
      data-testid={tid}
      className={`text-xs uppercase tracking-widest font-bold transition-colors ${
        pathname === to ? "text-[#ff3b30]" : "text-neutral-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 pt-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2" data-testid="nav-home">
        <Diamond className="w-6 h-6 text-[#ff3b30]" />
        <span className="font-heading font-black text-xl uppercase tracking-tight">
          Diamond Rivals
        </span>
      </Link>
      <div className="flex items-center gap-6">
        {link("/", "Lobby", "nav-lobby")}
        {link("/leaderboard", "Standings", "nav-leaderboard")}
        {link("/profile", "Locker", "nav-profile")}
      </div>
    </div>
  );
}
