"use strict";

class Graph {
  constructor() {
    this.nodes = [];
    this.edges = {};
  }

  addNode(node) {
    this.nodes.push(node);
    this.edges[node] = [];
  }

  addEdge(source, target, distance, direction) {
    this.edges[source].push({ target, distance, direction });
  }

  addStartNode(node) {
    this.startNode = node;
  }

  addEndNode(node) {
    this.endNode = node;
  }

  printGraph() {
    this.nodes.forEach((node) => {
      const targets = this.edges[node].map(
        (edge) => `${edge.target} (${edge.distance} km, ${edge.direction})`
      );
      console.log(`Node ${node} is connected to: ${targets.join(", ")}`);
    });
  }
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    return this.items.shift();
  }

  size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

// Define global variables
let map;
let markers = [];
let graph = new Graph();
let directionsService;
let directionsRenderer;
const MAX_NODES = 10;

document
  .getElementById("searchNearbyBars")
  .addEventListener("click", searchBarsNearby);

function searchBarsNearby() {
  const geocoder = new google.maps.Geocoder();
  const address = "KEA Guldbergsgade 23N, Copenhagen";

  geocoder.geocode({ address: address }, (results, status) => {
    if (status === google.maps.GeocoderStatus.OK) {
      const startLocation = results[0].geometry.location;
      const request = {
        location: startLocation,
        radius: 5000, // Search radius in meters (adjust as needed)
        type: "bar", // Specify the type of place you're searching for
      };

      const service = new google.maps.places.PlacesService(map);

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          // Extract coordinates of nearby bars
          const barCoordinates = results
            .slice(0, MAX_NODES - 1)
            .map((place) => place.geometry.location);

          // Add the start location as the first node
          barCoordinates.unshift(startLocation);

          // Display the coordinates as markers on the map
          geocodeCoordinates(barCoordinates);

          // Add the bar coordinates as nodes to the graph
          barCoordinates.forEach((coordinate, index) => {
            graph.addNode(index);
          });

          // Add edges between nodes based on distances
          calculateDistances(barCoordinates).then(() => {
            graph.printGraph();

            // Find and display the fastest route
            const startNode = 0;
            const endNode = barCoordinates.length - 1;
            const fastestRoute = findShortestTour(startNode, endNode, graph);
            console.log("Fastest Route:", fastestRoute);
            displayFastestRoute(fastestRoute, barCoordinates);
          });
        } else {
          console.error("Error fetching nearby places:", status);
        }
      });
    } else {
      console.error(
        "Geocode was not successful for the following reason: " + status
      );
    }
  });
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 55.6867243, lng: 12.5550491 }, // Centered on Copenhagen
    zoom: 13,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
}

function geocodeCoordinates(coordinates) {
  coordinates.forEach((coordinate) => {
    markers.push(
      new google.maps.Marker({
        map: map,
        position: coordinate,
        title: `Location: ${coordinate.lat()}, ${coordinate.lng()}`,
      })
    );
  });
}

async function calculateDistances(locations) {
  const service = new google.maps.DistanceMatrixService();

  for (let i = 0; i < locations.length; i++) {
    const response = await new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [locations[i]],
          destinations: locations,
          travelMode: "DRIVING",
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === "OK") {
            resolve(response);
          } else {
            reject(status);
          }
        }
      );
    });

    const distances = response.rows[0].elements.map(
      (element) => element.distance.value / 1000
    ); // Convert to km
    distances.forEach((distance, j) => {
      if (i !== j) {
        graph.addEdge(i, j, distance, ""); // Direction not needed here
      }
    });
  }
}

function findShortestTour(startNode, endNode, graph) {
  const nodes = graph.nodes;
  const n = nodes.length;
  const visited = new Array(n).fill(false);
  const path = [];
  let shortestPath = null;
  let shortestDistance = Infinity;

  function dfs(currentNode, currentDistance, currentPath) {
    if (currentPath.length === n) {
      const returnDistance =
        graph.edges[currentNode].find((edge) => edge.target === endNode)
          ?.distance || Infinity;
      const totalDistance = currentDistance + returnDistance;
      if (totalDistance < shortestDistance) {
        shortestDistance = totalDistance;
        shortestPath = [...currentPath, endNode];
      }
      return;
    }

    for (let { target, distance } of graph.edges[currentNode]) {
      if (!visited[target]) {
        visited[target] = true;
        dfs(target, currentDistance + distance, [...currentPath, target]);
        visited[target] = false;
      }
    }
  }

  visited[startNode] = true;
  dfs(startNode, 0, [startNode]);
  return shortestPath;
}

function displayFastestRoute(route, locations) {
  if (!route) return;

  const waypoints = route.slice(1, -1).map((node) => ({
    location: locations[node],
    stopover: true,
  }));

  const request = {
    origin: locations[route[0]],
    destination: locations[route[route.length - 1]],
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
  };

  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);
    } else {
      console.error("Error displaying the route:", status);
    }
  });
}

window.initMap = initMap;
