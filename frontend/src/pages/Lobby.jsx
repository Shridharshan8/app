import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, User, Zap, ChevronRight, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";
import { createGuest, listTeams, getProfile } from "@/lib/api";
import TeamCard from "@/components/TeamCard";
import TopNav from "@/components/TopNav";

const HERO_BG =
  "https://images.pexels.com/photos/16547083/pexels-photo-16547083.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Lobby() {
  const navigate = useNavigate();
  const { player, setPlayer, connect, send, wsState, wsMessage, refreshProfile } = useGame();
  const [nickname, setNickname] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("NYC");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    listTeams().then(setTeams).catch(() => toast.error("Could not load teams"));
  }, []);

  useEffect(() => {
    if (player) refreshProfile();
  }, [player, refreshProfile]);

  useEffect(() => {
    if (!wsMessage) return;
    if (wsMessage.type === "queued") {
      setSearching(true);
    }
    if (wsMessage.type === "match_start" || wsMessage.type === "at_bat") {
      setSearching(false);
      navigate("/match");
    }
  }, [wsMessage, navigate]);

  const handleStart = async () => {
    const name = nickname.trim();
    if (name.length < 2) {
      toast.error("Pick a nickname (2+ chars)");
      return;
    }
    try {
      const p = await createGuest(name);
      setPlayer(p);
      toast.success(`Welcome, ${p.nickname}!`);
    } catch (e) {
      toast.error("Could not create guest session");
    }
  };

  const handleQuickMatch = () => {
    if (!player) return;
    const ws = connect();
    const trySend = () => send({ type: "join_queue", team_id: selectedTeam });
    if (ws && ws.readyState === 1) {
      trySend();
    } else {
      const t = setInterval(() => {
        if (trySend()) clearInterval(t);
      }, 150);
      setTimeout(() => clearInterval(t), 4000);
    }
    setSearching(true);
  };

  const cancelSearch = () => {
    send({ type: "leave_queue" });
    setSearching(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black" />

      <TopNav />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-24">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 mt-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="angle-divider" />
            <span className="text-xs tracking-[0.25em] uppercase font-bold text-[#ff3b30]">
              LIVE • SEASON 1
            </span>
          </div>
          <h1
            data-testid="hero-title"
            className="font-heading text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]"
          >
            DIAMOND
            <br />
            <span className="text-[#ff3b30] drop-shadow-[0_0_20px_rgba(255,59,48,0.4)]">
              RIVALS
            </span>
          </h1>
          <p className="mt-6 text-lg text-neutral-300 max-w-2xl">
            Call the next play. Sim the at-bat. Outscore your rival.
            Real-time PvP baseball with real-life-style stats.
          </p>
        </motion.div>

        {!player ? (
          /* Guest entry */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="glass rounded-3xl p-6 md:p-10 max-w-xl"
          >
            <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#ff3b30] mb-2">
              ENTER THE DIAMOND
            </div>
            <h2 className="font-heading text-3xl uppercase font-bold mb-6">
              Pick your nickname
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                data-testid="nickname-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                maxLength={20}
                placeholder="e.g. SlugBot42"
                className="flex-1 bg-black/60 border border-white/15 rounded-full px-6 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff3b30] transition-colors font-mono"
              />
              <button
                data-testid="start-game-btn"
                onClick={handleStart}
                className="btn-pill bg-[#ff3b30] hover:bg-[#ff5248] text-white px-8 py-3 shadow-[0_0_24px_rgba(255,59,48,0.35)]"
              >
                Step Up <ChevronRight className="inline w-4 h-4 -mt-1" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-4">
              Guest sessions are stored locally. No account required.
            </p>
          </motion.div>
        ) : (
          /* Logged in: team select + quick match */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#007aff]">
                    SELECT YOUR ROSTER
                  </div>
                  <h2 className="font-heading text-3xl uppercase font-bold mt-1">
                    Choose a team
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {teams.map((t) => (
                  <TeamCard
                    key={t.id}
                    team={t}
                    selected={selectedTeam === t.id}
                    onClick={() => setSelectedTeam(t.id)}
                  />
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 h-fit lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#ff3b30]/15 border border-[#ff3b30]/40 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#ff3b30]" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    Guest
                  </div>
                  <div className="font-bold" data-testid="profile-nickname">
                    {player.nickname}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                <Stat label="WINS" value={player.wins} accent="#28c76f" />
                <Stat label="LOSS" value={player.losses} accent="#ff3b30" />
                <Stat
                  label="COINS"
                  value={player.coins}
                  accent="#c6ff00"
                  icon={Coins}
                />
              </div>

              {!searching ? (
                <button
                  data-testid="quick-match-btn"
                  onClick={handleQuickMatch}
                  className="btn-pill w-full bg-[#ff3b30] hover:bg-[#ff5248] text-white py-4 shadow-[0_0_28px_rgba(255,59,48,0.4)] flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" /> Quick Match
                </button>
              ) : (
                <button
                  data-testid="cancel-match-btn"
                  onClick={cancelSearch}
                  className="btn-pill w-full bg-transparent border-2 border-[#ff3b30] text-[#ff3b30] py-4 flex items-center justify-center gap-2 pulse-red"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching… (tap to cancel)
                </button>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <NavBtn
                  testid="leaderboard-link"
                  icon={Trophy}
                  label="Standings"
                  onClick={() => navigate("/leaderboard")}
                />
                <NavBtn
                  testid="profile-link"
                  icon={User}
                  label="Locker"
                  onClick={() => navigate("/profile")}
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-4 text-center uppercase tracking-wider">
                WS: {wsState}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Stat = ({ label, value, accent, icon: Icon }) => (
  <div className="bg-black/40 border border-white/10 rounded-2xl py-3">
    <div className="text-[10px] uppercase tracking-widest text-neutral-400">
      {label}
    </div>
    <div
      className="font-heading text-2xl font-black mt-1 flex items-center justify-center gap-1"
      style={{ color: accent }}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {value}
    </div>
  </div>
);

const NavBtn = ({ icon: Icon, label, onClick, testid }) => (
  <button
    data-testid={testid}
    onClick={onClick}
    className="btn-pill bg-transparent border border-white/15 text-white py-3 flex items-center justify-center gap-2 hover:border-white/40 hover:bg-white/5"
  >
    <Icon className="w-4 h-4" /> {label}
  </button>
);
