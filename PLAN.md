# D3: World of Bits

## Game Design Vision

The vision for this game is to create a mashup of 2048 and Pokemon Go. Players would go around collecting tokens from cache's. These tokens could be combined with tokens of the same value to create a single token with double the value. The goal of the game would be to create a token of the biggest value.

## Designer Vision

I understand Adam's idea for the starter code to not push us around and to kill it, but there are still some mechanics / ideas that I would like to keep.

- I would like for a popup menu to exist so players would have options on what to do and so the gameplay isn't just tapping around the screen.
- I feel that a complete grid for the entire map would make things look too cluttered. As an alternative, I increased the spawnrate for cells, but made it so some cells contain no tokens.
- I also liked the use of the word "poke" for grabbing tokens. I just felt that it was a fun and whimsical word to describe the action, but if needed I can change the word to differentiate from the starter code.

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
- [x] use loops to draw a whole grid of cells on the map
- [x] player can only collect from cells within a certain range
- [x] ensure consistent cell generation between reloads (might be unecessary)
- [x] killing the starter code

## D3.b: Globe-spanning Gameplay (player movement and win condition)

Key technical challenge: Can you assemble a system to simulate player movement around a map?

- [ ] create a user interface to move the player (4 directional buttons)
- [ ] when buttons are clicked, move the player marker in the respective direction
- [ ] set player location to null island
- [ ] create helper function to convert between grid coordinates and latitude / longitude
- [ ] when the map is scrolled generate cells again using moveend event
- [ ] make sure that cells are memoryless (might be unnecessary)
- [ ] add a victory message when player crafts a certain token value (128)
