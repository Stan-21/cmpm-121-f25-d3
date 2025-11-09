// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function

// Create basic UI elements
const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
controlPanelDiv.style.background = "red";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
mapDiv.style.background = "orange";
document.body.append(mapDiv);

let heldToken: number | null = 5;

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
statusPanelDiv.style.background = "yellow";
statusPanelDiv.innerText = `${heldToken}`;
document.body.append(statusPanelDiv);

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
/*const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;*/

const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(CLASSROOM_LATLNG).addTo(map);
playerMarker.bindTooltip("Current location!");

// Creating one rectangle onto the map
const origin = CLASSROOM_LATLNG;
const bounds = leaflet.latLngBounds([
  [origin.lat, origin.lng],
  [origin.lat + 0.0001, origin.lng + 0.0001],
]);
const rect = leaflet.rectangle(bounds).addTo(map);

let rectPoints = 3;
const popupDiv = document.createElement("div");
popupDiv.innerHTML = `
                <div><span id="value">There is a cache here.  It has a token of ${rectPoints}.</span></div>
                <button id="poke">poke</button><button id="craft">craft</button><button id = "store">store</button>`;

// Clicking the button decrements the cache's value and increments the player's points
popupDiv.querySelector<HTMLButtonElement>("#poke")!.addEventListener(
  "click",
  () => {
    if (heldToken == null) {
      console.log(`You have no token.  Picking up token of ${rectPoints}`);
      heldToken = rectPoints;
      statusPanelDiv.innerHTML = heldToken.toString();
      popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        "There is a cache here.  Currently there is no token.";
      popupDiv.querySelector<HTMLButtonElement>("#poke")!.disabled = true;
    } else {
      console.log(
        `You have a token in your inventory.  Swapping inventory with cache`,
      );
      const temp = heldToken;
      heldToken = rectPoints;
      rectPoints = temp;
      statusPanelDiv.innerHTML = heldToken.toString();
      popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}`;
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
      popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}.`;
      heldToken = null;
      statusPanelDiv.innerText = `${heldToken}`;
    } else {
      console.log(`Cannot craft!`);
    }
  },
);

popupDiv.querySelector<HTMLButtonElement>("#store")!.addEventListener(
  "click",
  () => {
    if (heldToken == null) {
      console.log(`You have no token.  Picking up token of ${rectPoints}`);
      heldToken = rectPoints;
      statusPanelDiv.innerHTML = heldToken.toString();
      popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        "There is a cache here.  Currently there is no token.";
      popupDiv.querySelector<HTMLButtonElement>("#poke")!.disabled = true;
    } else {
      console.log(
        `You have a token in your inventory.  Swapping inventory with cache`,
      );
      const temp = heldToken;
      heldToken = rectPoints;
      rectPoints = temp;
      statusPanelDiv.innerHTML = heldToken.toString();
      popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        `There is a cache here.  It has a token of ${rectPoints}`;
    }
  },
);

rect.bindPopup(popupDiv);
