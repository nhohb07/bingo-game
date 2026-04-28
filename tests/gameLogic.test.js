import { describe, expect, it } from "vitest";
import {
  FREE_CELL,
  createBingoCard,
  getBingoLines,
  normalizeMarkedIds,
  parseItemList,
  toggleMarkedId
} from "../shared/gameLogic.js";

const items = Array.from({ length: 40 }, (_, index) => `Mục ${index + 1}`);

describe("bingo logic", () => {
  it("parses comma and newline item lists without duplicates", () => {
    expect(parseItemList("Táo, Cam\nTáo\nChuối")).toEqual(["Táo", "Cam", "Chuối"]);
  });

  it("creates a 5x5 card with a free center cell", () => {
    const card = createBingoCard(items, () => 0);
    expect(card).toHaveLength(25);
    expect(card[12]).toMatchObject({ id: FREE_CELL, free: true, row: 2, col: 2 });
  });

  it("only marks called items and the free cell", () => {
    const card = createBingoCard(items, () => 0);
    const called = [{ label: card[0].label }];
    const marked = toggleMarkedId(card, [], card[1].id, called);
    expect(marked).toEqual([]);
    expect(toggleMarkedId(card, [], card[0].id, called)).toEqual([card[0].id]);
  });

  it("normalizes stale marked ids when called items change", () => {
    const card = createBingoCard(items, () => 0);
    expect(normalizeMarkedIds(card, [card[0].id, "MISSING"], [])).toEqual([]);
  });

  it("detects a completed row", () => {
    const card = createBingoCard(items, () => 0);
    const firstRow = card.filter((cell) => cell.row === 0).map((cell) => cell.id);
    expect(getBingoLines(card, firstRow)).toEqual([{ type: "row", index: 0 }]);
  });
});
