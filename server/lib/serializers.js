import { listGames } from "./gameStore.js";

export function calledItems(game) {
  return game.items.slice(0, game.calledCount).map((label, index) => ({
    label,
    index,
    calledAt: game.calledAt[index]
  }));
}

export function serializePlayer(player, role) {
  const base = {
    id: player.id,
    name: player.name,
    status: player.status,
    markedCount: player.markedIds.length,
    bingoLines: player.bingoLines,
    joinedAt: player.joinedAt,
    bingoAt: player.bingoAt
  };
  if (role === "player") return { ...base, card: player.card, markedIds: player.markedIds };
  return base;
}

export function serializeGame(game, viewer = {}) {
  const role = viewer.role === "host" ? "host" : "player";
  const state = {
    id: game.id,
    code: game.code,
    title: game.title,
    status: game.status,
    itemCount: game.items.length,
    calledCount: game.calledCount,
    calledItems: calledItems(game),
    currentItem: game.calledCount > 0 ? game.items[game.calledCount - 1] : null,
    createdAt: game.createdAt,
    viewer: { role, playerId: viewer.playerId || null }
  };

  if (role === "host") {
    state.items = game.items;
    state.players = Array.from(game.players.values()).map((player) => serializePlayer(player, "host"));
    return state;
  }

  const player = viewer.playerId ? game.players.get(viewer.playerId) : null;
  state.player = player ? serializePlayer(player, "player") : null;
  return state;
}

export function serializeSummary(game) {
  return {
    code: game.code,
    title: game.title,
    status: game.status,
    itemCount: game.items.length,
    calledCount: game.calledCount,
    playerCount: game.players.size,
    createdAt: game.createdAt
  };
}

export function listAvailableGameSummaries() {
  return listGames()
    .filter((game) => game.status === "active")
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(serializeSummary);
}
