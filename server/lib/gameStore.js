import { sanitizeCode } from "../../shared/gameLogic.js";

const gamesByCode = new Map();

export function now() {
  return new Date().toISOString();
}

export function hasGameCode(code) {
  return gamesByCode.has(code);
}

export function findGame(rawCode) {
  return gamesByCode.get(sanitizeCode(rawCode));
}

export function saveGame(game) {
  gamesByCode.set(game.code, game);
}

export function listGames() {
  return Array.from(gamesByCode.values());
}
