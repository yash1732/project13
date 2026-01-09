let map;
let startMarker, endMarker;
let startCoords, endCoords;
let routeData;

// Init map
navigator.geolocation.getCurrentPosition(pos => {
  startCoords = [pos.coords.latitude, pos.coords.longitude];

  map = L.map('map').setView(startCoords, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  startMarker = L.marker(startCoords).addTo(map).bindPopup("You").openPopup();

  map.on('click', e => {
  console.log("Map clicked:", e.latlng);  // 👈 ADD THIS

  endCoords = [e.latlng.lat, e.latlng.lng];

  if (endMarker) map.removeLayer(endMarker);
  endMarker = L.marker(endCoords).addTo(map).bindPopup("Destination");

  fetchRoute();
});

  
});

// Fetch route from OSRM
function fetchRoute() {
  const url = `https://router.project-osrm.org/route/v1/bike/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      routeData = data.routes[0];
      L.geoJSON(routeData.geometry).addTo(map);
    });
}

// MAIN TEST: derive features + call ML API
function checkRisk() {
  if (!routeData) {
    alert("Select destination first");
    return;
  }

  const distanceKm = routeData.distance / 1000;
  const durationMin = routeData.duration / 60;

  // SIMPLE proxy (for test)
  const intersectionDensity = 1.5; // placeholder for now
  const isNight = new Date().getHours() >= 19 ? 1 : 0;

  const payload = {
    route_distance_km: distanceKm,
    route_duration_min: durationMin,
    intersection_density: intersectionDensity,
    is_night: isNight,
    weather_stress_index: 0.5,
    fatigue_score: 3,
    shift_duration_hours: 6
  };
  console.log("FEATURES SENT TO BACKEND:", payload);


  fetch("http://127.0.0.1:8000/api/risk/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("result").innerHTML = `
        <div class="risk">${data.risk_label} RISK</div>
        <ul>${data.reasons.map(r => `<li>${r}</li>`).join("")}</ul>
      `;
    });
}
