import { ClipboardCopy, Sparkles } from "lucide-react";
import type { GameState, Player } from "../types";

type HostScreenProps = {
  game: GameState;
  winners: Player[];
  onCallNext: () => void;
  onFinishGame: () => void;
};

export function HostScreen({ game, winners, onCallNext, onFinishGame }: HostScreenProps) {
  return (
    <section className="dashboard">
      <div className="host-layout">
        <section className="panel call-panel">
          <div className="room-code"><span>Mã phòng</span><strong>{game.code}</strong><button className="icon-button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?code=${game.code}`)} title="Copy link"><ClipboardCopy size={18} /></button></div>
          <h2>{game.title}</h2>
          <div className="called-number">{game.currentItem || "Chưa gọi mục nào"}</div>
          <div className="progress-line">{game.calledCount}/{game.itemCount} mục đã gọi</div>
          <div className="action-row">
            <button className="primary-action" onClick={onCallNext} disabled={game.status !== "active" || game.calledCount >= game.itemCount}><Sparkles size={18} /> {game.calledCount === 0 ? "Bắt đầu gọi" : "Gọi tiếp"}</button>
            <button className="soft-button" onClick={onFinishGame}>Kết thúc</button>
          </div>
        </section>
        <section className="panel">
          <div className="section-title"><h2>Người chơi</h2><span className="pill">{game.players?.length || 0}</span></div>
          <div className="player-grid">
            {game.players?.map((player) => <article className={`player-card ${player.status === "bingo" ? "winner" : ""}`} key={player.id}><strong>{player.name}</strong><span>{player.status === "bingo" ? "Bingo" : `${player.markedCount} ô đã đánh dấu`}</span></article>)}
          </div>
        </section>
      </div>
      <section className="panel called-history">
        <div className="section-title"><h2>Lịch sử gọi</h2><span className="pill">{winners.length} Bingo</span></div>
        <div className="called-list">{game.calledItems.slice().reverse().map((item) => <span key={`${item.index}-${item.label}`}>{item.index + 1}. {item.label}</span>)}</div>
      </section>
    </section>
  );
}
