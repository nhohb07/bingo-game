import type { FormEvent } from "react";
import { Play, Shuffle } from "lucide-react";
import { StageHeader } from "../components/StageHeader";
import { buildMeaningfulWordBank } from "../data/wordBank";

const WORD_BANK_SIZE = buildMeaningfulWordBank().length;

type CreateScreenProps = {
  items: string;
  title: string;
  onBack: () => void;
  onRandomize: () => void;
  onSubmit: (event: FormEvent) => void;
  onUpdateItems: (value: string) => void;
  onUpdateTitle: (value: string) => void;
};

export function CreateScreen({ items, title, onBack, onRandomize, onSubmit, onUpdateItems, onUpdateTitle }: CreateScreenProps) {
  return (
    <section className="form-stage">
      <StageHeader title="Tạo phòng Bingo" onBack={onBack} />
      <form className="panel form-grid" onSubmit={onSubmit}>
        <label>Tên phòng<input value={title} onChange={(event) => onUpdateTitle(event.target.value)} maxLength={48} /></label>
        <label>Danh sách mục gọi<textarea value={items} onChange={(event) => onUpdateItems(event.target.value)} rows={12} /></label>
        <div className="form-actions">
          <button className="soft-button" type="button" onClick={onRandomize}><Shuffle size={18} /> Random từ kho {WORD_BANK_SIZE}</button>
          <button className="primary-action" type="submit"><Play size={18} /> Tạo phòng</button>
        </div>
        <p className="hint-line">Cần ít nhất 24 mục khác nhau. Có thể nhập tay hoặc random 36 mục từ kho khoảng 1000 từ/cụm từ có nghĩa.</p>
      </form>
    </section>
  );
}
