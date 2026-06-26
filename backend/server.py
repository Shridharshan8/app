"""Diamond Rivals — multiplayer baseball game backend.

Real-time PvP with WebSockets, curated MLB-style team seed data, templated
commentary, leaderboard and rewards.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from teams_data import TEAMS, COMMENTARY, REWARD_ITEMS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("diamond-rivals")

# ---------- DB ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------- App ----------
app = FastAPI(title="Diamond Rivals API")
api = APIRouter(prefix="/api")


# ---------- Models ----------
class GuestCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=20)


class GuestProfile(BaseModel):
    player_id: str
    nickname: str
    coins: int
    wins: int
    losses: int
    items: List[str]
    last_daily: Optional[str] = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- REST endpoints ----------
@api.get("/")
async def root():
    return {"ok": True, "game": "Diamond Rivals", "version": "1.0"}


@api.post("/guest", response_model=GuestProfile)
async def create_guest(payload: GuestCreate):
    pid = str(uuid.uuid4())
    doc = {
        "player_id": pid,
        "nickname": payload.nickname.strip(),
        "coins": 250,
        "wins": 0,
        "losses": 0,
        "items": ["classic_cap"],
        "last_daily": None,
        "created_at": now_iso(),
    }
    await db.players.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("created_at", None)
    return doc


@api.get("/profile/{player_id}", response_model=GuestProfile)
async def get_profile(player_id: str):
    p = await db.players.find_one({"player_id": player_id}, {"_id": 0, "created_at": 0})
    if not p:
        raise HTTPException(404, "Player not found")
    return p


@api.post("/profile/{player_id}/daily")
async def claim_daily(player_id: str):
    p = await db.players.find_one({"player_id": player_id})
    if not p:
        raise HTTPException(404, "Player not found")
    today = datetime.now(timezone.utc).date().isoformat()
    if p.get("last_daily") == today:
        raise HTTPException(400, "Daily reward already claimed today")
    reward_coins = 100
    # 30% chance of bonus item
    new_item = None
    pool = [i for i in REWARD_ITEMS if i["id"] not in p.get("items", [])]
    if pool and random.random() < 0.3:
        new_item = random.choice(pool)
    update = {"$set": {"last_daily": today}, "$inc": {"coins": reward_coins}}
    if new_item:
        update["$push"] = {"items": new_item["id"]}
    await db.players.update_one({"player_id": player_id}, update)
    return {"coins_awarded": reward_coins, "new_item": new_item}


@api.get("/teams")
async def list_teams():
    # Return summary view (id, name, color, archetype, rating)
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "city": t["city"],
            "color": t["color"],
            "accent": t["accent"],
            "archetype": t["archetype"],
            "rating": t["rating"],
        }
        for t in TEAMS
    ]


@api.get("/teams/{team_id}")
async def get_team(team_id: str):
    t = next((x for x in TEAMS if x["id"] == team_id), None)
    if not t:
        raise HTTPException(404, "Team not found")
    return t


@api.get("/items")
async def list_items():
    return REWARD_ITEMS


@api.get("/leaderboard")
async def leaderboard():
    cursor = db.players.find({}, {"_id": 0, "player_id": 1, "nickname": 1, "wins": 1, "losses": 1, "coins": 1}).sort("wins", -1).limit(50)
    rows = await cursor.to_list(50)
    for i, r in enumerate(rows):
        r["rank"] = i + 1
    return rows


# ===========================================================
#                     GAME ENGINE
# ===========================================================

PITCH_TYPES = ["fastball", "curveball", "slider", "changeup"]
SWING_TYPES = ["power", "contact", "take"]


def _seeded_player_idx(name: str) -> int:
    return sum(ord(c) for c in name) % 9


def get_lineup(team_id: str) -> List[dict]:
    t = next(x for x in TEAMS if x["id"] == team_id)
    return t["roster"]


def resolve_at_bat(batter: dict, pitcher: dict, pitch_type: str, swing_type: str, balls: int, strikes: int):
    """Return (event, description_key). event is one of:
    BALL, STRIKE_LOOKING, STRIKE_SWINGING, FOUL, OUT, SINGLE, DOUBLE, TRIPLE, HOMER, WALK
    Resolves only one pitch — caller maintains count.
    """
    # Pitcher control: chance pitch is in the strike zone
    control = pitcher["control"] / 100.0
    stuff = pitcher["stuff"] / 100.0

    # Pitch type modifier on zone-rate
    zone_mod = {"fastball": 0.08, "curveball": -0.05, "slider": 0.0, "changeup": -0.03}[pitch_type]
    in_zone_p = max(0.25, min(0.85, control + zone_mod))
    in_zone = random.random() < in_zone_p

    contact = batter["contact"] / 100.0
    power = batter["power"] / 100.0
    discipline = batter["discipline"] / 100.0

    if swing_type == "take":
        # Discipline helps "guess" the zone
        if in_zone:
            return "STRIKE_LOOKING"
        return "BALL"

    # Swung
    # Whiff probability: higher with power swing, lower with contact swing
    base_whiff = 0.30 + (stuff - 0.5) * 0.4 - (contact - 0.5) * 0.4
    swing_mod = {"power": 0.12, "contact": -0.10}[swing_type]
    # Matchup: power vs fastball easier contact; contact vs offspeed easier contact
    matchup_mod = 0.0
    if swing_type == "power" and pitch_type == "fastball":
        matchup_mod -= 0.05
    if swing_type == "contact" and pitch_type in ("curveball", "changeup"):
        matchup_mod -= 0.05
    if swing_type == "power" and pitch_type in ("slider", "curveball"):
        matchup_mod += 0.08
    # Out of zone swings = more whiffs
    if not in_zone:
        matchup_mod += 0.20 - discipline * 0.15

    whiff_p = max(0.05, min(0.85, base_whiff + swing_mod + matchup_mod))
    if random.random() < whiff_p:
        return "STRIKE_SWINGING"

    # Made contact — foul / out / hit
    # Foul probability
    if random.random() < 0.22:
        return "FOUL"

    # Determine hit quality
    # Hit probability scales with batter contact & in-zone, power swing increases extra-base potential
    in_play_hit_p = 0.30 + (contact - 0.5) * 0.4 - (stuff - 0.5) * 0.2 + (0.05 if in_zone else -0.05)
    in_play_hit_p = max(0.18, min(0.60, in_play_hit_p))

    if random.random() >= in_play_hit_p:
        return "OUT"

    # It's a hit — assign type via weighted roll using power
    r = random.random()
    # Base distribution: single 0.70 / double 0.18 / triple 0.04 / homer 0.08
    # Power swing shifts toward extra bases
    p_shift = power * (1.4 if swing_type == "power" else 0.7)
    homer_p = 0.04 + 0.10 * p_shift
    triple_p = 0.03 + 0.02 * p_shift
    double_p = 0.16 + 0.08 * p_shift
    if r < homer_p:
        return "HOMER"
    if r < homer_p + triple_p:
        return "TRIPLE"
    if r < homer_p + triple_p + double_p:
        return "DOUBLE"
    return "SINGLE"


def commentary_for(event: str, batter_name: str, pitcher_name: str) -> str:
    pool = COMMENTARY.get(event, [f"{batter_name}: {event}"])
    tpl = random.choice(pool)
    return tpl.format(batter=batter_name, pitcher=pitcher_name)


def advance_bases(bases: List[bool], event: str):
    """Mutate bases [1B, 2B, 3B] and return runs scored."""
    runs = 0
    if event == "WALK":
        # Force advances only if bases loaded behind runner
        if bases[0] and bases[1] and bases[2]:
            runs += 1
            # bases stay loaded
        elif bases[0] and bases[1]:
            bases[2] = True
        elif bases[0]:
            bases[1] = True
        bases[0] = True
    elif event == "SINGLE":
        if bases[2]:
            runs += 1
            bases[2] = False
        if bases[1]:
            bases[2] = True
            bases[1] = False
        if bases[0]:
            bases[1] = True
        bases[0] = True
    elif event == "DOUBLE":
        for i in (2, 1):
            if bases[i]:
                runs += 1
                bases[i] = False
        if bases[0]:
            bases[2] = True
            bases[0] = False
        bases[1] = True
    elif event == "TRIPLE":
        for i in (2, 1, 0):
            if bases[i]:
                runs += 1
                bases[i] = False
        bases[2] = True
    elif event == "HOMER":
        runs += 1 + sum(1 for b in bases if b)
        bases[0] = bases[1] = bases[2] = False
    return runs


# ===========================================================
#                  MATCH STATE & MANAGER
# ===========================================================

INNINGS_TOTAL = 3  # short, snappy matches


class Match:
    def __init__(self, p1: dict, p2: dict):
        self.match_id = str(uuid.uuid4())
        # p1 is home, p2 is away (away bats first = top of inning)
        self.players = {"home": p1, "away": p2}
        self.scores = {"home": 0, "away": 0}
        self.inning = 1
        self.half = "top"  # top = away batting, bottom = home batting
        self.balls = 0
        self.strikes = 0
        self.outs = 0
        self.bases = [False, False, False]
        self.batter_idx = {"home": 0, "away": 0}
        self.pending = {}  # player_id -> selection dict
        self.log: List[dict] = []
        self.over = False
        self.winner: Optional[str] = None
        self.created_at = now_iso()

    @property
    def batting_side(self) -> str:
        return "away" if self.half == "top" else "home"

    @property
    def fielding_side(self) -> str:
        return "home" if self.half == "top" else "away"

    def current_batter(self) -> dict:
        side = self.batting_side
        team = self.players[side]
        roster = get_lineup(team["team_id"])
        idx = self.batter_idx[side] % len(roster)
        return roster[idx]

    def current_pitcher(self) -> dict:
        team = self.players[self.fielding_side]
        roster = get_lineup(team["team_id"])
        # pick first pitcher in roster
        pitchers = [r for r in roster if r.get("role") == "P"]
        return pitchers[0] if pitchers else roster[-1]

    def public_state(self) -> dict:
        batter = self.current_batter()
        pitcher = self.current_pitcher()
        return {
            "match_id": self.match_id,
            "inning": self.inning,
            "half": self.half,
            "balls": self.balls,
            "strikes": self.strikes,
            "outs": self.outs,
            "bases": self.bases,
            "scores": self.scores,
            "batter": batter,
            "pitcher": pitcher,
            "batting_side": self.batting_side,
            "fielding_side": self.fielding_side,
            "players": {
                side: {
                    "player_id": p["player_id"],
                    "nickname": p["nickname"],
                    "team_id": p["team_id"],
                    "team_name": next(t["name"] for t in TEAMS if t["id"] == p["team_id"]),
                    "team_color": next(t["color"] for t in TEAMS if t["id"] == p["team_id"]),
                    "team_accent": next(t["accent"] for t in TEAMS if t["id"] == p["team_id"]),
                    "team_city": next(t["city"] for t in TEAMS if t["id"] == p["team_id"]),
                }
                for side, p in self.players.items()
            },
            "innings_total": INNINGS_TOTAL,
            "over": self.over,
            "winner": self.winner,
            "log": self.log[-20:],
        }

    def role_of(self, player_id: str) -> str:
        """Return 'batter' or 'pitcher' for this player at the current at-bat."""
        if self.players[self.batting_side]["player_id"] == player_id:
            return "batter"
        return "pitcher"


class MatchManager:
    def __init__(self):
        self.queue: List[dict] = []  # list of player ws contexts {player_id, nickname, team_id, ws}
        self.matches: Dict[str, Match] = {}
        self.player_ws: Dict[str, WebSocket] = {}
        self.player_match: Dict[str, str] = {}
        self.lock = asyncio.Lock()

    async def send(self, player_id: str, msg: dict):
        ws = self.player_ws.get(player_id)
        if ws:
            try:
                await ws.send_text(json.dumps(msg))
            except Exception:
                pass

    async def broadcast(self, match: Match, msg: dict):
        for side, p in match.players.items():
            await self.send(p["player_id"], msg)

    async def enqueue(self, player: dict):
        async with self.lock:
            # Remove dupes
            self.queue = [q for q in self.queue if q["player_id"] != player["player_id"]]
            self.queue.append(player)
            if len(self.queue) >= 2:
                p1 = self.queue.pop(0)
                p2 = self.queue.pop(0)
                match = Match(p1, p2)
                self.matches[match.match_id] = match
                self.player_match[p1["player_id"]] = match.match_id
                self.player_match[p2["player_id"]] = match.match_id
                await self.broadcast(match, {"type": "match_start", "state": match.public_state()})
                await self._announce_at_bat(match)
                return match.match_id
        return None

    async def _announce_at_bat(self, match: Match):
        msg = {"type": "at_bat", "state": match.public_state()}
        await self.broadcast(match, msg)

    async def handle_selection(self, player_id: str, selection: dict):
        mid = self.player_match.get(player_id)
        if not mid:
            return
        match = self.matches.get(mid)
        if not match or match.over:
            return
        role = match.role_of(player_id)
        if role == "batter" and selection.get("swing") not in SWING_TYPES:
            return
        if role == "pitcher" and selection.get("pitch") not in PITCH_TYPES:
            return
        match.pending[player_id] = selection
        # If both selections in, resolve
        if len(match.pending) >= 2:
            await self._resolve_pitch(match)

    async def _resolve_pitch(self, match: Match):
        batter_pid = match.players[match.batting_side]["player_id"]
        pitcher_pid = match.players[match.fielding_side]["player_id"]
        batter_sel = match.pending.get(batter_pid, {"swing": "take"})
        pitcher_sel = match.pending.get(pitcher_pid, {"pitch": "fastball"})
        match.pending = {}

        batter = match.current_batter()
        pitcher = match.current_pitcher()
        event = resolve_at_bat(batter, pitcher, pitcher_sel["pitch"], batter_sel["swing"], match.balls, match.strikes)

        # Apply count / outcome
        runs_scored = 0
        ab_over = False
        final_event = event

        if event == "BALL":
            match.balls += 1
            if match.balls >= 4:
                final_event = "WALK"
                runs_scored = advance_bases(match.bases, "WALK")
                ab_over = True
        elif event in ("STRIKE_LOOKING", "STRIKE_SWINGING"):
            match.strikes += 1
            if match.strikes >= 3:
                final_event = "STRIKEOUT"
                match.outs += 1
                ab_over = True
        elif event == "FOUL":
            if match.strikes < 2:
                match.strikes += 1
        elif event == "OUT":
            match.outs += 1
            ab_over = True
        elif event in ("SINGLE", "DOUBLE", "TRIPLE", "HOMER"):
            runs_scored = advance_bases(match.bases, event)
            ab_over = True

        if runs_scored:
            match.scores[match.batting_side] += runs_scored

        # Compose log entry
        line = commentary_for(final_event, batter["name"], pitcher["name"])
        if runs_scored:
            line += f" {runs_scored} run{'s' if runs_scored > 1 else ''} score!"
        entry = {
            "ts": now_iso(),
            "event": final_event,
            "pitch": pitcher_sel["pitch"],
            "swing": batter_sel["swing"],
            "batter": batter["name"],
            "pitcher": pitcher["name"],
            "text": line,
            "runs": runs_scored,
            "inning": match.inning,
            "half": match.half,
        }
        match.log.append(entry)

        # Send pitch_result event
        await self.broadcast(match, {"type": "pitch_result", "entry": entry, "state": match.public_state()})

        if ab_over:
            # Advance batter
            side = match.batting_side
            match.batter_idx[side] += 1
            match.balls = 0
            match.strikes = 0
            # Half-inning over?
            if match.outs >= 3:
                match.outs = 0
                match.bases = [False, False, False]
                if match.half == "top":
                    match.half = "bottom"
                else:
                    match.half = "top"
                    match.inning += 1
                # Check game over
                game_over = False
                if match.inning > INNINGS_TOTAL:
                    game_over = True
                elif match.inning == INNINGS_TOTAL and match.half == "bottom":
                    # If home leads going into bottom, game over (walk-off rule simplified: not used here)
                    pass
                if game_over:
                    await self._end_match(match)
                    return
            await asyncio.sleep(1.2)
            await self._announce_at_bat(match)
        else:
            await asyncio.sleep(0.9)
            await self._announce_at_bat(match)

    async def _end_match(self, match: Match):
        match.over = True
        if match.scores["home"] > match.scores["away"]:
            match.winner = "home"
        elif match.scores["away"] > match.scores["home"]:
            match.winner = "away"
        else:
            # Sudden death: one more half-inning each
            match.winner = "home" if random.random() < 0.5 else "away"
        # Awards
        winner_pid = match.players[match.winner]["player_id"]
        loser_side = "away" if match.winner == "home" else "home"
        loser_pid = match.players[loser_side]["player_id"]
        # Bonus item chance on win
        bonus_item = None
        winner_doc = await db.players.find_one({"player_id": winner_pid})
        if winner_doc:
            pool = [i for i in REWARD_ITEMS if i["id"] not in winner_doc.get("items", [])]
            if pool and random.random() < 0.25:
                bonus_item = random.choice(pool)
        win_update = {"$inc": {"wins": 1, "coins": 150}}
        if bonus_item:
            win_update["$push"] = {"items": bonus_item["id"]}
        await db.players.update_one({"player_id": winner_pid}, win_update)
        await db.players.update_one({"player_id": loser_pid}, {"$inc": {"losses": 1, "coins": 50}})
        # Save match
        await db.matches.insert_one(
            {
                "match_id": match.match_id,
                "home": match.players["home"],
                "away": match.players["away"],
                "scores": match.scores,
                "winner_pid": winner_pid,
                "ended_at": now_iso(),
                "log": match.log,
            }
        )
        await self.broadcast(
            match,
            {
                "type": "match_over",
                "state": match.public_state(),
                "winner_player_id": winner_pid,
                "rewards": {
                    "winner": {"coins": 150, "item": bonus_item},
                    "loser": {"coins": 50},
                },
            },
        )
        # Cleanup
        self.matches.pop(match.match_id, None)
        for side in ("home", "away"):
            pid = match.players[side]["player_id"]
            self.player_match.pop(pid, None)

    async def disconnect(self, player_id: str):
        self.player_ws.pop(player_id, None)
        # Remove from queue
        async with self.lock:
            self.queue = [q for q in self.queue if q["player_id"] != player_id]
        mid = self.player_match.get(player_id)
        if mid and mid in self.matches:
            match = self.matches[mid]
            if not match.over:
                # Award win to remaining player
                other_side = "home" if match.players["away"]["player_id"] == player_id else "away"
                match.winner = other_side
                match.over = True
                other_pid = match.players[other_side]["player_id"]
                await db.players.update_one({"player_id": other_pid}, {"$inc": {"wins": 1, "coins": 100}})
                await db.players.update_one({"player_id": player_id}, {"$inc": {"losses": 1}})
                await self.broadcast(match, {"type": "opponent_left", "state": match.public_state(), "winner_player_id": other_pid})
                self.matches.pop(match.match_id, None)
            self.player_match.pop(player_id, None)


mgr = MatchManager()


@app.websocket("/api/ws/{player_id}")
async def websocket_endpoint(ws: WebSocket, player_id: str):
    await ws.accept()
    mgr.player_ws[player_id] = ws
    try:
        await ws.send_text(json.dumps({"type": "connected", "player_id": player_id}))
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            mtype = msg.get("type")
            if mtype == "join_queue":
                player = await db.players.find_one({"player_id": player_id})
                if not player:
                    await ws.send_text(json.dumps({"type": "error", "message": "Player not found"}))
                    continue
                team_id = msg.get("team_id", "NYC")
                if not any(t["id"] == team_id for t in TEAMS):
                    team_id = "NYC"
                await mgr.enqueue(
                    {
                        "player_id": player_id,
                        "nickname": player["nickname"],
                        "team_id": team_id,
                    }
                )
                await ws.send_text(json.dumps({"type": "queued"}))
            elif mtype == "leave_queue":
                async with mgr.lock:
                    mgr.queue = [q for q in mgr.queue if q["player_id"] != player_id]
                await ws.send_text(json.dumps({"type": "left_queue"}))
            elif mtype == "select":
                await mgr.handle_selection(player_id, msg.get("selection", {}))
            elif mtype == "ping":
                await ws.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        await mgr.disconnect(player_id)
    except Exception as e:
        logger.exception("ws error: %s", e)
        await mgr.disconnect(player_id)


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
