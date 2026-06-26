import { motion } from "framer-motion";
import { Trophy, Coins, Sparkles, Home } from "lucide-react";

const matchOverTitle = (youWon, opponentLeft) => {
  if (youWon) return "VICTORY";
  if (opponentLeft) return "FORFEIT WIN";
  return "DEFEAT";
};

export default function MatchOverModal({ data, state, myPid, onClose }) {
  const youWon = data.winner_pid === myPid;
  const reward = youWon ? data.rewards?.winner : data.rewards?.loser;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="match-over-modal"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="glass rounded-3xl p-8 md:p-10 max-w-md w-full text-center border-2"
        style={{ borderColor: youWon ? "#c6ff00" : "#ff3b30" }}
      >
        <div className="text-xs tracking-[0.3em] uppercase font-bold text-neutral-400 mb-2">
          FINAL SCORE
        </div>
        <div className="flex items-center justify-center gap-4 font-heading">
          <div className="text-center">
            <div className="text-[10px] uppercase text-neutral-400">
              {state.players.away.team_id}
            </div>
            <div className="text-5xl font-black">{state.scores.away}</div>
          </div>
          <div className="text-2xl text-neutral-600">—</div>
          <div className="text-center">
            <div className="text-[10px] uppercase text-neutral-400">
              {state.players.home.team_id}
            </div>
            <div className="text-5xl font-black">{state.scores.home}</div>
          </div>
        </div>

        <div
          className="mt-6 mb-3 font-heading text-4xl font-black uppercase"
          style={{ color: youWon ? "#c6ff00" : "#ff3b30" }}
        >
          {matchOverTitle(youWon, data.opponentLeft)}
        </div>

        {data.opponentLeft && !youWon && (
          <div className="text-sm text-neutral-400 mb-4">
            Opponent disconnected.
          </div>
        )}

        <div className="flex items-center justify-center gap-3 text-sm mb-6">
          <div className="flex items-center gap-1 bg-[#c6ff00]/10 border border-[#c6ff00]/30 rounded-full px-3 py-1">
            <Coins className="w-4 h-4 text-[#c6ff00]" />
            <span className="font-mono font-bold text-[#c6ff00]">
              +{reward?.coins || 0}
            </span>
          </div>
          {reward?.item && (
            <div
              className="flex items-center gap-1 border rounded-full px-3 py-1"
              style={{
                background: "rgba(255,59,48,0.1)",
                borderColor: "rgba(255,59,48,0.4)",
              }}
            >
              <Sparkles className="w-4 h-4 text-[#ff3b30]" />
              <span className="text-[#ff3b30] font-bold uppercase text-xs tracking-wider">
                {reward.item.name}
              </span>
            </div>
          )}
        </div>

        {youWon && (
          <div className="flex justify-center mb-4">
            <Trophy className="w-14 h-14 text-[#c6ff00] drop-shadow-[0_0_20px_rgba(198,255,0,0.5)]" />
          </div>
        )}

        <button
          onClick={onClose}
          data-testid="return-lobby-btn"
          className="btn-pill bg-[#ff3b30] hover:bg-[#ff5248] text-white px-8 py-3 inline-flex items-center gap-2 shadow-[0_0_24px_rgba(255,59,48,0.35)]"
        >
          <Home className="w-4 h-4" /> Return to Lobby
        </button>
      </motion.div>
    </motion.div>
  );
}
