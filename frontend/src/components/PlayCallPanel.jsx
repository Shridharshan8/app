import { motion } from "framer-motion";
import { Zap, Flame, Wind, Snowflake, Target, Hand, EyeOff } from "lucide-react";
import { Loader2 } from "lucide-react";

const PITCH_OPTIONS = [
  { id: "fastball", label: "Fastball", icon: Flame, hint: "Hard & straight" },
  { id: "curveball", label: "Curveball", icon: Wind, hint: "Big drop" },
  { id: "slider", label: "Slider", icon: Zap, hint: "Late break" },
  { id: "changeup", label: "Changeup", icon: Snowflake, hint: "Off-speed" },
];

const SWING_OPTIONS = [
  { id: "power", label: "Power Swing", icon: Target, hint: "Go for extra bases" },
  { id: "contact", label: "Contact Swing", icon: Hand, hint: "Just put it in play" },
  { id: "take", label: "Take Pitch", icon: EyeOff, hint: "Watch for a ball" },
];

export default function PlayCallPanel({ role, locked, onSelect, state }) {
  if (state?.over) {
    return (
      <div className="glass rounded-3xl p-6 text-center">
        <div className="font-heading text-2xl uppercase font-bold text-[#ff3b30]">
          Final
        </div>
      </div>
    );
  }
  const opts = role === "pitcher" ? PITCH_OPTIONS : SWING_OPTIONS;
  const verb = role === "pitcher" ? "PITCH" : "AT-BAT";
  const title = role === "pitcher" ? "Call the pitch" : "Call your swing";
  const accent = role === "pitcher" ? "#007aff" : "#ff3b30";

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div
          className="text-xs tracking-[0.25em] uppercase font-bold"
          style={{ color: accent }}
        >
          YOUR ROLE • {verb}
        </div>
        <div
          className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
            locked ? "bg-[#28c76f]/15 text-[#28c76f]" : "bg-white/5 text-neutral-400"
          }`}
          data-testid="selection-status"
        >
          {locked ? "Locked in" : "Awaiting call"}
        </div>
      </div>
      <h3 className="font-heading text-2xl uppercase font-bold mb-4">{title}</h3>

      {locked ? (
        <div className="flex items-center gap-3 text-neutral-400 py-6">
          <Loader2 className="w-5 h-5 animate-spin text-[#ff3b30]" />
          Waiting for opponent…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {opts.map((o) => (
            <motion.button
              key={o.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              data-testid={`call-${o.id}-btn`}
              onClick={() =>
                onSelect(role === "pitcher" ? { pitch: o.id } : { swing: o.id })
              }
              className="text-left rounded-2xl border border-white/10 bg-black/40 hover:border-[#ff3b30]/60 hover:bg-[#ff3b30]/5 p-4 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <o.icon className="w-4 h-4" style={{ color: accent }} />
                <span className="font-heading uppercase font-bold tracking-wide">
                  {o.label}
                </span>
              </div>
              <div className="text-xs text-neutral-400">{o.hint}</div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
