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

const upButton = document.createElement("button");
upButton.innerHTML = `up`;
controlPanelDiv.append(upButton);

const downButton = document.createElement("button");
downButton.innerHTML = `down`;
controlPanelDiv.append(downButton);

const leftButton = document.createElement("button");
leftButton.innerHTML = `left`;
controlPanelDiv.append(leftButton);

const rightButton = document.createElement("button");
rightButton.innerHTML = `right`;
controlPanelDiv.append(rightButton);

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
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CELL_SPAWN_PROBABILITY = 0.5;

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

function spawnCell(x: number, y: number) {
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + x * TILE_DEGREES, origin.lng + y * TILE_DEGREES],
    [origin.lat + (x + 1) * TILE_DEGREES, origin.lng + (y + 1) * TILE_DEGREES],
  ]);

  const possibleStartingNum = [0, 2, 4, 8, 16];

  let rectPoints: number | null = possibleStartingNum[
    Math.floor(
      luck([x, y, "initialValue"].toString()) * 4,
    )
  ];

  const rect = leaflet.rectangle(bounds, { color: "#ff7800", weight: 3 }).addTo(
    map,
  );

  checkColor(rect, rectPoints);

  const popupDiv = document.createElement("div");
  popupDiv.innerHTML =
    `<div><span id="message">There is a cell at ${x},${y}.</span></div>
<button id="poke">poke</button><button id="craft">craft</button><button id = "store">store</button>`;

  popupDiv.querySelector<HTMLButtonElement>("#poke")!.addEventListener(
    "click",
    () => {
      if (heldToken == null) {
        console.log(`You have no token.  Picking up token of ${rectPoints}`);
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
        console.log("There is nothing here that could be poked!");
      }
      checkColor(rect, rectPoints);
      checkButtons(popupDiv, rectPoints, x, y);
    },
  );

  popupDiv.querySelector<HTMLButtonElement>("#craft")!.addEventListener(
    "click",
    () => {
      if (heldToken == rectPoints) {
        console.log(
          `Crafting a token of value ${heldToken} to create a ${
            heldToken! * 2
          } token!`,
        );
        rectPoints! *= 2;
        popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
          `There is a cell at ${x},${y}.`;
        heldToken = null;
        statusPanelDiv.innerText = `${heldToken}`;
        popupDiv.querySelector<HTMLButtonElement>("#store")!.disabled = true;
        checkColor(rect, rectPoints);
      } else {
        console.log(`Cannot craft!`);
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
        console.log(`Storing token into cell`);
        rectPoints = heldToken;
        heldToken = null;
        statusPanelDiv.innerHTML = `${heldToken}`;
        popupDiv.querySelector<HTMLSpanElement>("#message")!.innerHTML =
          `There is a cell at ${x},${y}.`;
        popupDiv.querySelector<HTMLButtonElement>("#poke")!.disabled = false;
      } else {
        console.log("Player has no token.  Cannot store anything");
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
  console.log(
    `You have a token in your inventory.  Swapping inventory with cell`,
  );
  const temp = heldToken;
  heldToken = rectPoints;
  rectPoints = temp;
  statusPanelDiv.innerHTML = `${heldToken}`;
  div.querySelector<HTMLSpanElement>("#message")!.innerHTML =
    `There is a cell at ${x},${y}.`;
  return rectPoints;
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

  if (Math.hypot(-x, -y) > 4.5) {
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

leaflet.circleMarker(CLASSROOM_LATLNG, { radius: 200 }).addTo(map); // Visual indicator of obtainable caches
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < CELL_SPAWN_PROBABILITY) {
      spawnCell(i, j);
    }
  }
}

upButton.addEventListener("click", () => {
  playerMarker.setLatLng(
    leaflet.latLng(36.998036938057016, -122.05753507501151),
  );
});

downButton.addEventListener("click", () => {
  playerMarker.setLatLng(
    leaflet.latLng(36.997336938057016, -122.05753507501151),
  );
});

leftButton.addEventListener("click", () => {
  playerMarker.setLatLng(
    leaflet.latLng(36.997936938057016, -122.05753507501151),
  );
});

rightButton.addEventListener("click", () => {
  playerMarker.setLatLng(
    leaflet.latLng(36.997936938057016, -122.05700507501151),
  );
});
