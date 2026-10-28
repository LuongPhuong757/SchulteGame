# Constraints (from SPEC)

Source for all entries: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (section noted per entry). Content is paraphrased from the source.

## Board and scoring rules
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§1)
- type: protocol
- content: Square board sizes 4x4, 5x5, 6x6 holding numbers 1..N (16/25/36) in random order. Player taps 1 to N in sequence; time is measured. Wrong tap adds a 2-second penalty, with red flash and shake feedback.

## Mobile-first Vietnamese UI
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§1)
- type: nfr
- content: Phone-first design: large cells, large text, no hover or tooltip dependence. UI language is Vietnamese.

## Solo mode
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§2, §4)
- type: protocol
- content: Player enters a nickname then plays. Result goes to Top 10 per board size, tracked for both "today" and "all time". Leaderboard exists for solo mode only.

## Time race mode (rooms of 2-4)
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§2, §3)
- type: protocol
- content: Room owner chooses "same board" (everyone has the same number layout) or "separate boards" (each player has own layout). 3-second countdown, then simultaneous start. Result lists each player's time (penalties included); fastest wins.

## Number grab mode (rooms of 2-4)
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§2, §3)
- type: protocol
- content: One shared board; whole room races to tap the next number. First correct tap claims that number; all clients see claimed numbers (in the claimer's colour). Wrong tap locks that player's hand for 2 seconds. Winner is the player who claims the most numbers; tie broken by who claimed the final number.

## Room lifecycle
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§3)
- type: protocol
- content: Owner creates a room and receives a 4-digit code; picks mode and board size (plus same/separate board for time race). Others join with code plus nickname; max 4 players. Owner starts the game (needs at least 2 players). After a game: results screen, then "play again" in the same room. Room auto-destroys after 10 minutes of inactivity.

## Disconnect and rejoin
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§3)
- type: protocol
- content: A disconnected player may rejoin within 15 seconds (their clock keeps running). After 15 seconds they count as forfeited and remaining players continue.

## Identity and nickname
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§4)
- type: schema
- content: No login. Nickname only, filtered for length, characters, and basic profanity. Nickname is remembered on the device for next visit.

## Anti-cheat: room modes
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§5)
- type: protocol
- content: Server is the referee: server issues the start command, runs the timer, validates every tap, and decides who claims each number.

## Anti-cheat: solo score submission
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§5)
- type: api-contract
- content: Client submits a tap log (number plus timestamp) together with a board seed issued by the server. Server replays the log and checks validity (correct order, no implausible gap between two taps) before recording the score.

## Rate limiting
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§5)
- type: nfr
- content: Per-IP rate limits on room creation, score submission, and WebSocket connections. Specific thresholds: absent in source.

## Repository and packaging
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§6; header)
- type: nfr
- content: Standalone game, not tied to the venue (quan) and uses none of its data; served at game.quanbalun.site. Separate repo, not inside the OrderQuanBaLun monorepo. Single container: Node + Socket.IO server, React + Vite client served by the server as static files.

## Datastore
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§6)
- type: schema
- content: SQLite stored in a container volume for the leaderboard. Must NOT use the venue's MySQL. Table schema: absent in source.

## Container resource limits
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§6)
- type: nfr
- content: 256 MB RAM, 0.5 CPU, restart policy unless-stopped.

## Isolation from venue POS
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§6)
- type: nfr
- content: VPS is shared with the venue system (4 vCPU, 3.8 GB RAM, about 1 GB swap in use). Game crash or overload must not take down the venue POS.

## Ingress and DNS footprint
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§6)
- type: protocol
- content: The only touchpoints to venue infrastructure are one game.quanbalun.site block in Caddy (reverse proxy with WebSocket support) and one DNS record.

## Kill switch
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§6)
- type: nfr
- content: A quick off switch (environment variable or stopping the container) that needs no redeploy.

## Tunable defaults
- source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (§8)
- type: nfr
- content: Adjustable defaults: 2s wrong-tap penalty, 2s lock in number grab, 4-digit room code, 10-minute room expiry, 15-second rejoin window, max 4 players.
