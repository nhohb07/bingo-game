# Bingo Architecture

## Goals

Bingo is a realtime classroom game. The architecture keeps the MVP simple while separating game rules, socket event flow, data serialization, and UI screens so the project remains easy to read and extend.

## Runtime

- Client: React + Vite + Socket.IO client.
- Server: Express + Socket.IO.
- State: in-memory rooms keyed by short room code.
- Shared domain: pure JavaScript logic used by server and tests.

## Directory Layout

```text
client/
  src/
    App.tsx                 # Client orchestration: socket state, session restore, screen routing
    constants.ts            # Browser config and localStorage keys
    types.ts                # Client DTO/view model types
    utils.ts                # Browser helper functions
    components/             # Reusable presentational components
    screens/                # Screen-level UI
    data/                   # Static sample items and random word bank
server/
  index.js                  # Thin Express/Socket.IO bootstrap
  config.js                 # Runtime config
  socketHandlers.js         # Socket event flow and authorization checks
  lib/
    crypto.js               # IDs, room codes, host token helpers
    gameFactory.js          # Create game/player and apply domain mutations
    gameStore.js            # In-memory room store
    serializers.js          # Host/player-safe DTOs
    socketResponses.js      # Socket callback/error helpers
shared/
  constants.js              # Shared domain constants
  gameLogic.js              # Pure Bingo rules
tests/
  gameLogic.test.js         # Unit tests for domain rules
```

## Ownership Rules

- `shared/gameLogic.js` stays pure: no sockets, no browser APIs, no global store.
- `server/socketHandlers.js` owns event validation and authorization.
- `server/lib/serializers.js` owns what host/player clients are allowed to see.
- `server/lib/gameFactory.js` owns server-side state mutations that are not pure rules.
- `client/src/App.tsx` owns socket state/actions. UI lives in `screens/` and reusable pieces in `components/`.

## Key Data Model

### Game

```ts
{
  id: string;
  code: string;
  title: string;
  items: string[];
  calledCount: number;
  calledAt: string[];
  hostToken: string;
  status: "active" | "finished";
  players: Map<string, Player>;
}
```

### Player

```ts
{
  id: string;
  name: string;
  card: BingoCell[];
  markedIds: string[];
  status: "playing" | "bingo";
  bingoLines: Array<{ type: string; index: number }>;
  joinedAt: string;
  bingoAt: string | null;
}
```

## Realtime Flow

1. Host creates a game with at least 24 unique items.
2. Player joins by room code/link and receives a unique card.
3. Host calls items in order.
4. Player can mark only the free cell or called items.
5. Player claims Bingo.
6. Server normalizes marks, checks lines, and emits updated host/player state.

## Extension Points

- Persistence: replace `server/lib/gameStore.js` with a repository without changing socket handlers much.
- New win modes: extend `shared/gameLogic.js` and serializers if the client needs extra result data.
- Item categories: extend `client/src/data/wordBank.ts` or move category selection to server if rooms need canonical server-side categories.
- UI screens: add screen-level files in `client/src/screens` and keep socket actions in `App.tsx`.

## Naming Conventions

- Socket events use `domain:action`: `game:create`, `call:next`, `card:toggle`, `bingo:claim`.
- React components/screens use PascalCase.
- Constants use `UPPER_SNAKE_CASE`.
- Server helper modules use noun-based names: `gameStore`, `gameFactory`, `serializers`.
