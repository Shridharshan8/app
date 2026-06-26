import { motion, AnimatePresence } from "framer-motion";

const eventColor = (e) => {
  switch (e) {
    case "HOMER":
    case "TRIPLE":
    case "DOUBLE":
    case "SINGLE":
    case "WALK":
      return "#28c76f";
    case "STRIKEOUT":
    case "OUT":
      return "#ff3b30";
    case "STRIKE_LOOKING":
    case "STRIKE_SWINGING":
      return "#ff9f43";
    case "BALL":
      return "#007aff";
    case "FOUL":
      return "#a3a3a3";
    case "HALF":
      return "#c6ff00";
    default:
      return "#fff";
  }
};

export default function CommentaryFeed({ feed }) {
  return (
    <div className="glass rounded-3xl p-6 max-h-[480px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs tracking-[0.25em] uppercase font-bold text-[#ff3b30]">
          PLAY-BY-PLAY
        </div>
        <div className="text-[10px] uppercase tracking-widest text-neutral-400">
          LIVE FEED
        </div>
      </div>
      <div
        data-testid="commentary-feed"
        className="overflow-y-auto pr-2 space-y-2 flex-1"
      >
        <AnimatePresence initial={false}>
          {feed.length === 0 && (
            <div className="text-sm text-neutral-500 italic">
              Waiting for first pitch…
            </div>
          )}
          {feed.map((e, i) => (
            <motion.div
              key={e.ts + i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3 border-l-2 pl-3 py-1.5"
              style={{ borderColor: eventColor(e.event) }}
            >
              <span
                className="text-[10px] font-mono uppercase tracking-wider w-12 shrink-0"
                style={{ color: eventColor(e.event) }}
              >
                {e.event === "HALF" ? "—" : e.event.replace("STRIKE_", "K-")}
              </span>
              <span className="text-sm text-neutral-200 leading-snug">{e.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
