# Diamond Rivals — PRD

## Original Problem Statement
> New baseball game with real life stats and immersive gameplay. Multiplayer, leaderboard, free in-game items, diverse characters, reward system. Core loop: Call plays, then sim the at-bat — players choose strategies (pitch types, swing style) and watch outcomes play out quickly using real-life stats. Winning comes from outscoring the opponent over innings; results feed a live leaderboard. Diverse character archetypes and a reward system with free in-game items (no pay-to-progress).

## User Choices (v1)
- Data source: **Curated seed dataset of MLB-style teams** (offline, no API costs)
- Multiplayer: **Real-time live PvP via WebSockets**
- Auth: **Guest play** (nickname only, localStorage-persisted)
- Commentary: **Templated** (no LLM)
- Visual style: **Modern sports broadcast (ESPN-style dark UI)**

## Architecture
- Backend: FastAPI + Motor (Mongo) + native WebSockets at `/api/ws/{player_id}`
- Game engine: in-memory `MatchManager` with queue, per-match state, server-resolved at-bats. 3 innings.
- Frontend: React 19 + react-router-dom + framer-motion + Tailwind + shadcn UI, WebSocket via custom `GameContext`
- DB collections: `players`, `matches`

## User Personas
- **Casual fan** — wants 3-minute snackable matches with broadcast feel
- **Stat enthusiast** — enjoys reading batter/pitcher attribute matchups
- **Competitive grinder** — chases leaderboard rank and rare items

## Core Requirements (static)
1. Guest onboarding (nickname → guest session)
2. 8 MLB-style teams with 10-player rosters and broadcast-style branding
3. Real-time PvP matchmaking
4. Call-play → server sim resolution → live state broadcast
5. Inning/balls/strikes/outs/bases tracking with proper baseball logic
6. Templated play-by-play feed
7. Persistent profile (coins, wins/losses, item inventory)
8. Reward system: per-match coins, win-bonus item drops, daily claim
9. Leaderboard (top 50 by wins)

## Implemented (v1 — Feb 2026)
- ✅ FastAPI backend with full REST + WebSocket game loop (`/app/backend/server.py`, `/app/backend/teams_data.py`)
- ✅ At-bat resolution engine with stat-driven probabilities, pitch-type/swing matchup modifiers
- ✅ MatchManager (queue, in-memory matches, broadcast, disconnect handling, opponent-left awards)
- ✅ Daily reward + item drops on wins (25% chance)
- ✅ React frontend: Lobby, Match, Leaderboard, Profile
- ✅ Components: Scoreboard (broadcast skew), DiamondField (SVG tactical view + big-event flash), PlayCallPanel, CommentaryFeed, MatchupCard, MatchOverModal, TeamCard, TopNav
- ✅ ESPN-style design: Barlow Condensed headers, IBM Plex Sans body, deep black + ESPN red + Volt Blue accents, glass-morphism, noise overlay
- ✅ Sonner toasts; framer-motion micro-interactions
- ✅ Tested 100% pass — REST endpoints, WebSocket flow, full 2-client game simulation, lobby UI flow

## P0 Backlog (next pass)
- Stadium ambient audio (crowd noise/walk-up music toggle)
- AI opponent for solo play when queue is empty
- Match history page (per-player past games with box scores)

## P1 Backlog
- Equipped-item bonuses (cosmetic + minor stat boost)
- Daily/weekly challenges (e.g. "hit 2 HRs in one match")
- Spectate mode for ongoing matches
- Roster swap mid-game (pinch hit / reliever)

## P2 Backlog
- Full 9-inning season mode
- Trading card style player collection
- Seasonal leaderboard reset + cosmetic season-pass rewards
- Mobile-optimized layout polish

## Files Map
- `/app/backend/server.py` — API + WS + game engine
- `/app/backend/teams_data.py` — 8 teams, items, commentary templates
- `/app/frontend/src/App.js` — routing
- `/app/frontend/src/context/GameContext.jsx` — guest + WS state
- `/app/frontend/src/lib/api.js` — REST client + WS URL helper
- `/app/frontend/src/pages/{Lobby,Match,Leaderboard,Profile}.jsx`
- `/app/frontend/src/components/{Scoreboard,DiamondField,PlayCallPanel,CommentaryFeed,MatchupCard,MatchOverModal,TeamCard,TopNav}.jsx`

## Notes
- Guest sessions are stored in `localStorage` under key `diamond_rivals_player`.
- No external integrations or API keys required for v1.
- Match length: 3 innings for snappy mobile-friendly pacing.
