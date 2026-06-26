import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Gift,
  LogOut,
  Trophy,
  Crown,
  Zap,
  Award,
  Sparkles,
  Hand,
  Flame,
  Footprints,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import TopNav from "@/components/TopNav";
import { useGame } from "@/context/GameContext";
import { claimDaily, listItems } from "@/lib/api";

const ICONS = { Crown, Zap, Hand, Sparkles, Award, Flame, Footprints, Rocket };
const RARITY_COLOR = {
  common: "#a3a3a3",
  rare: "#007aff",
  epic: "#a855f7",
  legendary: "#c6ff00",
};

export default function Profile() {
  const { player, setPlayer, refreshProfile } = useGame();
  const [allItems, setAllItems] = useState([]);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    listItems().then(setAllItems);
    refreshProfile();
  }, [refreshProfile]);

  const today = new Date().toISOString().slice(0, 10);
  const dailyClaimed = player?.last_daily === today;

  const handleClaim = async () => {
    if (!player || dailyClaimed) return;
    setClaiming(true);
    try {
      const res = await claimDaily(player.player_id);
      toast.success(
        `Claimed +${res.coins_awarded} coins${res.new_item ? ` + ${res.new_item.name}` : ""}`,
      );
      await refreshProfile();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not claim");
    } finally {
      setClaiming(false);
    }
  };

  const handleSignOut = () => {
    setPlayer(null);
    toast.success("Signed out");
  };

  if (!player) return null;

  return (
    <div className="relative min-h-screen">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-12 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <div className="angle-divider" />
          <span className="text-xs tracking-[0.25em] uppercase font-bold text-[#007aff]">
            PLAYER LOCKER
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h1 className="font-heading text-5xl sm:text-6xl uppercase font-black tracking-tighter">
            {player.nickname}
          </h1>
          <button
            data-testid="signout-btn"
            onClick={handleSignOut}
            className="btn-pill bg-transparent border border-white/20 text-neutral-300 px-5 py-2 hover:border-[#ff3b30] hover:text-[#ff3b30] flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBig label="Wins" val={player.wins} color="#28c76f" icon={Trophy} />
          <StatBig label="Losses" val={player.losses} color="#ff3b30" icon={Crown} />
          <StatBig label="Coins" val={player.coins} color="#c6ff00" icon={Coins} />
          <StatBig label="Items" val={player.items?.length || 0} color="#007aff" icon={Sparkles} />
        </div>

        {/* Daily reward */}
        <div className="glass rounded-3xl p-6 mb-8 flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#c6ff00]/15 border border-[#c6ff00]/40 flex items-center justify-center">
            <Gift className="w-7 h-7 text-[#c6ff00]" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs uppercase tracking-widest text-[#c6ff00] font-bold">
              DAILY REWARD
            </div>
            <div className="font-heading text-2xl uppercase font-bold">
              {dailyClaimed
                ? "Already claimed — come back tomorrow"
                : "+100 coins (and a chance at a free item)"}
            </div>
          </div>
          <button
            data-testid="claim-daily-btn"
            disabled={dailyClaimed || claiming}
            onClick={handleClaim}
            className={`btn-pill px-6 py-3 ${
              dailyClaimed
                ? "bg-white/5 text-neutral-500 cursor-not-allowed"
                : "bg-[#c6ff00] text-black hover:bg-[#d4ff33] pulse-volt"
            }`}
          >
            {dailyClaimed ? "Claimed" : claiming ? "Claiming…" : "Claim"}
          </button>
        </div>

        {/* Items locker */}
        <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#ff3b30] mb-3">
          UNLOCKED GEAR
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allItems.map((it) => {
            const owned = (player.items || []).includes(it.id);
            const Icon = ICONS[it.icon] || Sparkles;
            return (
              <motion.div
                key={it.id}
                whileHover={{ y: -3 }}
                data-testid={`item-${it.id}`}
                className={`rounded-2xl p-4 border ${
                  owned
                    ? "border-white/20 bg-black/50"
                    : "border-white/5 bg-black/30 opacity-50"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: `${RARITY_COLOR[it.rarity]}22`,
                    border: `1px solid ${RARITY_COLOR[it.rarity]}55`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: RARITY_COLOR[it.rarity] }}
                  />
                </div>
                <div className="font-heading uppercase font-bold text-sm leading-tight">
                  {it.name}
                </div>
                <div
                  className="text-[10px] uppercase tracking-widest mt-1 font-bold"
                  style={{ color: RARITY_COLOR[it.rarity] }}
                >
                  {it.rarity} {owned ? "" : "• locked"}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const StatBig = ({ label, val, color, icon: Icon }) => (
  <div className="glass rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4" style={{ color }} />
      <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
        {label}
      </div>
    </div>
    <div
      className="font-heading text-4xl font-black"
      style={{ color }}
    >
      {val}
    </div>
  </div>
);
