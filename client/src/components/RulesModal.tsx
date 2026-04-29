export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={(event) => event.stopPropagation()}>
        <div className="section-title"><h2 id="rules-title">Luật chơi Bingo</h2><button className="icon-button" onClick={onClose} title="Đóng">×</button></div>
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
