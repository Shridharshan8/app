import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import { useGame } from "@/context/GameContext";
import Scoreboard from "@/components/Scoreboard";
import DiamondField from "@/components/DiamondField";
import PlayCallPanel from "@/components/PlayCallPanel";
import CommentaryFeed from "@/components/CommentaryFeed";
import MatchupCard from "@/components/MatchupCard";
import MatchOverModal from "@/components/MatchOverModal";

export default function Match() {
  const navigate = useNavigate();
  const { player, wsMessage, send, refreshProfile } = useGame();
  const [state, setState] = useState(null);
  const [feed, setFeed] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);
  const [matchOver, setMatchOver] = useState(null);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const prevHalfRef = useRef(null);

  useEffect(() => {
    if (!wsMessage) return;
    const m = wsMessage;
    if (m.type === "match_start" || m.type === "at_bat") {
      setState(m.state);
      setSelectionLocked(false);
      if (m.type === "match_start") {
        setFeed([]);
      }
    }
    if (m.type === "pitch_result") {
      setState(m.state);
      setFeed((f) => [m.entry, ...f].slice(0, 30));
      setLastEntry(m.entry);
    }
    if (m.type === "match_over") {
      setState(m.state);
      setMatchOver({
        winner_pid: m.winner_player_id,
        rewards: m.rewards,
      });
      refreshProfile();
    }
    if (m.type === "opponent_left") {
      setState(m.state);
      setMatchOver({
        winner_pid: m.winner_player_id,
        opponentLeft: true,
        rewards: { winner: { coins: 100 }, loser: { coins: 0 } },
      });
      refreshProfile();
    }
  }, [wsMessage, refreshProfile]);

  // Track half-inning switch
  useEffect(() => {
    if (!state) return;
    const key = `${state.inning}-${state.half}`;
    if (prevHalfRef.current && prevHalfRef.current !== key) {
      setFeed((f) => [
        {
          ts: new Date().toISOString(),
          event: "HALF",
          text: `--- ${state.half === "top" ? "Top" : "Bottom"} of inning ${state.inning} ---`,
          inning: state.inning,
          half: state.half,
        },
        ...f,
      ]);
    }
    prevHalfRef.current = key;
  }, [state]);

  const role = useMemo(() => {
    if (!state || !player) return null;
    const battingPid = state.players[state.batting_side].player_id;
    return battingPid === player.player_id ? "batter" : "pitcher";
  }, [state, player]);

  const mySide = useMemo(() => {
    if (!state || !player) return null;
    return state.players.home.player_id === player.player_id ? "home" : "away";
  }, [state, player]);

  const submitSelection = (selection) => {
    if (selectionLocked || !state || state.over) return;
    send({ type: "select", selection });
    setSelectionLocked(true);
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-heading text-2xl uppercase tracking-widest text-[#ff3b30] mb-2 animate-pulse">
            Connecting to dugout…
          </div>
          <div className="text-neutral-400 text-sm">Waiting for match data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-10">
      {/* Subtle field gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a1014] to-[#0a0a0a] -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <button
          data-testid="exit-match-btn"
          onClick={() => navigate("/")}
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Match
        </button>

        <Scoreboard state={state} mySide={mySide} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-6">
          {/* Field + matchup */}
          <div className="lg:col-span-7 space-y-5">
            <MatchupCard state={state} lastEntry={lastEntry} />
            <DiamondField state={state} lastEntry={lastEntry} />
          </div>

          {/* Right column: play call + commentary */}
          <div className="lg:col-span-5 space-y-5">
            <PlayCallPanel
              role={role}
              locked={selectionLocked}
              onSelect={submitSelection}
              state={state}
            />
            <CommentaryFeed feed={feed} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {matchOver && (
          <MatchOverModal
            data={matchOver}
            state={state}
            myPid={player?.player_id}
            onClose={() => navigate("/")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
