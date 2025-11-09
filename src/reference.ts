// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

// Create basic UI elements

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Add a marker to represent the player
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Display the player's points
let playerPoints = 0;
statusPanelDiv.innerHTML = "No points yet...";

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Handle interactions with the cache
  rect.bindPopup(() => {
    // Each cache has a random point value, mutable by the player
    let pointValue = Math.floor(luck([i, j, "initialValue"].toString()) * 100);

    // The popup offers a description and button
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a cache here at "${i},${j}". It has value <span id="value">${pointValue}</span>.</div>
                <button id="poke">poke</button>`;

    // Clicking the button decrements the cache's value and increments the player's points
    popupDiv
      .querySelector<HTMLButtonElement>("#poke")!
      .addEventListener("click", () => {
        pointValue--;
        popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          pointValue.toString();
        playerPoints++;
        statusPanelDiv.innerHTML = `${playerPoints} points accumulated`;
      });

    return popupDiv;
  });
}

// Look around the player's neighborhood for caches to spawn
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    // If location i,j is lucky enough, spawn a cache!
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(i, j);
    }
  }
}

/*
// Creating one rectangle onto the map
const origin = CLASSROOM_LATLNG;
const bounds = leaflet.latLngBounds([
  [origin.lat, origin.lng],
  [origin.lat + 0.0001, origin.lng + 0.0001],
]);
const rect = leaflet.rectangle(bounds).addTo(map);

let rectPoints: number | null = 5;
const popupDiv = document.createElement("div");
popupDiv.innerHTML =
  `<div>There is a cache here.<span id = "message">It has a token of </span><span id = "value">${rectPoints}</span>.</message></div>
      <button id="poke">poke</button><button id="craft">craft</button><button id = "store">store</button>`;

// Clicking the button decrements the cache's value and increments the player's points
popupDiv.querySelector<HTMLButtonElement>("#poke")!.addEventListener(
  "click",
  () => {
    if (heldToken == null) {
      console.log(`You have no token.  Picking up token of ${rectPoints}`);
      heldToken = rectPoints;
      statusPanelDiv.innerHTML = `${heldToken}`;
      popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
        "There is a cache here.  Currently there is no token.";
      popupDiv.querySelector<HTMLButtonElement>("#poke")!.disabled = true;
    } else if (rectPoints) {
      console.log(
        `You have a token in your inventory.  Swapping inventory with cache`,
      );
      const temp = heldToken;
      heldToken = rectPoints;
      rectPoints = temp;
      statusPanelDiv.innerHTML = `${heldToken}`;
      popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}`;
    } else {
      console.log("There is nothing here that could be poked!");
    }
  },
);

popupDiv.querySelector<HTMLButtonElement>("#craft")!.addEventListener(
  "click",
  () => {
    if (heldToken == rectPoints) {
      console.log(
        `Crafting a token of value ${heldToken} to create a ${
          heldToken * 2
        } token!`,
      );
      rectPoints *= 2;
      popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}.`;
      heldToken = null;
      statusPanelDiv.innerText = `${heldToken}`;
    } else {
      console.log(`Cannot craft!`);
    }
  },
);

// OUTCOMES FOR STORING
// Player has token, cache has no token: Store token into cache, remove from player
// Cache has token, player has no token: Cannot store, player has no token
// Both have a token: SWAP
popupDiv.querySelector<HTMLButtonElement>("#store")!.addEventListener(
  "click",
  () => {
    if (heldToken && rectPoints) {
      console.log(
        `You have a token in your inventory.  Swapping inventory with cache`,
      );
      const temp = heldToken;
      heldToken = rectPoints;
      rectPoints = temp;
      statusPanelDiv.innerHTML = `${heldToken}`;
      popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}`;
    } else if (heldToken) {
      console.log(`Storing token into cache`);
      rectPoints = heldToken;
      heldToken = null;
      statusPanelDiv.innerHTML = `${heldToken}`;
      popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}`;
    } else {
      console.log("Player has no token.  Cannot store anything");
    }
  },
);

rect.bindPopup(popupDiv);
*/
