import { Crown, Sparkles, Users } from "lucide-react";

export function RoleScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <section className="role-stage">
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={18} /> Phòng chơi nhanh cho lớp học</span><h1>Bingo Vui</h1></div>
      <div className="role-grid">
        <button className="role-card host-card" onClick={onCreate}><Crown size={42} /><strong>Chủ game</strong><span>Tạo danh sách mục, gọi từng mục và xem ai Bingo trước.</span></button>
        <button className="role-card player-card" onClick={onJoin}><Users size={42} /><strong>Người chơi</strong><span>Vào phòng, nhận bảng 5x5 riêng và bấm Bingo khi đủ hàng.</span></button>
      </div>
    </section>
  );
}
