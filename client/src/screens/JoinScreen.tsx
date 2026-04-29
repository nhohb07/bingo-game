import { Play, RefreshCw } from "lucide-react";
import { StageHeader } from "../components/StageHeader";
import type { GameSummary } from "../types";

type JoinScreenProps = {
  joinCode: string;
  playerName: string;
  rooms: GameSummary[];
  onBack: () => void;
  onJoin: (code?: string) => void;
  onRefresh: () => void;
  onUpdateCode: (value: string) => void;
  onUpdateName: (value: string) => void;
};

export function JoinScreen({ joinCode, playerName, rooms, onBack, onJoin, onRefresh, onUpdateCode, onUpdateName }: JoinScreenProps) {
  return (
    <section className="form-stage">
      <StageHeader title="Tham gia Bingo" onBack={onBack} />
      <div className="panel form-grid">
        <label>Tên hiển thị<input value={playerName} onChange={(event) => onUpdateName(event.target.value)} maxLength={32} /></label>
        <label>Mã phòng<input value={joinCode} onChange={(event) => onUpdateCode(event.target.value)} /></label>
        <button className="primary-action" onClick={() => onJoin()}><Play size={18} /> Vào phòng</button>
      </div>
      <section className="panel room-list">
        <div className="section-title"><h2>Phòng đang mở</h2><button className="icon-button" onClick={onRefresh} title="Tải lại"><RefreshCw size={18} /></button></div>
        {rooms.length === 0 ? <p className="empty">Chưa có phòng Bingo nào đang mở.</p> : rooms.map((room) => (
          <button className="room-row" key={room.code} onClick={() => onJoin(room.code)}><span><strong>{room.title}</strong><small>{room.code} · {room.playerCount} người · {room.calledCount}/{room.itemCount} mục</small></span><Play size={18} /></button>
        ))}
      </section>
    </section>
  );
}
