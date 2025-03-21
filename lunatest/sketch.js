// Coding Train / Daniel Shiffman
// Weighted Voronoi Stippling
// https://thecodingtrain.com/challenges/181-image-stippling
//orginal code: https://editor.p5js.org/codingtrain/sketches/Z_YV25_4G

// All of the points
let points = [];

// Global variables for geometry
let delaunay, voronoi;

// Image
let picCho;
let imgWidth, imgHeight;

// Image Loading
function preload() {
  picCho = loadImage("shadow.JPG");
}

function setup() {
  // Scale the image while keeping aspect ratio
  let maxSize = 800;
  let reScale= maxSize / max(picCho.width, picCho.height);

  // Resize the image
  imgWidth = int(picCho.width * reScale);
  imgHeight = int(picCho.height * reScale);

  picCho.resize(imgWidth, imgHeight);
  
  //Same size as the picture being chosen
  createCanvas(imgWidth, imgHeight);

  // Generate random points avoiding bright areas
  // generateRandomPoints(6000);
  // The line above is the original code, I want to have the number      of the points adjusting accoding to the picture size
  generateRandomPoints(imgWidth*imgHeight/50);

  // Calculate Delaunay triangulation and Voronoi diagram
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

function draw() {
  background(255);

  // Display points
  displayPoints();

  // Calculate centroids and update points
  updatePoints();
}

// Generate random points avoiding bright areas
function generateRandomPoints(n) {
  for (let i = 0; i < n; i++) {
    let x = random(width);
    let y = random(height);
    let col = picCho.get(x, y);
    if (random(100) > brightness(col)) {
      points.push(createVector(x, y));
    } else {
      i--;
    }
  }
}

// Display points
function displayPoints() {
  for (let v of points) {
    stroke(0);
    strokeWeight(4);
    point(v.x, v.y);
  }
}

// Calculate centroids and update points
function updatePoints() {
  // Get latest polygons
  let polygons = voronoi.cellPolygons();
  let cells = Array.from(polygons);

  // Arrays for centroids and weights
  let centroids = new Array(cells.length);
  let weights = new Array(cells.length).fill(0);
  for (let i = 0; i < centroids.length; i++) {
    centroids[i] = createVector(0, 0);
  }

  // Get the weights of all the pixels and assign to cells
  picCho.loadPixels();
  let delaunayIndex = 0;
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let index = (i + j * width) * 4;
      let r = picCho.pixels[index + 0];
      let g = picCho.pixels[index + 1];
      let b = picCho.pixels[index + 2];
      let bright = (r + g + b) / 3;
      let weight = 1 - bright / 255;
      delaunayIndex = delaunay.find(i, j, delaunayIndex);
      centroids[delaunayIndex].x += i * weight;
      centroids[delaunayIndex].y += j * weight;
      weights[delaunayIndex] += weight;
    }
  }

  // Compute weighted centroids
  for (let i = 0; i < centroids.length; i++) {
    if (weights[i] > 0) {
      centroids[i].div(weights[i]);
    } else {
      centroids[i] = points[i].copy();
    }
  }

  // Interpolate points
  for (let i = 0; i < points.length; i++) {
    points[i].lerp(centroids[i], 0.1);
  }

  // Next voronoi (relaxation)
  delaunay = calculateDelaunay(points);
  voronoi = delaunay.voronoi([0, 0, width, height]);
}

// Calculate Delaunay triangulation from p5.Vectors
function calculateDelaunay(points) {
  let pointsArray = [];
  for (let v of points) {
    pointsArray.push(v.x, v.y);
  }
  return new d3.Delaunay(pointsArray);
}
