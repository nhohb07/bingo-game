import { FormEvent, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { HOST_SESSION_KEY, PLAYER_NAME_KEY, PLAYER_SESSION_KEY, DEFAULT_ROOM_TITLE, SOCKET_URL } from "./constants";
import { RulesModal } from "./components/RulesModal";
import { TopBar } from "./components/TopBar";
import { pickRandomBingoItems } from "./data/wordBank";
import { sampleItems } from "./data/sampleItems";
import { CreateScreen } from "./screens/CreateScreen";
import { HostScreen } from "./screens/HostScreen";
import { JoinScreen } from "./screens/JoinScreen";
import { PlayerScreen } from "./screens/PlayerScreen";
import { RoleScreen } from "./screens/RoleScreen";
import type { GameState, GameSummary, Screen, SocketResponse } from "./types";
import { readJson, tidyCode } from "./utils";

type HostSession = { code: string; hostToken: string };
type PlayerSession = { code: string; playerId: string };

function App() {
  const socket = useMemo<Socket>(
    () => io(SOCKET_URL, { transports: ["websocket"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelayMax: 5000, timeout: 20000 }),
    []
  );

  const [screen, setScreen] = useState<Screen>("role");
  const [game, setGame] = useState<GameState | null>(null);
  const [rooms, setRooms] = useState<GameSummary[]>([]);
  const [hostToken, setHostToken] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(socket.connected);
  const [restoreTried, setRestoreTried] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [title, setTitle] = useState(DEFAULT_ROOM_TITLE);
  const [items, setItems] = useState(sampleItems);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(PLAYER_NAME_KEY) || "");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const onConnect = () => {
      setRestoreTried(false);
      setConnected(true);
    };
    const onDisconnect = () => setConnected(false);
    const onState = (state: GameState) => {
      setGame(state);
      setScreen(state.viewer.role === "host" ? "host" : "player");
    };
    const onList = (response: SocketResponse) => {
      if (response.ok && response.rooms) setRooms(response.rooms);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game:state", onState);
    socket.on("games:list", onList);
    socket.emit("games:list", {}, onList);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game:state", onState);
      socket.off("games:list", onList);
    };
  }, [socket]);

  useEffect(() => {
    if (restoreTried || !connected) return;
    setRestoreTried(true);
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = tidyCode(params.get("code") || "");
    const hostSession = readJson<HostSession>(HOST_SESSION_KEY);
    const playerSession = readJson<PlayerSession>(PLAYER_SESSION_KEY);

    if (hostSession?.code && hostSession.hostToken && (!codeFromUrl || codeFromUrl === hostSession.code)) {
      socket.emit("game:get", { code: hostSession.code, role: "host", hostToken: hostSession.hostToken }, (response: SocketResponse) => {
        if (response.ok && response.state) {
          setHostToken(hostSession.hostToken);
          setGame(response.state);
          setScreen("host");
        } else {
          localStorage.removeItem(HOST_SESSION_KEY);
        }
      });
      return;
    }

    if (playerSession?.code && playerSession.playerId && (!codeFromUrl || codeFromUrl === playerSession.code)) {
      socket.emit("game:get", { code: playerSession.code, playerId: playerSession.playerId }, (response: SocketResponse) => {
        if (response.ok && response.state && response.playerId) {
          setPlayerId(response.playerId);
          setGame(response.state);
          setScreen("player");
        } else {
          localStorage.removeItem(PLAYER_SESSION_KEY);
        }
      });
      return;
    }

    if (codeFromUrl) {
      setJoinCode(codeFromUrl);
      setScreen("join");
    }
  }, [connected, restoreTried, socket]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function handleResponse(response: SocketResponse, nextScreen: Screen) {
    if (!response.ok || !response.state) {
      setNotice(response.message || "Có lỗi xảy ra.");
      return;
    }
    setGame(response.state);
    setScreen(nextScreen);
  }

  function createRoom(event: FormEvent) {
    event.preventDefault();
    socket.emit("game:create", { title, items }, (response: SocketResponse) => {
      if (!response.ok || !response.state || !response.hostToken) {
        setNotice(response.message || "Không tạo được phòng.");
        return;
      }
      setHostToken(response.hostToken);
      localStorage.setItem(HOST_SESSION_KEY, JSON.stringify({ code: response.state.code, hostToken: response.hostToken }));
      window.history.replaceState(null, "", `?code=${response.state.code}`);
      handleResponse(response, "host");
    });
  }

  function randomizeItems() {
    setItems(pickRandomBingoItems().join("\n"));
    setNotice("Đã random 36 mục từ kho từ/cụm từ.");
  }

  function joinRoom(code = joinCode) {
    const cleanCode = tidyCode(code);
    const name = playerName.trim();
    if (!cleanCode || !name) {
      setNotice("Nhập tên và mã phòng để tham gia.");
      return;
    }
    localStorage.setItem(PLAYER_NAME_KEY, name);
    socket.emit("game:join", { code: cleanCode, name }, (response: SocketResponse) => {
      if (!response.ok || !response.state || !response.playerId) {
        setNotice(response.message || "Không tham gia được phòng.");
        return;
      }
      setPlayerId(response.playerId);
      localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({ code: response.state.code, playerId: response.playerId }));
      window.history.replaceState(null, "", `?code=${response.state.code}`);
      handleResponse(response, "player");
    });
  }

  function callNext() {
    if (!game) return;
    socket.emit("call:next", { code: game.code, hostToken }, (response: SocketResponse) => {
      if (!response.ok) setNotice(response.message || "Không gọi được mục tiếp theo.");
    });
  }

  function toggleCell(cellId: string) {
    if (!game || !playerId) return;
    const previousMarkedIds = game.player?.markedIds || [];
    const previousMarkedCount = game.player?.markedCount || 0;
    const cell = game.player?.card?.find((item) => item.id === cellId);

    if (cell && !cell.free) {
      setGame((current) => {
        if (!current?.player || current.player.id !== playerId) return current;
        const marked = new Set(current.player.markedIds || []);
        if (marked.has(cellId)) marked.delete(cellId);
        else marked.add(cellId);
        const markedIds = Array.from(marked);
        return { ...current, player: { ...current.player, markedIds, markedCount: markedIds.length } };
      });
    }

    socket.emit("card:toggle", { code: game.code, playerId, cellId }, (response: SocketResponse) => {
      if (!response.ok) {
        setGame((current) => {
          if (!current?.player || current.player.id !== playerId) return current;
          return { ...current, player: { ...current.player, markedIds: previousMarkedIds, markedCount: previousMarkedCount } };
        });
        setNotice(response.message || "Ô này chưa được gọi.");
      }
    });
  }

  function claimBingo() {
    if (!game || !playerId) return;
    socket.emit("bingo:claim", { code: game.code, playerId }, (response: SocketResponse) => {
      if (!response.ok) setNotice(response.message || "Chưa đủ Bingo.");
    });
  }

  function finishGame() {
    if (!game) return;
    socket.emit("game:finish", { code: game.code, hostToken }, (response: SocketResponse) => {
      if (!response.ok) setNotice(response.message || "Không kết thúc được phòng.");
    });
  }

  function refreshRooms() {
    socket.emit("games:list", {}, (response: SocketResponse) => {
      if (response.ok && response.rooms) setRooms(response.rooms);
    });
  }

  function goHome() {
    setScreen("role");
    setGame(null);
    setNotice("");
    window.history.replaceState(null, "", window.location.pathname);
  }

  const winners = game?.players?.filter((player) => player.status === "bingo").sort((left, right) => new Date(left.bingoAt || 0).getTime() - new Date(right.bingoAt || 0).getTime()) || [];

  return (
    <main className="app-shell">
      <TopBar connected={connected} onHome={goHome} onOpenRules={() => setRulesOpen(true)} />
      {notice && <div className="toast">{notice}</div>}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {screen === "role" && <RoleScreen onCreate={() => setScreen("create")} onJoin={() => { refreshRooms(); setScreen("join"); }} />}
      {screen === "create" && <CreateScreen items={items} title={title} onBack={goHome} onRandomize={randomizeItems} onSubmit={createRoom} onUpdateItems={setItems} onUpdateTitle={setTitle} />}
      {screen === "join" && <JoinScreen joinCode={joinCode} playerName={playerName} rooms={rooms} onBack={goHome} onJoin={joinRoom} onRefresh={refreshRooms} onUpdateCode={(value) => setJoinCode(tidyCode(value))} onUpdateName={setPlayerName} />}
      {screen === "host" && game && <HostScreen game={game} winners={winners} onCallNext={callNext} onFinishGame={finishGame} />}
      {screen === "player" && game?.player && <PlayerScreen game={game} onClaimBingo={claimBingo} onToggleCell={toggleCell} />}
    </main>
  );
}

export default App;
