# D3: {game title goes here}

## Game Design Vision

{a few-sentence description of the game mechanics}

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?

### Steps (TAKEN FROM EXAMPLE PLAN.md)

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] give rectangle cache properties (visually and functionally)
- [x] player can collect tokens which removes it from the cache (poke)
- [x] create a second cell that would double the held cell based on crafting rules (craft)
- [x] player can store token into cache (either swaps token or stores player token in cache)
- [x] polish up button functionality (ie allow swapping tokens)
- [ ] player can only collect from cells within a certain range
- [ ] use loops to draw a whole grid of cells on the map
- [ ] ensure consistent cell generation between reloads (might be unecessary)
