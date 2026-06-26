import { motion, AnimatePresence } from "framer-motion";

const BIG_EVENTS = ["HOMER", "TRIPLE", "DOUBLE", "STRIKEOUT", "SINGLE", "WALK"];

export default function DiamondField({ state, lastEntry }) {
  const [first, second, third] = state.bases;
  const flash = lastEntry && BIG_EVENTS.includes(lastEntry.event);

  return (
    <div className="glass rounded-3xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#ff3b30]">
          DIAMOND TACTICAL VIEW
        </div>
        <div className="text-xs text-neutral-400 uppercase tracking-widest">
          {state.half === "top" ? "Bottom Fielding" : "Top Fielding"}
        </div>
      </div>

      <div className="relative aspect-square max-w-md mx-auto diamond-glow">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* Outfield arc */}
          <defs>
            <radialGradient id="grass" cx="50%" cy="100%" r="80%">
              <stop offset="0%" stopColor="#0e3a1f" />
              <stop offset="100%" stopColor="#062012" />
            </radialGradient>
            <linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a2c14" />
              <stop offset="100%" stopColor="#2a1810" />
            </linearGradient>
          </defs>
          {/* Field background */}
          <circle cx="200" cy="320" r="280" fill="url(#grass)" />
          {/* Infield dirt rotated diamond */}
          <polygon
            points="200,80 320,200 200,320 80,200"
            fill="url(#dirt)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          />
          {/* Grass infield */}
          <polygon
            points="200,130 270,200 200,270 130,200"
            fill="url(#grass)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />

          {/* Bases */}
          <Base x={200} y={80} occupied={second} label="2" />
          <Base x={320} y={200} occupied={first} label="1" />
          <Base x={80} y={200} occupied={third} label="3" />
          <Base x={200} y={320} occupied={false} label="H" />

          {/* Pitcher mound */}
          <circle cx="200" cy="200" r="10" fill="#a3a3a3" />
          <circle cx="200" cy="200" r="4" fill="#fff" />

          {/* Foul lines */}
          <line
            x1="200"
            y1="320"
            x2="60"
            y2="100"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="200"
            y1="320"
            x2="340"
            y2="100"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>

        <AnimatePresence>
          {flash && (
            <motion.div
              key={lastEntry.ts}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div
                className="font-heading text-5xl md:text-6xl font-black uppercase px-6 py-3 border-4"
                style={{
                  color: "#fff",
                  background: "rgba(255,59,48,0.85)",
                  borderColor: "#c6ff00",
                  transform: "skewX(-7deg)",
                  letterSpacing: "0.05em",
                }}
              >
                <span style={{ display: "inline-block", transform: "skewX(7deg)" }}>
                  {lastEntry.event === "HOMER" ? "HOME RUN!" : lastEntry.event}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const Base = ({ x, y, occupied, label }) => (
  <g>
    <rect
      x={x - 14}
      y={y - 14}
      width="28"
      height="28"
      rx="3"
      transform={`rotate(45 ${x} ${y})`}
      fill={occupied ? "#ff3b30" : "rgba(255,255,255,0.85)"}
      stroke={occupied ? "#c6ff00" : "rgba(0,0,0,0.4)"}
      strokeWidth="2"
    />
    <text
      x={x}
      y={y + 4}
      textAnchor="middle"
      fontFamily="Barlow Condensed"
      fontWeight="900"
      fontSize="14"
      fill={occupied ? "#fff" : "#0a0a0a"}
    >
      {label}
    </text>
  </g>
);
