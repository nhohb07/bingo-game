import { CheckCircle2, Trophy } from "lucide-react";
import type { GameState } from "../types";
import { itemKey } from "../utils";

type PlayerScreenProps = {
  game: GameState;
  onClaimBingo: () => void;
  onToggleCell: (cellId: string) => void;
};

export function PlayerScreen({ game, onClaimBingo, onToggleCell }: PlayerScreenProps) {
  if (!game.player) return null;
  return (
    <section className="dashboard player-dashboard">
      <section className="player-header panel player-strip">
        <div className="player-summary"><div className="player-room-line"><span className="eyebrow compact">{game.code}</span><h2>{game.title}</h2><span className="mini-progress">{game.calledCount}/{game.itemCount}</span></div><p className="player-call-line">{game.currentItem ? `Mới gọi: ${game.currentItem}` : "Chờ gọi mục đầu tiên"}</p></div>
        <button className="primary-action bingo-action" onClick={onClaimBingo} disabled={game.player.status === "bingo"}><Trophy size={18} /> Bingo</button>
      </section>
      <section className="bingo-board" aria-label="Bảng Bingo">
        {game.player.card?.map((cell) => {
          const marked = cell.free || game.player?.markedIds?.includes(cell.id);
          const called = cell.free || game.calledItems.some((item) => item.label.toLocaleUpperCase("vi-VN") === cell.id);
          const latestCalled = Boolean(game.currentItem && itemKey(game.currentItem) === cell.id);
          return <button className={`bingo-cell ${marked ? "marked" : ""} ${called ? "called" : ""} ${latestCalled ? "latest-called" : ""}`} key={`${cell.row}-${cell.col}`} onClick={() => onToggleCell(cell.id)} disabled={!called || game.player?.status === "bingo"}>{cell.free ? <CheckCircle2 size={24} /> : cell.label}</button>;
        })}
      </section>
      <section className="panel called-history player-called-history">
        <div className="section-title"><h2>Đã gọi</h2><span className="pill">{game.calledCount}</span></div>
        <div className="called-list">{game.calledItems.slice().reverse().map((item, index) => <span className={index === 0 ? "latest-called-item" : ""} key={`${item.index}-${item.label}`}>{item.label}</span>)}</div>
      </section>
    </section>
  );
}
