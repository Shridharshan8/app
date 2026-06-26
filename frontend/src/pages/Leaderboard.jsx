import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import TopNav from "@/components/TopNav";
import { getLeaderboard } from "@/lib/api";
import { useGame } from "@/context/GameContext";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { player } = useGame();

  useEffect(() => {
    getLeaderboard()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-12 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <div className="angle-divider" />
          <span className="text-xs tracking-[0.25em] uppercase font-bold text-[#ff3b30]">
            GLOBAL STANDINGS
          </span>
        </div>
        <h1 className="font-heading text-5xl sm:text-6xl uppercase font-black tracking-tighter mb-8">
          Leaderboard
        </h1>

        <div className="glass rounded-3xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 md:px-6 py-3 border-b border-white/10 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
            <div className="col-span-2">Rank</div>
            <div className="col-span-5 md:col-span-6">Player</div>
            <div className="col-span-2 md:col-span-2 text-right">Wins</div>
            <div className="col-span-3 md:col-span-2 text-right">Coins</div>
          </div>
          {loading ? (
            <div className="p-8 text-neutral-400 text-sm">Loading standings…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-neutral-400 text-sm">
              No matches played yet. Be the first on the board.
            </div>
          ) : (
            rows.map((r, i) => {
              const me = player?.player_id === r.player_id;
              return (
                <motion.div
                  key={r.player_id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  data-testid={`leaderboard-row-${i}`}
                  className={`grid grid-cols-12 px-4 md:px-6 py-3 items-center border-b border-white/5 ${
                    me ? "bg-[#ff3b30]/10" : ""
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <RankBadge rank={r.rank} />
                  </div>
                  <div className="col-span-5 md:col-span-6 font-heading uppercase font-bold truncate">
                    {r.nickname}
                    {me && (
                      <span className="ml-2 text-[10px] text-[#c6ff00]">YOU</span>
                    )}
                  </div>
                  <div className="col-span-2 md:col-span-2 text-right font-mono font-bold text-[#28c76f]">
                    {r.wins}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right font-mono text-[#c6ff00]">
                    {r.coins}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const RankBadge = ({ rank }) => {
  if (rank === 1)
    return (
      <span className="flex items-center gap-1.5 font-heading font-black text-[#c6ff00]">
        <Crown className="w-4 h-4" /> #1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center gap-1.5 font-heading font-black text-neutral-300">
        <Medal className="w-4 h-4" /> #2
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center gap-1.5 font-heading font-black text-[#cd7f32]">
        <Trophy className="w-4 h-4" /> #3
      </span>
    );
  return <span className="font-mono text-neutral-400">#{rank}</span>;
};
