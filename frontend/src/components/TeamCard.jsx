import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function TeamCard({ team, selected, onClick }) {
  return (
    <motion.button
      data-testid={`team-card-${team.id}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all p-4 ${
        selected
          ? "border-[#ff3b30] shadow-[0_0_20px_rgba(255,59,48,0.35)]"
          : "border-white/10 hover:border-white/30"
      }`}
      style={{
        background: `linear-gradient(135deg, ${team.color} 0%, #0a0a0a 70%)`,
      }}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ff3b30] flex items-center justify-center pop-in">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-black text-xl mb-3"
        style={{ background: team.accent, color: team.color }}
      >
        {team.id}
      </div>
      <div className="font-heading text-xl uppercase font-bold leading-tight">
        {team.name}
      </div>
      <div className="text-xs text-neutral-300 uppercase tracking-widest mt-1">
        {team.city}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-neutral-400">
          {team.archetype}
        </span>
        <span
          className="font-heading text-lg font-black"
          style={{ color: team.accent }}
        >
          {team.rating}
        </span>
      </div>
    </motion.button>
  );
}
