"use strict";

/* class NodeDistancePair {
  constructor(node, distFromStart, path) {
    this.node = node;
    this.distFromStart = distFromStart;
    this.path = path;
  }
}

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
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

const buildGraph = (edges) => {
  const graph = {};

  edges.forEach((edge) => {
    const [start, end] = edge;

    if (!graph[start]) graph[start] = [];

    graph[start].push(end);
  });

  return graph;
};

const getShortestPath = (edges, startNode, endNode) => {
  const graph = buildGraph(edges);

  const queue = new Queue();
  const initialNodePair = new NodeDistancePair(startNode, 0, [startNode]);
  queue.enqueue(initialNodePair);

  while (queue.size() > 0) {
    const nodeDistancePair = queue.dequeue();
    const { node, distFromStart, path } = nodeDistancePair;

    if (node === endNode) return path;

    const children = graph[node];
    if (!children) continue;

    children.forEach((child) => {
      const childPath = [...path, child];
      const childDistancePair = new NodeDistancePair(
        child,
        distFromStart + 1,
        childPath
      );
      queue.enqueue(childDistancePair);
    });
  }

  return null; // If no path found
};

const edges = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [4, 5],
];
const startNode = 0;
const endNode = 5;
console.log(getShortestPath(edges, startNode, endNode));
 */

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

function generateGraph() {
  const nodeCount = parseInt(document.getElementById("nodeCount").value);
  if (isNaN(nodeCount) || nodeCount <= 0) {
    alert("Please enter a valid number of nodes.");
    return;
  }

  const graph = createRandomGraph(nodeCount);
  const positions = generateRandomPositions(nodeCount);
  displayGraph(graph);
  visualizeGraphOnMap(graph, 0, nodeCount - 1); // Passing start and end nodes

  const startNode = 0;
  const endNode = nodeCount - 1;
  const fastestRoute = findFastestRoute(graph, startNode, endNode, positions);
  console.log("Fastest Route:", fastestRoute);
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

function visualizeGraphOnMap(graph, startNode, endNode) {
  if (!map) {
    map = L.map("map").setView([51.505, -0.09], 13); // Default to London
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }

  clearMap();

  const nodeCount = Object.keys(graph).length;
  const positions = generateRandomPositions(nodeCount);

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
      const polyline = L.polyline(latlngs, { color: "blue" }).addTo(map);
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
