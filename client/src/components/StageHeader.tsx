import { Home } from "lucide-react";

export function StageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <div className="wizard-header"><button className="icon-button" onClick={onBack} title="Trang chính"><Home size={18} /></button><h2>{title}</h2></div>;
}
