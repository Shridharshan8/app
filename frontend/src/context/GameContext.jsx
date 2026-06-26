import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { WS_URL, getProfile } from "@/lib/api";

const GameContext = createContext(null);

export const useGame = () => useContext(GameContext);

const LS_KEY = "diamond_rivals_player";

export const GameProvider = ({ children }) => {
  const [player, setPlayer] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("Could not restore guest session:", err);
      return null;
    }
  });
  const [wsState, setWsState] = useState("idle"); // idle, connecting, open, closed
  const [wsMessage, setWsMessage] = useState(null);
  const wsRef = useRef(null);

  const persist = useCallback((p) => {
    setPlayer(p);
    if (p) localStorage.setItem(LS_KEY, JSON.stringify(p));
    else localStorage.removeItem(LS_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!player?.player_id) return;
    try {
      const p = await getProfile(player.player_id);
      persist({ ...player, ...p });
    } catch (err) {
      console.warn("Could not refresh profile:", err);
    }
  }, [player, persist]);

  const connect = useCallback(() => {
    if (!player?.player_id) return;
    if (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1)) {
      return wsRef.current;
    }
    setWsState("connecting");
    const ws = new WebSocket(`${WS_URL}/${player.player_id}`);
    wsRef.current = ws;
    ws.onopen = () => setWsState("open");
    ws.onclose = () => {
      setWsState("closed");
      wsRef.current = null;
    };
    ws.onerror = () => setWsState("closed");
    ws.onmessage = (evt) => {
      try {
        setWsMessage(JSON.parse(evt.data));
      } catch (err) {
        console.warn("Bad WS payload:", err);
      }
    };
    return ws;
  }, [player]);

  const send = useCallback((msg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.warn("WS close error:", err);
      }
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return (
    <GameContext.Provider
      value={{
        player,
        setPlayer: persist,
        connect,
        disconnect,
        send,
        wsState,
        wsMessage,
        refreshProfile,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
