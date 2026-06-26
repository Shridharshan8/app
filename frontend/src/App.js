import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Lobby from "@/pages/Lobby";
import Match from "@/pages/Match";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import { GameProvider, useGame } from "@/context/GameContext";

const Guard = ({ children }) => {
  const { player } = useGame();
  if (!player) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  useEffect(() => {
    document.title = "Diamond Rivals — Call. Sim. Conquer.";
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route
        path="/match"
        element={
          <Guard>
            <Match />
          </Guard>
        }
      />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route
        path="/profile"
        element={
          <Guard>
            <Profile />
          </Guard>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App noise-overlay min-h-screen">
      <BrowserRouter>
        <GameProvider>
          <AppRoutes />
        </GameProvider>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(255,59,48,0.4)",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}
