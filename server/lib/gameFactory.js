import { DEFAULT_ROOM_TITLE } from "../../shared/constants.js";
import { createBingoCard, normalizeText } from "../../shared/gameLogic.js";
import { makeHostToken, makeId, makeRoomCode } from "./crypto.js";
import { hasGameCode, now } from "./gameStore.js";

export function createGame({ title, items }) {
  return {
    id: makeId(),
    code: makeRoomCode(hasGameCode),
    title: normalizeText(title) || DEFAULT_ROOM_TITLE,
    items,
    calledCount: 0,
    calledAt: [],
    hostToken: makeHostToken(),
    status: "active",
    createdAt: now(),
    players: new Map()
  };
}

export function createPlayer(name, items) {
  return {
    id: makeId(),
    name,
    card: createBingoCard(items),
    markedIds: [],
    status: "playing",
    bingoLines: [],
    joinedAt: now(),
    bingoAt: null
  };
}

export function callNextItem(game) {
  game.calledAt[game.calledCount] = now();
  game.calledCount += 1;
}

export function applyBingoClaim(player, lines) {
  player.status = "bingo";
  player.bingoLines = lines;
  player.bingoAt = player.bingoAt || now();
}
