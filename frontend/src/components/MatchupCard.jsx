import { motion } from "framer-motion";

const StatBar = ({ label, val, accent }) => (
  <div>
    <div className="flex justify-between text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
      <span>{label}</span>
      <span className="font-mono text-white">{val}</span>
    </div>
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${val}%`, background: accent }}
      />
    </div>
  </div>
);

export default function MatchupCard({ state }) {
  const { batter, pitcher, players, batting_side, fielding_side } = state;
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Pitcher */}
      <motion.div
        key={pitcher.name}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 border-l-4"
        style={{ borderColor: "#007aff" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] uppercase tracking-widest text-[#007aff] font-bold">
            ON THE MOUND
          </div>
          <div
            className="text-[10px] font-mono px-1.5 rounded"
            style={{
              background: players[fielding_side].team_accent + "33",
              color: players[fielding_side].team_accent,
            }}
          >
            {players[fielding_side].team_id}
          </div>
        </div>
        <div className="font-heading text-xl uppercase font-bold" data-testid="pitcher-name">
          {pitcher.name}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
          P • ERA {pitcher.era}
        </div>
        <div className="space-y-1.5">
          <StatBar label="VEL" val={pitcher.velocity} accent="#ff3b30" />
          <StatBar label="CTRL" val={pitcher.control} accent="#007aff" />
          <StatBar label="STUFF" val={pitcher.stuff} accent="#c6ff00" />
        </div>
      </motion.div>

      {/* Batter */}
      <motion.div
        key={batter.name}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 border-l-4"
        style={{ borderColor: "#ff3b30" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] uppercase tracking-widest text-[#ff3b30] font-bold">
            AT THE PLATE
          </div>
          <div
            className="text-[10px] font-mono px-1.5 rounded"
            style={{
              background: players[batting_side].team_accent + "33",
              color: players[batting_side].team_accent,
            }}
          >
            {players[batting_side].team_id}
          </div>
        </div>
        <div className="font-heading text-xl uppercase font-bold" data-testid="batter-name">
          {batter.name}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
          {batter.role} • AVG {batter.avg} • HR {batter.hr}
        </div>
        <div className="space-y-1.5">
          <StatBar label="POW" val={batter.power} accent="#ff3b30" />
          <StatBar label="CONT" val={batter.contact} accent="#28c76f" />
          <StatBar label="DISC" val={batter.discipline} accent="#c6ff00" />
        </div>
      </motion.div>
    </div>
  );
}
