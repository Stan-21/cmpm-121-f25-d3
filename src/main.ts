// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

interface Point {
  x: number;
  y: number;
}

type CellKey = string;
type CellContents = number | null;

const commandList = [
  "up",
  "down",
  "left",
  "right",
  "teleport",
  "use_location",
  "clear",
  "reset",
  "help",
];

// Create basic UI elements
const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
controlPanelDiv.innerHTML = `<h1>D3: World of <s>2048</s> 1024</h1>`;
document.body.append(controlPanelDiv);

const wrapDiv = document.createElement("div");
wrapDiv.id = "wrapDiv";
document.body.append(wrapDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
wrapDiv.append(mapDiv);

let playerInventory: CellContents = 2;

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
wrapDiv.append(statusPanelDiv);

const statusDiv = document.createElement("body");
statusDiv.id = "status";
statusDiv.innerHTML = `Held Token: ${playerInventory}`;
statusPanelDiv.append(statusDiv);

const logDiv = document.createElement("body");
logDiv.id = "log";
statusPanelDiv.append(logDiv);

const chatBox = document.createElement("textarea");
chatBox.id = "chat";
chatBox.placeholder = "Type command here: ";
statusPanelDiv.append(chatBox);

chatBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (commandList.includes(chatBox.value)) {
      processCommand(chatBox.value);
      chatBox.value = "";
    }
  }
});

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.99790,
  -122.05670,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD = { x: 16, y: 8 };
const CELL_SPAWN_PROBABILITY = 0.1;
const possibleStartingNum = [0, 2, 4, 8, 16];

let USING_GEOLOCATION = true;

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

map.addEventListener("moveend", () => {
  featureGroup.clearLayers();
  generateCells();
});

const playerMarker = leaflet.marker(CLASSROOM_LATLNG).addTo(map);
playerMarker.bindTooltip("Current location!");

const radius = leaflet.circleMarker(playerMarker.getLatLng(), { radius: 150 })
  .addTo(map); // Visual indicator of obtainable caches

const featureGroup = leaflet.featureGroup().addTo(map);

// Flyweight pattern: key is intrinsic state (cell coordinates), value is extrinsic state (cell contents)
// Memento pattern: the cell map keeps track of the state of cells that are interacted with
// If a cell has been interacted with, that state will be restored when cells are spawned again
let cellMap = new Map<CellKey, CellContents>();

function spawnCell(point: Point) {
  const bounds = leaflet.latLngBounds([
    [
      gridToLatLng(point.y),
      gridToLatLng(point.x),
    ],
    [
      gridToLatLng(point.y) + TILE_DEGREES,
      gridToLatLng(point.x) + TILE_DEGREES,
    ],
  ]);

  let rectPoints: CellContents;
  if (cellMap.has(coordsToKey(point))) {
    rectPoints = cellMap.get(coordsToKey(point))!;
  } else {
    rectPoints = possibleStartingNum[
      Math.floor(
        luck([point.x, point.y, "initialValue"].toString()) *
          (possibleStartingNum.length - 1),
      )
    ];
  }

  const rect = leaflet.rectangle(bounds, { color: "#ff7800", weight: 3 }).addTo(
    map,
  );

  rect.addTo(map);
  featureGroup.addLayer(rect);

  checkColor(rect, rectPoints);

  const popupDiv = document.createElement("div");
  popupDiv.innerHTML =
    `<div><span id="message">There is a cell at ${point.x},${point.y}.</span></div>
<button id="poke">poke</button><button id="craft">craft</button><button id = "store">store</button>`;

  popupDiv.addEventListener("click", () => {
    checkColor(rect, rectPoints);
    checkButtons(popupDiv, rectPoints, point);
    saveGame(point, rectPoints);
    statusDiv.innerHTML = `Held Token: ${playerInventory}`;
  });

  popupDiv.querySelector<HTMLButtonElement>("#poke")!.addEventListener(
    "click",
    () => {
      if (playerInventory == null) {
        updateStatus(`You have no token.  Picking up token of ${rectPoints}`);
        playerInventory = rectPoints;
        statusDiv.innerHTML = `Held Token: ${playerInventory}`;
        rectPoints = null;
      } else if (rectPoints) {
        rectPoints = swapToken(rectPoints);
      }
    },
  );

  popupDiv.querySelector<HTMLButtonElement>("#craft")!.addEventListener(
    "click",
    () => {
      if (playerInventory == rectPoints) {
        updateStatus(
          `Crafting a token of value ${playerInventory} to create a ${
            playerInventory! * 2
          } token!`,
        );
        rectPoints! *= 2;
        playerInventory = null;
        if (rectPoints == 32) {
          //console.log("You win!");
          statusDiv.innerHTML = `You completed the tutorial!  You win!`;
        }
      } else {
        updateStatus(`Cannot craft!`);
      }
    },
  );

  popupDiv.querySelector<HTMLButtonElement>("#store")!.addEventListener(
    "click",
    () => {
      if (playerInventory && rectPoints) {
        rectPoints = swapToken(rectPoints);
      } else if (playerInventory) {
        updateStatus("Storing token into cell");
        rectPoints = playerInventory;
        playerInventory = null;
      } else {
        updateStatus("Player has no token.  Cannot store anything");
      }
    },
  );

  rect.bindPopup(() => {
    checkButtons(popupDiv, rectPoints, point);
    return popupDiv;
  });
}

function swapToken(
  rectPoints: number | null,
) {
  updateStatus(
    `You have a token in your inventory.  Swapping inventory with cell`,
  );
  const temp = playerInventory;
  playerInventory = rectPoints;
  rectPoints = temp;
  return rectPoints;
}

function generateCells() {
  const x = latLngToGrid(map.getCenter().lng);
  const y = latLngToGrid(map.getCenter().lat);
  for (let i = -NEIGHBORHOOD.x; i < NEIGHBORHOOD.x; i++) {
    for (let j = -NEIGHBORHOOD.y; j < NEIGHBORHOOD.y; j++) {
      if (luck([x - i, y - j].toString()) < CELL_SPAWN_PROBABILITY) {
        spawnCell({ x: x - i, y: y - j });
      }
    }
  }
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
  point: Point,
) {
  const poke = div.querySelector<HTMLButtonElement>("#poke")!;
  const craft = div.querySelector<HTMLButtonElement>("#craft")!;
  const store = div.querySelector<HTMLButtonElement>("#store")!;

  poke.disabled = true;
  craft.disabled = true;
  store.disabled = true;

  if (
    Math.hypot(
      latLngToGrid(playerMarker.getLatLng().lng) - point.x,
      latLngToGrid(playerMarker.getLatLng().lat) - point.y,
    ) > 4.5
  ) {
    return;
  }

  if (rectPoints) {
    poke.disabled = false;
  }
  if (rectPoints == playerInventory) {
    craft.disabled = false;
  }
  if (playerInventory) {
    store.disabled = false;
  }
}

function latLngToGrid(x: number) {
  return Math.round(x / 0.0001);
}

function gridToLatLng(x: number) { // (0, 0) will return 0, 0
  return x * 0.0001;
}

function coordsToKey(point: Point): CellKey {
  return point.x.toString() + point.y.toString();
}

function saveGame(point: Point, rectPoints: CellContents) {
  cellMap.set(coordsToKey(point), rectPoints);
  localStorage.savedMap = JSON.stringify(Array.from(cellMap));
  localStorage.playerToken = playerInventory;
}

function loadGame() {
  if (localStorage.savedMap) {
    cellMap = new Map(JSON.parse(localStorage.savedMap));
    playerInventory = Number(localStorage.playerToken);
    statusDiv.innerHTML = `Held Token: ${playerInventory}`;
  } else {
    console.log("No previous map data could be found");
  }
}

function setLocation(position: GeolocationPosition) {
  playerMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
  radius.setLatLng(playerMarker.getLatLng());
  map.setView(playerMarker.getLatLng());
}

function updateLocation() {
  if (USING_GEOLOCATION) {
    navigator.geolocation.getCurrentPosition(setLocation);
  }
}

function processCommand(command: string) {
  const x = playerMarker.getLatLng().lat;
  const y = playerMarker.getLatLng().lng;
  switch (command) {
    case "up":
      processMovement({ x: x + 0.0001, y: y });
      break;
    case "down":
      processMovement({ x: x - 0.0001, y: y });
      break;
    case "left":
      processMovement({ x: x, y: y - 0.0001 });
      break;
    case "right":
      processMovement({ x: x, y: y + 0.0001 });
      break;
    case "teleport": {
      const { x, y } = {
        x: Math.random() * 180 - 90,
        y: Math.random() * 360 - 180,
      };
      processMovement({ x, y });
      updateStatus(`Teleport to ${y}, ${x}`);
      break;
    }
    case "use_location":
      USING_GEOLOCATION = true;
      updateLocation();
      updateStatus(`Teleported back to browser location`);
      break;
    case "clear":
      logDiv.innerHTML = "";
      break;
    case "reset":
      localStorage.clear();
      location.reload();
      break;
    case "help":
      updateStatus(
        "Type 'reset' if you ever want to start over!  Have fun!",
      );
      updateStatus(
        "Type 'teleport' to teleport to a random location with fresh cells!  Type 'use_location' to go back to your current location.  Use 'clear' if this log every gets too clutted!",
      );
      updateStatus(
        "Craft a 1024 token to win!  Here's a list of helpful commands that may help in your journey!  Type 'up' 'down' 'left' or 'right' to move without getting out of your chair!",
      );
  }
}

function processMovement(point: Point) {
  USING_GEOLOCATION = false;
  console.log(point);
  playerMarker.setLatLng([point.x, point.y]);
  radius.setLatLng(playerMarker.getLatLng());
  map.setView(playerMarker.getLatLng());
}

function updateStatus(message: string) {
  const element = document.createElement("body");
  element.innerText = message;
  element.id = "logMessage";
  logDiv.prepend(element);
}

updateLocation();
setInterval(updateLocation, 5000);
loadGame();
generateCells();
processCommand("help");
