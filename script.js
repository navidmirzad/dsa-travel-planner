"use strict";

document.addEventListener("DOMContentLoaded", start);

let graphData = null; // Global variable to store graph data

function start() {
  console.log("JavaScript is running!");
}

function generateGraph() {
  const numNodes = parseInt(document.getElementById("numNodes").value);
  graphData = createDirectedGraph(numNodes);
  visualizeGraph(graphData);
}

function createDirectedGraph(numNodes) {
  let nodes = [];
  let links = [];
  for (let i = 0; i < numNodes; i++) {
    nodes.push({ id: i });
  }
  for (let i = 0; i < numNodes; i++) {
    let target = Math.floor(Math.random() * numNodes);
    if (target !== i) {
      links.push({ source: i, target: target });
    }
  }
  return { nodes: nodes, links: links };
}

function visualizeGraph(
  graphData,
  prev = null,
  startNode = null,
  endNode = null
) {
  const width = 1000;
  const height = 800;
  const svg = d3
    .select("#graph")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const link = svg
    .append("g")
    .selectAll("line")
    .data(graphData.links)
    .enter()
    .append("line")
    .attr("stroke", "#999")
    .attr("stroke-width", 2);

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(graphData.nodes)
    .enter()
    .append("circle")
    .attr("r", 8)
    .attr("fill", (d) =>
      d.id === startNode ? "green" : d.id === endNode ? "red" : "#69b3a2"
    );

  const labels = svg
    .append("g")
    .selectAll("text")
    .data(graphData.nodes)
    .enter()
    .append("text")
    .attr("dy", -10)
    .attr("dx", -10)
    .attr("font-size", "10px")
    .attr("fill", "#000")
    .text((d) => d.id);

  const simulation = d3
    .forceSimulation(graphData.nodes)
    .force(
      "link",
      d3
        .forceLink(graphData.links)
        .id((d) => d.id)
        .distance(150)
    )
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    labels.attr("x", (d) => d.x).attr("y", (d) => d.y);

    if (prev) {
      highlightPath(prev, endNode);
    }
  }

  function highlightPath(prev, endNode) {
    let currentNode = endNode;
    const pathNodes = new Set();
    const pathLinks = [];

    while (currentNode !== null && prev[currentNode] !== null) {
      let nextNode = prev[currentNode];
      pathNodes.add(currentNode);
      pathNodes.add(nextNode);
      pathLinks.push({ source: nextNode, target: currentNode });
      currentNode = nextNode;
    }

    svg
      .append("g")
      .selectAll("line")
      .data(pathLinks)
      .enter()
      .append("line")
      .attr("x1", (d) => graphData.nodes[d.source].x)
      .attr("y1", (d) => graphData.nodes[d.source].y)
      .attr("x2", (d) => graphData.nodes[d.target].x)
      .attr("y2", (d) => graphData.nodes[d.target].y)
      .attr("stroke", "blue")
      .attr("stroke-width", 4);

    svg
      .append("g")
      .selectAll("circle")
      .data(Array.from(pathNodes).map((id) => graphData.nodes[id]))
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 8)
      .attr("fill", "orange");

    svg
      .append("g")
      .selectAll("text")
      .data(Array.from(pathNodes).map((id) => graphData.nodes[id]))
      .enter()
      .append("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("dy", -10)
      .attr("dx", -10)
      .attr("font-size", "10px")
      .attr("fill", "black")
      .text((d) => d.id);
  }
}

function findShortestPath() {
  const startNode = parseInt(document.getElementById("startNode").value);
  const endNode = parseInt(document.getElementById("endNode").value);
  if (!graphData) {
    alert("Please generate the graph first.");
    return;
  }
  const { distances, prev } = dijkstra(graphData, startNode);
  visualizeGraph(graphData, prev, startNode, endNode);
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Travel Planner Using Graphs", 20, 10);
  doc.text(
    "This project visualizes a travel planner using graphs. It generates a directed graph with a given number of nodes, and implements Dijkstra's algorithm to find the shortest path between two nodes.",
    20,
    20
  );
  const stepsText = document.getElementById("steps").innerText;
  doc.text(stepsText, 20, 40);
  doc.save("travel_planner.pdf");
}

function dijkstra(graph, startNode) {
  let distances = {};
  let prev = {};
  let pq = new PriorityQueue();
  let steps = 0;

  distances[startNode] = 0;
  pq.enqueue(startNode, 0);

  graph.nodes.forEach((node) => {
    if (node.id !== startNode) {
      distances[node.id] = Infinity;
    }
    prev[node.id] = null;
  });

  while (!pq.isEmpty()) {
    let minNode = pq.dequeue();
    let currentNode = minNode.element;
    steps++;

    graph.links.forEach((link) => {
      if (link.source.id === currentNode) {
        let alt = distances[currentNode] + 1; // Each edge has weight 1
        if (alt < distances[link.target.id]) {
          distances[link.target.id] = alt;
          prev[link.target.id] = currentNode;
          pq.enqueue(link.target.id, distances[link.target.id]);
        }
      }
    });
  }

  document.getElementById("steps").innerText = `Steps taken: ${steps}`;
  return { distances, prev };
}

class PriorityQueue {
  constructor() {
    this.collection = [];
  }

  enqueue(element, priority) {
    let newNode = { element, priority };
    if (this.isEmpty()) {
      this.collection.push(newNode);
    } else {
      let added = false;
      for (let i = 0; i < this.collection.length; i++) {
        if (newNode.priority < this.collection[i].priority) {
          this.collection.splice(i, 0, newNode);
          added = true;
          break;
        }
      }
      if (!added) {
        this.collection.push(newNode);
      }
    }
  }

  dequeue() {
    return this.collection.shift();
  }

  isEmpty() {
    return this.collection.length === 0;
  }
}
