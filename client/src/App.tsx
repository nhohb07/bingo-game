import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCopy,
  Crown,
  HelpCircle,
  Home,
  ListChecks,
  Play,
  RefreshCw,
  Shuffle,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { buildMeaningfulWordBank, pickRandomBingoItems } from "./wordBank";

type Screen = "role" | "create" | "join" | "host" | "player";
type PlayerStatus = "playing" | "bingo";

type BingoCell = {
  id: string;
  label: string;
  row: number;
  col: number;
  free: boolean;
};

type CalledItem = {
  label: string;
  index: number;
  calledAt: string;
};

type Player = {
  id: string;
  name: string;
  status: PlayerStatus;
  markedCount: number;
  bingoLines: Array<{ type: string; index: number }>;
  joinedAt: string;
  bingoAt: string | null;
  card?: BingoCell[];
  markedIds?: string[];
};

type GameSummary = {
  code: string;
  title: string;
  status: "active" | "finished";
  itemCount: number;
  calledCount: number;
  playerCount: number;
  createdAt: string;
};

type GameState = {
  id: string;
  code: string;
  title: string;
  status: "active" | "finished";
  itemCount: number;
  calledCount: number;
  calledItems: CalledItem[];
  currentItem: string | null;
  items?: string[];
  players?: Player[];
  player?: Player | null;
  viewer: {
    role: "host" | "player";
    playerId: string | null;
  };
};

type SocketResponse = {
  ok: boolean;
  message?: string;
  state?: GameState;
  hostToken?: string;
  playerId?: string;
  rooms?: GameSummary[];
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const HOST_SESSION = "bingo-host";
const PLAYER_SESSION = "bingo-player";
const PLAYER_NAME = "bingo-player-name";
const WORD_BANK_SIZE = buildMeaningfulWordBank().length;

const sampleItems = [
  "Quả táo",
  "Quả cam",
  "Bút chì",
  "Cục tẩy",
  "Quyển sách",
  "Cái ghế",
  "Cái bàn",
  "Mặt trời",
  "Mặt trăng",
  "Ngôi sao",
  "Con mèo",
  "Con chó",
  "Xe đạp",
  "Xe buýt",
  "Bông hoa",
  "Cầu vồng",
  "Cái mũ",
  "Đôi giày",
  "Cái cặp",
  "Thước kẻ",
  "Bảng đen",
  "Viên phấn",
  "Cánh cửa",
  "Cửa sổ",
  "Đồng hồ",
  "Ly nước",
  "Bánh mì",
  "Trái bóng",
  "Cây xanh",
  "Đám mây"
].join("\n");

function tidyCode(value: string) {
  return value.toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function App() {
  const socket = useMemo<Socket>(() => io(socketUrl), []);
  const [screen, setScreen] = useState<Screen>("role");
  const [game, setGame] = useState<GameState | null>(null);
  const [rooms, setRooms] = useState<GameSummary[]>([]);
  const [hostToken, setHostToken] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(socket.connected);
  const [restoreTried, setRestoreTried] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const [title, setTitle] = useState("Bingo lớp mình");
  const [items, setItems] = useState(sampleItems);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(PLAYER_NAME) || "");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const onConnect = () => setConnected(true);
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
    const hostSession = JSON.parse(localStorage.getItem(HOST_SESSION) || "null") as null | { code: string; hostToken: string };
    const playerSession = JSON.parse(localStorage.getItem(PLAYER_SESSION) || "null") as null | { code: string; playerId: string };

    if (hostSession?.code && hostSession.hostToken && (!codeFromUrl || codeFromUrl === hostSession.code)) {
      socket.emit("game:get", { code: hostSession.code, role: "host", hostToken: hostSession.hostToken }, (response: SocketResponse) => {
        if (response.ok && response.state) {
          setHostToken(hostSession.hostToken);
          setGame(response.state);
          setScreen("host");
        } else {
          localStorage.removeItem(HOST_SESSION);
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
          localStorage.removeItem(PLAYER_SESSION);
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

  function createGame(event: FormEvent) {
    event.preventDefault();
    socket.emit("game:create", { title, items }, (response: SocketResponse) => {
      if (!response.ok || !response.state || !response.hostToken) {
        setNotice(response.message || "Không tạo được phòng.");
        return;
      }
      setHostToken(response.hostToken);
      localStorage.setItem(HOST_SESSION, JSON.stringify({ code: response.state.code, hostToken: response.hostToken }));
      window.history.replaceState(null, "", `?code=${response.state.code}`);
      handleResponse(response, "host");
    });
  }

  function randomizeItems() {
    setItems(pickRandomBingoItems().join("\n"));
    setNotice(`Đã random 36 mục từ kho ${WORD_BANK_SIZE} từ/cụm từ.`);
  }

  function joinGame(code = joinCode) {
    const cleanCode = tidyCode(code);
    const name = playerName.trim();
    if (!cleanCode || !name) {
      setNotice("Nhập tên và mã phòng để tham gia.");
      return;
    }
    localStorage.setItem(PLAYER_NAME, name);
    socket.emit("game:join", { code: cleanCode, name }, (response: SocketResponse) => {
      if (!response.ok || !response.state || !response.playerId) {
        setNotice(response.message || "Không tham gia được phòng.");
        return;
      }
      setPlayerId(response.playerId);
      localStorage.setItem(PLAYER_SESSION, JSON.stringify({ code: response.state.code, playerId: response.playerId }));
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
    socket.emit("card:toggle", { code: game.code, playerId, cellId }, (response: SocketResponse) => {
      if (!response.ok) setNotice(response.message || "Ô này chưa được gọi.");
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

  const winners = game?.players?.filter((player) => player.status === "bingo").sort((a, b) => {
    return new Date(a.bingoAt || 0).getTime() - new Date(b.bingoAt || 0).getTime();
  }) || [];

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goHome}>
          <span className="brand-mark"><ListChecks size={22} /></span>
          <span>Bingo Vui</span>
        </button>
        <div className="topbar-actions">
          <button className="soft-button rules-button" onClick={() => setRulesOpen(true)}>
            <HelpCircle size={18} /> Luật chơi
          </button>
          <span className={`connection ${connected ? "online" : ""}`}>
            <span />
            {connected ? "Realtime" : "Mất kết nối"}
          </span>
        </div>
      </header>

      {notice && <div className="toast">{notice}</div>}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}

      {screen === "role" && (
        <section className="role-stage">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={18} /> Phòng chơi nhanh cho lớp học</span>
            <h1>Bingo Vui</h1>
          </div>
          <div className="role-grid">
            <button className="role-card host-card" onClick={() => setScreen("create")}>
              <Crown size={42} />
              <strong>Chủ game</strong>
              <span>Tạo danh sách mục, gọi từng mục và xem ai Bingo trước.</span>
            </button>
            <button className="role-card player-card" onClick={() => { refreshRooms(); setScreen("join"); }}>
              <Users size={42} />
              <strong>Người chơi</strong>
              <span>Vào phòng, nhận bảng 5x5 riêng và bấm Bingo khi đủ hàng.</span>
            </button>
          </div>
        </section>
      )}

      {screen === "create" && (
        <section className="form-stage">
          <StageHeader title="Tạo phòng Bingo" onBack={goHome} />
          <form className="panel form-grid" onSubmit={createGame}>
            <label>
              Tên phòng
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={48} />
            </label>
            <label>
              Danh sách mục gọi
              <textarea value={items} onChange={(event) => setItems(event.target.value)} rows={12} />
            </label>
            <div className="form-actions">
              <button className="soft-button" type="button" onClick={randomizeItems}>
                <Shuffle size={18} /> Random từ kho {WORD_BANK_SIZE}
              </button>
              <button className="primary-action" type="submit"><Play size={18} /> Tạo phòng</button>
            </div>
            <p className="hint-line">Cần ít nhất 24 mục khác nhau. Có thể nhập tay hoặc random 36 mục từ kho khoảng 1000 từ/cụm từ có nghĩa.</p>
          </form>
        </section>
      )}

      {screen === "join" && (
        <section className="form-stage">
          <StageHeader title="Tham gia Bingo" onBack={goHome} />
          <div className="panel form-grid">
            <label>
              Tên hiển thị
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={32} />
            </label>
            <label>
              Mã phòng
              <input value={joinCode} onChange={(event) => setJoinCode(tidyCode(event.target.value))} />
            </label>
            <button className="primary-action" onClick={() => joinGame()}><Play size={18} /> Vào phòng</button>
          </div>
          <section className="panel room-list">
            <div className="section-title">
              <h2>Phòng đang mở</h2>
              <button className="icon-button" onClick={refreshRooms} title="Tải lại"><RefreshCw size={18} /></button>
            </div>
            {rooms.length === 0 ? (
              <p className="empty">Chưa có phòng Bingo nào đang mở.</p>
            ) : rooms.map((room) => (
              <button className="room-row" key={room.code} onClick={() => joinGame(room.code)}>
                <span>
                  <strong>{room.title}</strong>
                  <small>{room.code} · {room.playerCount} người · {room.calledCount}/{room.itemCount} mục</small>
                </span>
                <Play size={18} />
              </button>
            ))}
          </section>
        </section>
      )}

      {screen === "host" && game && (
        <section className="dashboard">
          <div className="host-layout">
            <section className="panel call-panel">
              <div className="room-code">
                <span>Mã phòng</span>
                <strong>{game.code}</strong>
                <button className="icon-button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?code=${game.code}`)} title="Copy link">
                  <ClipboardCopy size={18} />
                </button>
              </div>
              <h2>{game.title}</h2>
              <div className="called-number">{game.currentItem || "Chưa gọi mục nào"}</div>
              <div className="progress-line">{game.calledCount}/{game.itemCount} mục đã gọi</div>
              <div className="action-row">
                <button className="primary-action" onClick={callNext} disabled={game.status !== "active" || game.calledCount >= game.itemCount}>
                  <Sparkles size={18} /> {game.calledCount === 0 ? "Bắt đầu gọi" : "Gọi tiếp"}
                </button>
                <button className="soft-button" onClick={finishGame}>Kết thúc</button>
              </div>
            </section>

            <section className="panel">
              <div className="section-title">
                <h2>Người chơi</h2>
                <span className="pill">{game.players?.length || 0}</span>
              </div>
              <div className="player-grid">
                {game.players?.map((player) => (
                  <article className={`player-card ${player.status === "bingo" ? "winner" : ""}`} key={player.id}>
                    <strong>{player.name}</strong>
                    <span>{player.status === "bingo" ? "Bingo" : `${player.markedCount} ô đã đánh dấu`}</span>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="panel called-history">
            <div className="section-title">
              <h2>Lịch sử gọi</h2>
              <span className="pill">{winners.length} Bingo</span>
            </div>
            <div className="called-list">
              {game.calledItems.slice().reverse().map((item) => (
                <span key={`${item.index}-${item.label}`}>{item.index + 1}. {item.label}</span>
              ))}
            </div>
          </section>
        </section>
      )}

      {screen === "player" && game && game.player && (
        <section className="dashboard player-dashboard">
          <section className="player-header panel player-strip">
            <div className="player-summary">
              <div className="player-room-line">
                <span className="eyebrow compact">{game.code}</span>
                <h2>{game.title}</h2>
                <span className="mini-progress">{game.calledCount}/{game.itemCount}</span>
              </div>
              <p className="player-call-line">{game.currentItem ? `Mới gọi: ${game.currentItem}` : "Chờ gọi mục đầu tiên"}</p>
            </div>
            <button className="primary-action bingo-action" onClick={claimBingo} disabled={game.player.status === "bingo"}>
              <Trophy size={18} /> Bingo
            </button>
          </section>

          <section className="bingo-board" aria-label="Bảng Bingo">
            {game.player.card?.map((cell) => {
              const marked = cell.free || game.player?.markedIds?.includes(cell.id);
              const called = cell.free || game.calledItems.some((item) => item.label.toLocaleUpperCase("vi-VN") === cell.id);
              return (
                <button
                  className={`bingo-cell ${marked ? "marked" : ""} ${called ? "called" : ""}`}
                  key={`${cell.row}-${cell.col}`}
                  onClick={() => toggleCell(cell.id)}
                  disabled={!called || game.player?.status === "bingo"}
                >
                  {cell.free ? <CheckCircle2 size={24} /> : cell.label}
                </button>
              );
            })}
          </section>

          <section className="panel called-history player-called-history">
            <div className="section-title">
              <h2>Đã gọi</h2>
              <span className="pill">{game.calledCount}</span>
            </div>
            <div className="called-list">
              {game.calledItems.slice().reverse().map((item) => (
                <span key={`${item.index}-${item.label}`}>{item.label}</span>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function StageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="wizard-header">
      <button className="icon-button" onClick={onBack} title="Trang chính"><Home size={18} /></button>
      <h2>{title}</h2>
    </div>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={(event) => event.stopPropagation()}>
        <div className="section-title">
          <h2 id="rules-title">Luật chơi Bingo</h2>
          <button className="icon-button" onClick={onClose} title="Đóng">×</button>
        </div>
        <div className="rules-list">
          <p>Chủ game tạo phòng với ít nhất 24 mục khác nhau, sau đó bấm gọi từng mục cho cả phòng.</p>
          <p>Mỗi người chơi có một bảng 5x5 riêng. Ô giữa là ô tự do và luôn được tính là đã đánh dấu.</p>
          <p>Người chơi chỉ bấm được những ô đã được chủ game gọi. Ô chưa gọi sẽ bị khóa.</p>
          <p>Khi có đủ một hàng ngang, một cột dọc hoặc một đường chéo, người chơi bấm Bingo.</p>
          <p>Server sẽ kiểm tra lại bảng trước khi công nhận Bingo, nên bấm nhầm chưa đủ hàng sẽ không được tính.</p>
        </div>
        <button className="primary-action modal-action" onClick={onClose}>Đã hiểu</button>
      </section>
    </div>
  );
}

export default App;
