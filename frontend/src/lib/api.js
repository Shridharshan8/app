import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const WS_URL = (() => {
  if (!BACKEND_URL) return "";
  const u = new URL(BACKEND_URL);
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${u.host}/api/ws`;
})();

export const api = axios.create({ baseURL: API, timeout: 15000 });

export const createGuest = (nickname) =>
  api.post("/guest", { nickname }).then((r) => r.data);
export const getProfile = (id) => api.get(`/profile/${id}`).then((r) => r.data);
export const claimDaily = (id) =>
  api.post(`/profile/${id}/daily`).then((r) => r.data);
export const listTeams = () => api.get("/teams").then((r) => r.data);
export const getLeaderboard = () => api.get("/leaderboard").then((r) => r.data);
export const listItems = () => api.get("/items").then((r) => r.data);
