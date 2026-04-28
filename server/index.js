import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  createBingoCard,
  getBingoLines,
  hasBingo,
  normalizeMarkedIds,
  normalizeText,
  parseItemList,
  sanitizeCode,
  sanitizeName,
  toggleMarkedId
} from "../shared/gameLogic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 6680);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gamesByCode = new Map();

function now() {
  return new Date().toISOString();
}

function makeId() {
  return crypto.randomUUID();
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 5 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  } while (gamesByCode.has(code));
  return code;
}

function secureCompare(expectedValue, receivedValue) {
  if (!expectedValue || !receivedValue) return false;
  const expected = Buffer.from(String(expectedValue));
  const received = Buffer.from(String(receivedValue));
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function acknowledge(callback, payload) {
  if (typeof callback === "function") callback(payload);
}

function sendError(socket, callback, message, code = "BAD_REQUEST") {
  const payload = { ok: false, code, message };
  if (typeof callback === "function") {
    callback(payload);
    return;
  }
  socket.emit("error", payload);
}

function findGame(rawCode) {
  return gamesByCode.get(sanitizeCode(rawCode));
}

function canHost(game, hostToken) {
  return Boolean(game && secureCompare(game.hostToken, hostToken));
}

function calledItems(game) {
  return game.items.slice(0, game.calledCount).map((label, index) => ({
    label,
    index,
    calledAt: game.calledAt[index]
  }));
}

function serializePlayer(player, role) {
  const base = {
    id: player.id,
    name: player.name,
    status: player.status,
    markedCount: player.markedIds.length,
    bingoLines: player.bingoLines,
    joinedAt: player.joinedAt,
    bingoAt: player.bingoAt
  };
  if (role === "player") {
    return {
      ...base,
      card: player.card,
      markedIds: player.markedIds
    };
  }
  return base;
}

function serializeGame(game, viewer = {}) {
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
    viewer: {
      role,
      playerId: viewer.playerId || null
    }
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

function serializeSummary(game) {
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

function listAvailableGames() {
  return Array.from(gamesByCode.values())
    .filter((game) => game.status === "active")
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(serializeSummary);
}

function emitGameList() {
  io.emit("games:list", { ok: true, rooms: listAvailableGames() });
}

function emitHostState(game) {
  io.to(`host:${game.id}`).emit("game:state", serializeGame(game, { role: "host" }));
}

function emitPlayerState(game, playerId) {
  io.to(`player:${playerId}`).emit("game:state", serializeGame(game, { role: "player", playerId }));
}

function emitAllStates(game) {
  emitHostState(game);
  for (const player of game.players.values()) {
    emitPlayerState(game, player.id);
  }
}

function joinViewerRooms(socket, game, viewer) {
  socket.join(`game:${game.id}`);
  if (viewer.role === "host") socket.join(`host:${game.id}`);
  if (viewer.playerId) socket.join(`player:${viewer.playerId}`);
}

io.on("connection", (socket) => {
  socket.on("games:list", (_payload = {}, callback) => {
    acknowledge(callback, { ok: true, rooms: listAvailableGames() });
  });

  socket.on("game:create", (payload = {}, callback) => {
    const title = normalizeText(payload.title) || "Bingo vui";
    const items = parseItemList(payload.items);

    if (items.length < 24) {
      sendError(socket, callback, "Bingo cần ít nhất 24 mục khác nhau.", "ITEMS_REQUIRED");
      return;
    }

    const game = {
      id: makeId(),
      code: makeCode(),
      title,
      items,
      calledCount: 0,
      calledAt: [],
      hostToken: crypto.randomBytes(24).toString("hex"),
      status: "active",
      createdAt: now(),
      players: new Map()
    };

    gamesByCode.set(game.code, game);
    joinViewerRooms(socket, game, { role: "host" });

    const state = serializeGame(game, { role: "host" });
    const response = { ok: true, state, hostToken: game.hostToken };
    socket.emit("game:created", response);
    acknowledge(callback, response);
    emitGameList();
  });

  socket.on("game:get", (payload = {}, callback) => {
    const game = findGame(payload.code);
    if (!game) {
      sendError(socket, callback, "Không tìm thấy phòng Bingo.", "GAME_NOT_FOUND");
      return;
    }

    if (payload.role === "host") {
      if (!canHost(game, payload.hostToken)) {
        sendError(socket, callback, "Mã chủ game không hợp lệ.", "HOST_TOKEN_INVALID");
        return;
      }
      joinViewerRooms(socket, game, { role: "host" });
      const state = serializeGame(game, { role: "host" });
      acknowledge(callback, { ok: true, state });
      socket.emit("game:state", state);
      return;
    }

    const player = game.players.get(String(payload.playerId || ""));
    if (!player) {
      sendError(socket, callback, "Không tìm thấy người chơi trong phòng này.", "PLAYER_NOT_FOUND");
      return;
    }
    joinViewerRooms(socket, game, { role: "player", playerId: player.id });
    const state = serializeGame(game, { role: "player", playerId: player.id });
    acknowledge(callback, { ok: true, state, playerId: player.id });
    socket.emit("game:state", state);
  });

  socket.on("game:join", (payload = {}, callback) => {
    const game = findGame(payload.code);
    const name = sanitizeName(payload.name);

    if (!game) {
      sendError(socket, callback, "Mã phòng không tồn tại.", "GAME_NOT_FOUND");
      return;
    }
    if (game.status !== "active") {
      sendError(socket, callback, "Phòng này đã kết thúc. Vui lòng chọn phòng khác.", "GAME_FINISHED");
      return;
    }
    if (!name) {
      sendError(socket, callback, "Vui lòng nhập tên hiển thị.", "NAME_REQUIRED");
      return;
    }

    const player = {
      id: makeId(),
      name,
      card: createBingoCard(game.items),
      markedIds: [],
      status: "playing",
      bingoLines: [],
      joinedAt: now(),
      bingoAt: null
    };
    game.players.set(player.id, player);
    joinViewerRooms(socket, game, { role: "player", playerId: player.id });

    const state = serializeGame(game, { role: "player", playerId: player.id });
    const response = { ok: true, state, playerId: player.id };
    socket.emit("game:state", state);
    acknowledge(callback, response);
    emitHostState(game);
    emitGameList();
  });

  socket.on("call:next", (payload = {}, callback) => {
    const game = findGame(payload.code);
    if (!game || !canHost(game, payload.hostToken)) {
      sendError(socket, callback, "Bạn không có quyền gọi mục trong phòng này.", "HOST_TOKEN_INVALID");
      return;
    }
    if (game.status !== "active") {
      sendError(socket, callback, "Phòng này đã kết thúc.", "GAME_FINISHED");
      return;
    }
    if (game.calledCount >= game.items.length) {
      sendError(socket, callback, "Đã gọi hết tất cả mục.", "NO_ITEMS_LEFT");
      return;
    }

    game.calledAt[game.calledCount] = now();
    game.calledCount += 1;
    emitAllStates(game);
    acknowledge(callback, { ok: true, state: serializeGame(game, { role: "host" }) });
  });

  socket.on("card:toggle", (payload = {}, callback) => {
    const game = findGame(payload.code);
    const player = game?.players.get(String(payload.playerId || ""));
    if (!game || !player) {
      sendError(socket, callback, "Không tìm thấy người chơi hoặc phòng chơi.", "PLAYER_NOT_FOUND");
      return;
    }
    if (game.status !== "active") {
      sendError(socket, callback, "Phòng này đã kết thúc.", "GAME_FINISHED");
      return;
    }

    player.markedIds = toggleMarkedId(player.card, player.markedIds, String(payload.cellId || ""), calledItems(game));
    emitPlayerState(game, player.id);
    emitHostState(game);
    acknowledge(callback, { ok: true, state: serializeGame(game, { role: "player", playerId: player.id }) });
  });

  socket.on("bingo:claim", (payload = {}, callback) => {
    const game = findGame(payload.code);
    const player = game?.players.get(String(payload.playerId || ""));
    if (!game || !player) {
      sendError(socket, callback, "Không tìm thấy người chơi hoặc phòng chơi.", "PLAYER_NOT_FOUND");
      return;
    }

    player.markedIds = normalizeMarkedIds(player.card, player.markedIds, calledItems(game));
    if (!hasBingo(player.card, player.markedIds)) {
      emitPlayerState(game, player.id);
      sendError(socket, callback, "Chưa đủ hàng Bingo. Kiểm tra lại các ô đã đánh dấu nhé.", "BINGO_INVALID");
      return;
    }

    player.status = "bingo";
    player.bingoLines = getBingoLines(player.card, player.markedIds);
    player.bingoAt = player.bingoAt || now();
    emitAllStates(game);
    acknowledge(callback, { ok: true, state: serializeGame(game, { role: "player", playerId: player.id }) });
  });

  socket.on("game:finish", (payload = {}, callback) => {
    const game = findGame(payload.code);
    if (!game || !canHost(game, payload.hostToken)) {
      sendError(socket, callback, "Bạn không có quyền kết thúc phòng này.", "HOST_TOKEN_INVALID");
      return;
    }
    game.status = "finished";
    emitAllStates(game);
    emitGameList();
    acknowledge(callback, { ok: true });
  });
});

app.use(express.static(distDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Bingo listening at http://${HOST}:${PORT}`);
});
