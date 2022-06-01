import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.3/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSOqRPHtZsUsVaNxI6baACGmyiPO1MD8o",
  authDomain: "topex-interactive.firebaseapp.com",
  projectId: "topex-interactive",
  storageBucket: "topex-interactive.appspot.com",
  messagingSenderId: "151715965758",
  appId: "1:151715965758:web:e74f8ea9464b25133c9a6f",
  measurementId: "G-EP092BEGGQ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

var tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

var blankdata = [];

for (var i = 0; i < 10; i++) {
  blankdata.push({ 0: "", 1: "", 2: "", 3: "" });
}

let data = [];

jspreadsheet(document.getElementById("spreadsheet"), {
  data: data,
  minDimensions: [4, 10],
  defaultColWidth: 100,
  lazyLoading: true,
  lazyColumns: true,
  tableOverflow: true,
  tableWidth: "fit-content",
  columns: [
    { type: "number", title: "Longitude", width: 200 },
    { type: "number", title: "Latitude", width: 200 },
    { type: "number", title: "Elevation", width: 200 },
    { type: "number", title: "Gravity", width: 200 }
  ]
});

let myTable = jspreadsheet.getElement(
  document.getElementById("spreadsheet")
)[0]["jspreadsheet"];

let L = window.L;

var gmap = L.tileLayer(
    "http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}",
    {
      attribution: "google"
    }
  ),
  map = new L.Map("map", {
    center: new L.LatLng(0, 120),
    zoom: 4.4
  }),
  drawnItems = L.featureGroup().addTo(map);

L.control
  .layers(
    {
      google: gmap.addTo(map)
    },
    {
      drawlayer: drawnItems
    },
    {
      position: "topleft",
      collapsed: false
    }
  )
  .addTo(map);

map.addControl(
  new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
      poly: {
        allowIntersection: false
      }
    },
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true
      }
    }
  })
);

let layerCount = 0;

let boundaries;

let north = document.getElementById("north");
let south = document.getElementById("south");
let west = document.getElementById("west");
let east = document.getElementById("east");

map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  if (layerCount < 1) {
    drawnItems.addLayer(layer);
    layerCount++;
    boundaries = layer.getBounds();
    north.value = boundaries.getNorth();
    west.value = boundaries.getWest();
    east.value = boundaries.getEast();
    south.value = boundaries.getSouth();

    north.min = south.value
    south.max = north.value
    east.min = west.value
    west.max = east.value

    north.removeAttribute("disabled");
    west.removeAttribute("disabled");
    east.removeAttribute("disabled");
    south.removeAttribute("disabled");

    $("#fetch-data").prop("disabled", false);
  }
});

map.on(L.Draw.Event.EDITRESIZE, function (event) {
  var layer = event.layer;
  boundaries = layer.getBounds();
  north.value = boundaries.getNorth();
  west.value = boundaries.getWest();
  east.value = boundaries.getEast();
  south.value = boundaries.getSouth();

  north.min = south.value
  south.max = north.value
  east.min = west.value
  west.max = east.value
});

map.on(L.Draw.Event.EDITMOVE, function (event) {
  var layer = event.layer;
  boundaries = layer.getBounds();
  north.value = boundaries.getNorth();
  west.value = boundaries.getWest();
  east.value = boundaries.getEast();
  south.value = boundaries.getSouth();

  north.min = south.value
  south.max = north.value
  east.min = west.value
  west.max = east.value
});

map.on(L.Draw.Event.EDITED, function (event) {
  boundaries = event.layers.getLayers()[0].getBounds();
  north.value = boundaries.getNorth();
  west.value = boundaries.getWest();
  east.value = boundaries.getEast();
  south.value = boundaries.getSouth();

  north.min = south.value
  south.max = north.value
  east.min = west.value
  west.max = east.value
});

map.on(L.Draw.Event.DELETED, function (event) {
  layerCount--;
  north.value = "";
  west.value = "";
  east.value = "";
  south.value = "";

  north.disabled = true;
  east.disabled = true;
  west.disabled = true;
  south.disabled = true;

  myTable.setData(blankdata);
  $("#fetch-data").prop("disabled", true);
});

north.addEventListener("change", () => {
  if (boundaries != null) {
    let val = parseFloat(north.value);
    boundaries._northEast.lat = val;
    drawnItems.getLayers()[0].setBounds(boundaries);
    north.min = south.value
    south.max = north.value
  }
});

south.addEventListener("change", () => {
  if (boundaries != null) {
    let val = parseFloat(south.value);
    boundaries._southWest.lat = val;
    drawnItems.getLayers()[0].setBounds(boundaries);
    north.min = south.value
    south.max = north.value
  }
});

west.addEventListener("change", () => {
  if (boundaries != null) {
    let val = parseFloat(west.value);
    boundaries._southWest.lng = val;
    drawnItems.getLayers()[0].setBounds(boundaries);
    east.min = west.value
    west.max = east.value
  }
});

east.addEventListener("change", () => {
  if (boundaries != null) {
    let val = parseFloat(east.value);
    boundaries._northEast.lng = val;
    drawnItems.getLayers()[0].setBounds(boundaries);
    east.min = west.value
    west.max = east.value
  }
});

let withGravity = false;

document.getElementById("data-switch").addEventListener("change", () => {
  if (withGravity) {
    withGravity = false;
  } else {
    withGravity = true;
  }
});

let baseUri = "https://topex-downloader-api.herokuapp.com/api/v1/";

async function fetchData(mode) {
  let endpoint = baseUri + `${mode}?`;
  endpoint += `north=${parseFloat(north.value)}&`;
  endpoint += `west=${parseFloat(west.value)}&`;
  endpoint += `east=${parseFloat(east.value)}&`;
  endpoint += `south=${parseFloat(south.value)}`;

  let result;

  try {
    const response = await fetch(endpoint);
    if (response.ok) {
      const jsonResponse = await response.json();
      result = jsonResponse;
    }
  } catch (error) {
    console.log(error);
  }
  return result;
}

let fetchTopex = async () => {
  let _elevation;

  if (withGravity) {
    let _gravity;

    _elevation = await fetchData("elevation").then(async (r) => {
      return await r;
    });

    _gravity = await fetchData("gravity").then(async (r) => {
      return await r;
    });

    if (_gravity.length == _elevation.length) {
      let _data = [];

      for (var i = 0; i < _elevation.length; i++) {
        if (
          _elevation[i].longitude === _gravity[i].longitude &&
          _elevation[i].latitude === _gravity[i].latitude
        ) {
          _data.push({
            0: _elevation[i].longitude,
            1: _elevation[i].latitude,
            2: _elevation[i].value,
            3: _gravity[i].value
          });
        }
      }
      myTable.setData(_data);
    }
  } else if (!withGravity) {
    _elevation = await fetchData("elevation").then(async (r) => {
      return await r;
    });

    let _data = _elevation.map((i) => {
      return { 0: i.longitude, 1: i.latitude, 2: i.value };
    });

    myTable.setData(_data);
  }
};

let fetchButton = document.getElementById("fetch-data");

fetchButton.addEventListener("click", async () => {
  $("#overlay-spinner").fadeIn();
  try {
    await fetchTopex();
  } catch (error) {
  } finally {
    $("#overlay-spinner").fadeOut();
  }
});
