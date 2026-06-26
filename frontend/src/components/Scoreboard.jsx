import { motion } from "framer-motion";

export default function Scoreboard({ state, mySide }) {
  const { players, scores, inning, half, balls, strikes, outs, innings_total } = state;

  const halfLabel = half === "top" ? "TOP" : "BOT";

  return (
    <div className="relative">
      <div className="scorebug glass rounded-sm overflow-hidden border-b-4 border-[#ff3b30] shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
        <div className="un-skew flex items-stretch divide-x divide-white/10">
          {/* Away */}
          <SideBlock
            side="away"
            label={players.away.team_id}
            name={players.away.team_name}
            nickname={players.away.nickname}
            score={scores.away}
            active={half === "top"}
            isMe={mySide === "away"}
            color={players.away.team_color}
            accent={players.away.team_accent}
          />
          {/* Center: count */}
          <div className="px-4 md:px-6 py-3 flex flex-col items-center justify-center bg-black/70 min-w-[150px]">
            <div className="flex items-baseline gap-1.5 font-heading">
              <span className="text-xs uppercase text-[#ff3b30] tracking-wider">
                {halfLabel}
              </span>
              <span
                className="text-3xl font-black"
                data-testid="scoreboard-inning"
              >
                {inning}
              </span>
              <span className="text-xs text-neutral-500">
                /{innings_total}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 font-mono text-sm">
              <CountBadge label="B" val={balls} max={3} color="#c6ff00" testid="balls-count" />
              <CountBadge label="S" val={strikes} max={2} color="#ff9f43" testid="strikes-count" />
              <CountBadge label="O" val={outs} max={2} color="#ff3b30" testid="outs-count" />
            </div>
          </div>
          {/* Home */}
          <SideBlock
            side="home"
            label={players.home.team_id}
            name={players.home.team_name}
            nickname={players.home.nickname}
            score={scores.home}
            active={half === "bottom"}
            isMe={mySide === "home"}
            color={players.home.team_color}
            accent={players.home.team_accent}
          />
        </div>
      </div>
    </div>
  );
}

const SideBlock = ({ label, name, nickname, score, active, isMe, color, accent }) => (
  <div
    className="flex-1 px-3 md:px-5 py-3 flex items-center gap-3 relative"
    style={{ background: active ? `${color}50` : "transparent" }}
  >
    <div
      className="w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center font-heading font-black"
      style={{ background: accent, color }}
    >
      {label}
    </div>
    <div className="min-w-0">
      <div className="font-heading text-base md:text-lg uppercase font-bold leading-tight truncate">
        {name}
      </div>
      <div className="text-[10px] tracking-widest uppercase text-neutral-400 truncate">
        {nickname} {isMe && <span className="text-[#c6ff00]">• YOU</span>}
      </div>
    </div>
    <motion.div
      key={score}
      initial={{ scale: 0.7, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      className="ml-auto font-heading text-4xl md:text-5xl font-black"
      style={{ color: active ? accent : "#fff" }}
      data-testid={`score-${label}`}
    >
      {score}
    </motion.div>
  </div>
);

const CountBadge = ({ label, val, max, color, testid }) => (
  <div className="flex items-center gap-1" data-testid={testid}>
    <span className="text-[10px] uppercase text-neutral-400">{label}</span>
    <div className="flex gap-0.5">
      {Array.from({ length: max + 1 }).map((_, i) => (
        <div
          key={`${label}-dot-${i}`}
          className="w-2 h-2 rounded-full"
          style={{
            background: i < val ? color : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  </div>
);
