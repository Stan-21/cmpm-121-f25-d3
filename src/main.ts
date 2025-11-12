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
controlPanelDiv.innerHTML = `<h1>D3: World of Bits</h1>`;
document.body.append(controlPanelDiv);

const directions = ["up", "down", "left", "right"];

directions.forEach((item) => {
  const directionButton = document.createElement("button");
  directionButton.innerHTML = item;
  controlPanelDiv.append(directionButton);

  directionButton.addEventListener("click", () => {
    playerMarker.setLatLng(processMovement(playerMarker.getLatLng(), item));
    featureGroup.clearLayers();
    generateCells();
    map.setView(playerMarker.getLatLng());
  });
});

const wrapDiv = document.createElement("div");
wrapDiv.id = "wrapDiv";
document.body.append(wrapDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
wrapDiv.append(mapDiv);

let heldToken: number | null = 2;

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
statusPanelDiv.innerText = `${heldToken}`;
wrapDiv.append(statusPanelDiv);

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.99790,
  -122.05670,
);

// On tile 369979, -1220567

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZEX = 16;
const NEIGHBORHOOD_SIZEY = 8;
const CELL_SPAWN_PROBABILITY = 0.3;

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

const featureGroup = leaflet.featureGroup().addTo(map);

function spawnCell(x: number, y: number) {
  console.log(x, y);
  const bounds = leaflet.latLngBounds([
    [
      gridToLatLng(y),
      gridToLatLng(x),
    ],
    [
      gridToLatLng(y) + TILE_DEGREES,
      gridToLatLng(x) + TILE_DEGREES,
    ],
  ]);

  console.log(bounds);

  const possibleStartingNum = [0, 2, 4, 8, 16];

  let rectPoints: number | null = possibleStartingNum[
    Math.floor(
      luck([x, y, "initialValue"].toString()) * 4,
    )
  ];

  const rect = leaflet.rectangle(bounds, { color: "#ff7800", weight: 3 }).addTo(
    map,
  );

  rect.addTo(map);

  featureGroup.addLayer(rect);

  checkColor(rect, rectPoints);

  const popupDiv = document.createElement("div");
  popupDiv.innerHTML =
    `<div><span id="message">There is a cell at ${x},${y}.</span></div>
<button id="poke">poke</button><button id="craft">craft</button><button id = "store">store</button>`;

  popupDiv.querySelector<HTMLButtonElement>("#poke")!.addEventListener(
    "click",
    () => {
      if (heldToken == null) {
        //console.log(`You have no token.  Picking up token of ${rectPoints}`);
        heldToken = rectPoints;
        statusPanelDiv.innerHTML = `${heldToken}`;
        rectPoints = null;
        popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
          `There is a cell at ${x},${y}.`;
        popupDiv.querySelector<HTMLButtonElement>("#poke")!.disabled = true;
        popupDiv.querySelector<HTMLButtonElement>("#store")!.disabled = false;
      } else if (rectPoints) {
        rectPoints = swapToken(rectPoints, popupDiv, x, y);
      } else {
        //console.log("There is nothing here that could be poked!");
      }
      checkColor(rect, rectPoints);
      checkButtons(popupDiv, rectPoints, x, y);
    },
  );

  popupDiv.querySelector<HTMLButtonElement>("#craft")!.addEventListener(
    "click",
    () => {
      if (heldToken == rectPoints) {
        /*console.log(
          `Crafting a token of value ${heldToken} to create a ${
            heldToken! * 2
          } token!`,
        );*/
        rectPoints! *= 2;
        popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
          `There is a cell at ${x},${y}.`;
        heldToken = null;
        statusPanelDiv.innerText = `${heldToken}`;
        popupDiv.querySelector<HTMLButtonElement>("#store")!.disabled = true;
        checkColor(rect, rectPoints);
        if (rectPoints == 32) {
          //console.log("You win!");
          statusPanelDiv.innerText = `You completed the tutorial!  You win!`;
        }
      } else {
        //console.log(`Cannot craft!`);
      }
      checkColor(rect, rectPoints);
      checkButtons(popupDiv, rectPoints, x, y);
    },
  );

  popupDiv.querySelector<HTMLButtonElement>("#store")!.addEventListener(
    "click",
    () => {
      if (heldToken && rectPoints) {
        rectPoints = swapToken(rectPoints, popupDiv, x, y);
      } else if (heldToken) {
        //console.log(`Storing token into cell`);
        rectPoints = heldToken;
        heldToken = null;
        statusPanelDiv.innerHTML = `${heldToken}`;
        popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
          `There is a cell at ${x},${y}.`;
        popupDiv.querySelector<HTMLButtonElement>("#poke")!.disabled = false;
      } else {
        //console.log("Player has no token.  Cannot store anything");
      }

      checkColor(rect, rectPoints);
      checkButtons(popupDiv, rectPoints, x, y);
    },
  );

  rect.bindPopup(() => {
    checkButtons(popupDiv, rectPoints, x, y);
    return popupDiv;
  });
}

function swapToken(
  rectPoints: number | null,
  div: HTMLDivElement,
  x: number,
  y: number,
) {
  /*console.log(
    `You have a token in your inventory.  Swapping inventory with cell`,
  );*/
  const temp = heldToken;
  heldToken = rectPoints;
  rectPoints = temp;
  statusPanelDiv.innerHTML = `${heldToken}`;
  div.querySelector<HTMLSpanElement>("#message")!.innerHTML =
    `There is a cell at ${x},${y}.`;
  return rectPoints;
}

map.addEventListener("moveend", () => {
  featureGroup.clearLayers();
  generateCells();
});

generateCells();
function generateCells() {
  const radius = leaflet.circleMarker(playerMarker.getLatLng(), { radius: 150 })
    .addTo(map); // Visual indicator of obtainable caches
  featureGroup.addLayer(radius);
  const x = latLngToGrid(map.getCenter().lng);
  const y = latLngToGrid(map.getCenter().lat);
  for (let i = -NEIGHBORHOOD_SIZEX; i < NEIGHBORHOOD_SIZEX; i++) {
    for (let j = -NEIGHBORHOOD_SIZEY; j < NEIGHBORHOOD_SIZEY; j++) {
      if (luck([x - i, y - j].toString()) < CELL_SPAWN_PROBABILITY) {
        spawnCell(x - i, y - j);
      }
    }
  }
  console.log("done spawning");
}

function checkColor(rect: leaflet.Rectangle, rectPoints: number | null) {
  if ((rectPoints == 0) || (!rectPoints)) {
    rectPoints = null;
    rect.setStyle({ color: "#bdac97" });
  } else if (rectPoints == 2) {
    rect.setStyle({ color: "#eee4da" });
  } else if (rectPoints == 4) {
    rect.setStyle({ color: "#ebd8b6" });
  } else if (rectPoints == 8) {
    rect.setStyle({ color: "#f3b177" });
  } else if (rectPoints == 16) {
    rect.setStyle({ color: "#f69360" });
  } else {
    rect.setStyle({ color: "red" });
  }

  if (rectPoints != null) {
    const tooltip = leaflet.tooltip({
      permanent: true,
      direction: "center",
    }).setContent(rectPoints!.toString());
    rect.bindTooltip(tooltip);
  } else {
    rect.unbindTooltip();
  }
}

function checkButtons(
  div: HTMLDivElement,
  rectPoints: number | null,
  x: number,
  y: number,
) {
  const poke = div.querySelector<HTMLButtonElement>("#poke")!;
  const craft = div.querySelector<HTMLButtonElement>("#craft")!;
  const store = div.querySelector<HTMLButtonElement>("#store")!;

  poke.disabled = true;
  craft.disabled = true;
  store.disabled = true;

  console.log(x, y);
  if (
    Math.hypot(
      latLngToGrid(playerMarker.getLatLng().lng) - x,
      latLngToGrid(playerMarker.getLatLng().lat) - y,
    ) > 4.5
  ) {
    return;
  }

  if (rectPoints) {
    poke.disabled = false;
  }
  if (rectPoints == heldToken) {
    craft.disabled = false;
  }
  if (heldToken) {
    store.disabled = false;
  }
}

function processMovement(
  loc: leaflet.LatLng,
  dir: string,
): leaflet.LatLng | [number, number] {
  switch (dir) {
    case "up":
      return [loc.lat + 0.0001, loc.lng];
    case "down":
      return [loc.lat - 0.0001, loc.lng];
    case "left":
      return [loc.lat, loc.lng - 0.0001];
    case "right":
      return [loc.lat, loc.lng + 0.0001];
  }
  return [loc.lat, loc.lng];
}

function latLngToGrid(x: number) {
  return Math.round(x / 0.0001);
}

function gridToLatLng(x: number) { // (0, 0) will return 0, 0
  return x * 0.0001;
}
