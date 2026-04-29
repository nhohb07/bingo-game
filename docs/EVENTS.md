# Socket Event Contract

All events use acknowledgement callbacks. Success responses include `ok: true`; failures include `ok: false`, `code`, and `message`.

## `games:list`

Payload: `{}`

Response:

```ts
{ ok: true; rooms: GameSummary[] }
```

## `game:create`

Create a room as host.

Payload:

```ts
{ title?: string; items: string }
```

Rules:

- `items` may be newline or comma separated.
- Duplicates are removed after Vietnamese uppercase normalization.
- At least 24 unique items are required.

Response:

```ts
{ ok: true; state: GameState; hostToken: string }
```

## `game:get`

Restore a host/player session.

Host payload:

```ts
{ code: string; role: "host"; hostToken: string }
```

Player payload:

```ts
{ code: string; playerId: string }
```

## `game:join`

Join an active room as player.

Payload:

```ts
{ code: string; name: string }
```

Response:

```ts
{ ok: true; state: GameState; playerId: string }
```

## `call:next`

Host calls the next item.

Payload:

```ts
{ code: string; hostToken: string }
```

Rules:

- Host token is required.
- Room must be active.
- Cannot call past the end of the item list.

## `card:toggle`

Player marks/unmarks a cell.

Payload:

```ts
{ code: string; playerId: string; cellId: string }
```

Rules:

- Only called items and the free cell may be marked.
- Server normalizes stale/invalid marked ids.

## `bingo:claim`

Player claims Bingo.

Payload:

```ts
{ code: string; playerId: string }
```

Rules:

- Server checks row/column/diagonal lines.
- Invalid claims return `BINGO_INVALID` and update the player's normalized card state.

## `game:finish`

Host finishes the room.

Payload:

```ts
{ code: string; hostToken: string }
```
