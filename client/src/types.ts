export type Screen = "role" | "create" | "join" | "host" | "player";
export type PlayerStatus = "playing" | "bingo";

export type BingoCell = {
  id: string;
  label: string;
  row: number;
  col: number;
  free: boolean;
};

export type CalledItem = {
  label: string;
  index: number;
  calledAt: string;
};

export type Player = {
  id: string;
  name: string;
  status: PlayerStatus;
  markedCount: number;
  bingoLines: Array<{ type: string; index: number }>;
  joinedAt: string;
  bingoAt: string | null;
  card?: BingoCell[];
  markedIds?: string[];
};

export type GameSummary = {
  code: string;
  title: string;
  status: "active" | "finished";
  itemCount: number;
  calledCount: number;
  playerCount: number;
  createdAt: string;
};

export type GameState = {
  id: string;
  code: string;
  title: string;
  status: "active" | "finished";
  itemCount: number;
  calledCount: number;
  calledItems: CalledItem[];
  currentItem: string | null;
  items?: string[];
  players?: Player[];
  player?: Player | null;
  createdAt?: string;
  viewer: { role: "host" | "player"; playerId: string | null };
};

export type SocketResponse = {
  ok: boolean;
  code?: string;
  message?: string;
  state?: GameState;
  hostToken?: string;
  playerId?: string;
  rooms?: GameSummary[];
};
