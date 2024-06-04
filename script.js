"use strict";

let map;
let markers = [];
let polylines = [];

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

function calculateTotalDistance(graph, route) {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const currentNode = route[i];
    const nextNode = route[i + 1];
    const edge = graph[currentNode].find((edge) => edge.target === nextNode);
    totalDistance += edge.distance;
  }
  return totalDistance;
}

function generateGraph() {
  const nodeCount = parseInt(document.getElementById("nodeCount").value);
  if (isNaN(nodeCount) || nodeCount <= 0) {
    alert("Please enter a valid number of nodes.");
    return;
  }

  const graph = createRandomGraph(nodeCount);
  const positions = generateRandomPositions(nodeCount);
  displayGraph(graph);
  visualizeGraphOnMap(graph, 0, nodeCount - 1, positions); // Passing positions to visualize routes

  const startNode = 0;
  const endNode = nodeCount - 1;
  const fastestRoute = findFastestRoute(graph, startNode, endNode, positions);
  console.log(
    "A* ",
    fastestRoute,
    "Total Distance:",
    calculateTotalDistance(graph, fastestRoute),
    "Blue route"
  );
  const dfsRoute = dfs(graph, startNode, endNode);
  console.log(
    "DFS ",
    dfsRoute,
    "Total Distance:",
    calculateTotalDistance(graph, dfsRoute),
    "Red route"
  );
  const bfsRoute = bfs(graph, startNode, endNode);
  console.log(
    "BFS ",
    bfsRoute,
    "Total Distance:",
    calculateTotalDistance(graph, bfsRoute),
    "Green route"
  );

  visualizeRoutesOnMap(positions, fastestRoute, dfsRoute, bfsRoute); // Visualize both routes
}

function createRandomGraph(nodeCount) {
  const graph = {};

  for (let i = 0; i < nodeCount; i++) {
    graph[i] = [];
  }

  for (let i = 0; i < nodeCount; i++) {
    const edges = Math.floor(Math.random() * nodeCount); // Random number of edges for node i
    for (let j = 0; j < edges; j++) {
      const targetNode = Math.floor(Math.random() * nodeCount);
      if (
        !graph[i].some((edge) => edge.target === targetNode) &&
        i !== targetNode
      ) {
        const distance = Math.floor(Math.random() * 100) + 1; // Random distance between 1 and 100
        graph[i].push({ target: targetNode, distance: distance });
      }
    }
  }

  return graph;
}

function displayGraph(graph) {
  const graphOutput = document.getElementById("graphOutput");
  graphOutput.innerHTML = "";

  for (let node in graph) {
    const edges = graph[node]
      .map((edge) => `Node ${edge.target} (distance: ${edge.distance})`)
      .join(", ");
    const nodeElement = document.createElement("div");
    nodeElement.innerText = `Node ${node} -> [${edges}]`;
    graphOutput.appendChild(nodeElement);
  }
}

function visualizeGraphOnMap(graph, startNode, endNode, positions) {
  if (!map) {
    map = L.map("map").setView([51.505, -0.09], 13); // Default to London
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }

  clearMap();

  for (let node in positions) {
    const { lat, lng } = positions[node];
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`Node ${node}`).openPopup();
    markers.push(marker);

    if (node == startNode) {
      marker.setIcon(
        L.icon({
          iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
          iconSize: [38, 95],
          iconAnchor: [22, 94],
          popupAnchor: [-3, -76],
        })
      );
    } else if (node == endNode) {
      marker.setIcon(
        L.icon({
          iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-red.png",
          iconSize: [38, 95],
          iconAnchor: [22, 94],
          popupAnchor: [-3, -76],
        })
      );
    }
  }

  for (let node in graph) {
    graph[node].forEach((edge) => {
      const { target, distance } = edge;
      const latlngs = [
        [positions[node].lat, positions[node].lng],
        [positions[target].lat, positions[target].lng],
      ];
      const polyline = L.polyline(latlngs, { color: "gray" }).addTo(map); // Use gray for graph edges
      polyline.bindPopup(`Distance: ${distance}`).openPopup();
      polylines.push(polyline);
    });
  }
}

function generateRandomPositions(nodeCount) {
  const positions = {};
  const latRange = [51.48, 51.52]; // Latitude range for central London
  const lngRange = [-0.1, -0.06]; // Longitude range for central London

  for (let i = 0; i < nodeCount; i++) {
    const lat = Math.random() * (latRange[1] - latRange[0]) + latRange[0];
    const lng = Math.random() * (lngRange[1] - lngRange[0]) + lngRange[0];
    positions[i] = { lat, lng };
  }

  return positions;
}

function clearMap() {
  markers.forEach((marker) => map.removeLayer(marker));
  polylines.forEach((polyline) => map.removeLayer(polyline));
  markers = [];
  polylines = [];
}

// A* Algorithm
function findFastestRoute(graph, startNode, endNode, positions) {
  const heuristic = (node) => {
    // Simple heuristic: straight-line distance between nodes
    const { lat: startLat, lng: startLng } = positions[startNode];
    const { lat: endLat, lng: endLng } = positions[endNode];
    const dx = endLat - startLat;
    const dy = endLng - startLng;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const distanceFromStart = {};
  const cameFrom = {}; // To keep track of previous node
  const priorityQueue = new PriorityQueue();

  for (let node in graph) {
    distanceFromStart[node] = Infinity;
  }
  distanceFromStart[startNode] = 0;

  priorityQueue.enqueue({ node: startNode, priority: heuristic(startNode) });

  while (!priorityQueue.isEmpty()) {
    const { node: currentNode } = priorityQueue.dequeue();

    if (currentNode === endNode) {
      return reconstructPath(startNode, endNode, cameFrom);
    }

    graph[currentNode].forEach(({ target: nextNode, distance }) => {
      const newDistance = distanceFromStart[currentNode] + distance;

      if (newDistance < distanceFromStart[nextNode]) {
        distanceFromStart[nextNode] = newDistance;
        cameFrom[nextNode] = currentNode; // Update cameFrom
        const priority = newDistance + heuristic(nextNode);
        priorityQueue.enqueue({ node: nextNode, priority });
      }
    });
  }

  return null; // No path found
}

function reconstructPath(startNode, endNode, cameFrom) {
  // Reconstruct path from startNode to endNode
  const path = [];
  let currentNode = endNode;
  while (currentNode !== startNode) {
    path.unshift(currentNode);
    currentNode = cameFrom[currentNode];
  }
  path.unshift(startNode);
  return path;
}

// DFS Algorithm
function dfs(graph, startNode, endNode) {
  const visited = [];
  const stack = [startNode];
  const cameFrom = {};

  while (stack.length > 0) {
    const currentNode = stack.pop();

    if (!visited.includes(currentNode)) {
      visited.push(currentNode);

      if (currentNode === endNode) {
        return reconstructPath(startNode, endNode, cameFrom);
      }

      graph[currentNode].forEach((edge) => {
        if (!visited.includes(edge.target)) {
          stack.push(edge.target);
          cameFrom[edge.target] = currentNode;
        }
      });
    }
  }

  return visited;
}

// BFS Algorithm
function bfs(graph, startNode, endNode) {
  const queue = [startNode];
  const visited = {};
  const cameFrom = {};

  visited[startNode] = true;
  queue.push(startNode);

  while (queue.length !== 0) {
    const currentNode = queue.shift();

    if (currentNode === endNode) {
      return reconstructPath(startNode, endNode, cameFrom);
    }

    for (const edge of graph[currentNode] || []) {
      const neighbor = edge.target;
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        queue.push(neighbor);
        cameFrom[neighbor] = currentNode;
      }
    }
  }

  return null;
}

function visualizeRoutesOnMap(positions, fastestRoute, dfsRoute, bfsRoute) {
  polylines.forEach((polyline) => map.removeLayer(polyline));
  polylines = [];

  // Plot A* route in blue
  if (fastestRoute) {
    for (let i = 0; i < fastestRoute.length - 1; i++) {
      const start = positions[fastestRoute[i]];
      const end = positions[fastestRoute[i + 1]];
      const latlngs = [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
      const polyline = L.polyline(latlngs, { color: "blue", weight: 5 }).addTo(
        map
      );
      polylines.push(polyline);
    }
  }

  // Plot DFS red
  if (dfsRoute) {
    for (let i = 0; i < dfsRoute.length - 1; i++) {
      const start = positions[dfsRoute[i]];
      const end = positions[dfsRoute[i + 1]];
      const latlngs = [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
      const polyline = L.polyline(latlngs, { color: "red" }).addTo(map);
      polylines.push(polyline);
    }
  }

  // Plot BFS green
  if (bfsRoute) {
    for (let i = 0; i < bfsRoute.length - 1; i++) {
      const start = positions[bfsRoute[i]];
      const end = positions[bfsRoute[i + 1]];
      const latlngs = [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
      const polyline = L.polyline(latlngs, { color: "green" }).addTo(map);
      polylines.push(polyline);
    }
  }
}
