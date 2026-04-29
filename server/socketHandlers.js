import { MIN_BINGO_ITEMS } from "../shared/constants.js";
import { getBingoLines, hasBingo, normalizeMarkedIds, parseItemList, sanitizeName, toggleMarkedId } from "../shared/gameLogic.js";
import { secureCompare } from "./lib/crypto.js";
import { applyBingoClaim, callNextItem, createGame, createPlayer } from "./lib/gameFactory.js";
import { findGame, saveGame } from "./lib/gameStore.js";
import { calledItems, listAvailableGameSummaries, serializeGame } from "./lib/serializers.js";
import { acknowledge, sendError } from "./lib/socketResponses.js";

function canHost(game, hostToken) {
  return Boolean(game && secureCompare(game.hostToken, hostToken));
}

function joinViewerRooms(socket, game, viewer) {
  socket.join(`game:${game.id}`);
  if (viewer.role === "host") socket.join(`host:${game.id}`);
  if (viewer.playerId) socket.join(`player:${viewer.playerId}`);
}

function emitGameList(io) {
  io.emit("games:list", { ok: true, rooms: listAvailableGameSummaries() });
}

function emitHostState(io, game) {
  io.to(`host:${game.id}`).emit("game:state", serializeGame(game, { role: "host" }));
}

function emitPlayerState(io, game, playerId) {
  io.to(`player:${playerId}`).emit("game:state", serializeGame(game, { role: "player", playerId }));
}

function emitAllStates(io, game) {
  emitHostState(io, game);
  for (const player of game.players.values()) emitPlayerState(io, game, player.id);
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("games:list", (_payload = {}, callback) => {
      acknowledge(callback, { ok: true, rooms: listAvailableGameSummaries() });
    });

    socket.on("game:create", (payload = {}, callback) => {
      const items = parseItemList(payload.items);
      if (items.length < MIN_BINGO_ITEMS) {
        sendError(socket, callback, `Bingo cần ít nhất ${MIN_BINGO_ITEMS} mục khác nhau.`, "ITEMS_REQUIRED");
        return;
      }

      const game = createGame({ title: payload.title, items });
      saveGame(game);
      joinViewerRooms(socket, game, { role: "host" });

      const state = serializeGame(game, { role: "host" });
      const response = { ok: true, state, hostToken: game.hostToken };
      socket.emit("game:created", response);
      acknowledge(callback, response);
      emitGameList(io);
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

      const player = createPlayer(name, game.items);
      game.players.set(player.id, player);
      joinViewerRooms(socket, game, { role: "player", playerId: player.id });

      const state = serializeGame(game, { role: "player", playerId: player.id });
      const response = { ok: true, state, playerId: player.id };
      socket.emit("game:state", state);
      acknowledge(callback, response);
      emitHostState(io, game);
      emitGameList(io);
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

      callNextItem(game);
      emitAllStates(io, game);
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
      emitPlayerState(io, game, player.id);
      emitHostState(io, game);
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
        emitPlayerState(io, game, player.id);
        sendError(socket, callback, "Chưa đủ hàng Bingo. Kiểm tra lại các ô đã đánh dấu nhé.", "BINGO_INVALID");
        return;
      }

      applyBingoClaim(player, getBingoLines(player.card, player.markedIds));
      emitAllStates(io, game);
      acknowledge(callback, { ok: true, state: serializeGame(game, { role: "player", playerId: player.id }) });
    });

    socket.on("game:finish", (payload = {}, callback) => {
      const game = findGame(payload.code);
      if (!game || !canHost(game, payload.hostToken)) {
        sendError(socket, callback, "Bạn không có quyền kết thúc phòng này.", "HOST_TOKEN_INVALID");
        return;
      }
      game.status = "finished";
      emitAllStates(io, game);
      emitGameList(io);
      acknowledge(callback, { ok: true });
    });
  });
}
