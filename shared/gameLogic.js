export const BOARD_SIZE = 5;
export const FREE_CELL = "FREE";

export function normalizeText(value) {
  return String(value ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

export function normalizeKey(value) {
  return normalizeText(value).toLocaleUpperCase("vi-VN");
}

export function sanitizeName(value) {
  return normalizeText(value).slice(0, 32);
}

export function sanitizeCode(value) {
  return normalizeText(value).toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "");
}

export function parseItemList(value) {
  const seen = new Set();
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map(normalizeText)
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 120);
}

export function shuffleItems(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function createBingoCard(items, random = Math.random) {
  if (!Array.isArray(items) || items.length < 24) {
    throw new Error("Bingo cần ít nhất 24 mục khác nhau.");
  }

  const selected = shuffleItems(items, random).slice(0, 24);
  const cells = [];
  let sourceIndex = 0;

  for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    if (row === 2 && col === 2) {
      cells.push({ id: FREE_CELL, label: "Tự do", row, col, free: true });
    } else {
      const label = selected[sourceIndex];
      cells.push({ id: normalizeKey(label), label, row, col, free: false });
      sourceIndex += 1;
    }
  }

  return cells;
}

export function getCalledKeys(calledItems) {
  return new Set((calledItems || []).map((item) => normalizeKey(item.label ?? item)));
}

export function normalizeMarkedIds(card, markedIds, calledItems) {
  const called = getCalledKeys(calledItems);
  const validIds = new Set(card.filter((cell) => cell.free || called.has(cell.id)).map((cell) => cell.id));
  return Array.from(new Set(markedIds || [])).filter((id) => validIds.has(id));
}

export function toggleMarkedId(card, markedIds, cellId, calledItems) {
  const cell = card.find((item) => item.id === cellId);
  if (!cell) return normalizeMarkedIds(card, markedIds, calledItems);

  const called = getCalledKeys(calledItems);
  if (!cell.free && !called.has(cell.id)) {
    return normalizeMarkedIds(card, markedIds, calledItems);
  }

  const next = new Set(normalizeMarkedIds(card, markedIds, calledItems));
  if (next.has(cell.id)) {
    next.delete(cell.id);
  } else {
    next.add(cell.id);
  }
  return Array.from(next);
}

export function getBingoLines(card, markedIds) {
  const marked = new Set(markedIds || []);
  const isMarked = (row, col) => {
    const cell = card.find((item) => item.row === row && item.col === col);
    return Boolean(cell && (cell.free || marked.has(cell.id)));
  };
  const lines = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (Array.from({ length: BOARD_SIZE }, (_, col) => isMarked(row, col)).every(Boolean)) {
      lines.push({ type: "row", index: row });
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    if (Array.from({ length: BOARD_SIZE }, (_, row) => isMarked(row, col)).every(Boolean)) {
      lines.push({ type: "col", index: col });
    }
  }

  if (Array.from({ length: BOARD_SIZE }, (_, index) => isMarked(index, index)).every(Boolean)) {
    lines.push({ type: "diag", index: 0 });
  }
  if (Array.from({ length: BOARD_SIZE }, (_, index) => isMarked(index, BOARD_SIZE - 1 - index)).every(Boolean)) {
    lines.push({ type: "diag", index: 1 });
  }

  return lines;
}

export function hasBingo(card, markedIds) {
  return getBingoLines(card, markedIds).length > 0;
}
