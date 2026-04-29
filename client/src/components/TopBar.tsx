import { HelpCircle, ListChecks } from "lucide-react";

export function TopBar({ connected, onHome, onOpenRules }: { connected: boolean; onHome: () => void; onOpenRules: () => void }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome}>
        <span className="brand-mark"><ListChecks size={22} /></span>
        <span>Bingo Vui</span>
      </button>
      <div className="topbar-actions">
        <button className="soft-button rules-button" onClick={onOpenRules}><HelpCircle size={18} /> Luật chơi</button>
        <span className={`connection ${connected ? "online" : ""}`}><span />{connected ? "Realtime" : "Mất kết nối"}</span>
      </div>
    </header>
  );
}
