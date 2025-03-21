//ims-W1-Luna

// Coding Train / Daniel Shiffman
// Weighted Voronoi Stippling
// https://thecodingtrain.com/challenges/181-image-stippling
// original code: https://editor.p5js.org/codingtrain/sketches/Z_YV25_4G

// I also add something for picture loading & canvas size to the code^^

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
  //I added this part to let the sketch more ajustable to all the images being uploaded
  // Scale the image while keeping aspect ratio
  let maxSize = 800;
  let reScale = maxSize / max(picCho.width, picCho.height);

  // Resize the image
  imgWidth = int(picCho.width * reScale);
  imgHeight = int(picCho.height * reScale);

  picCho.resize(imgWidth, imgHeight);

  //Same size as the picture being chosen
  createCanvas(imgWidth, imgHeight);

  // Generate random points avoiding bright areas
  // generateRandomPoints(6000);
  // The line above is the original code, I want to have the number of the points adjusting accoding to the picture size so I modified it into the one below
  generateRandomPoints((imgWidth * imgHeight) / 50);

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
    //Get the color of the point pos in orginal picture
    let col = picCho.get(x, y);
    //About Alpha: Brighter part is more lightly to be abandoned, darker part is more likely to be got & stored
    //Ex. random(100)=50, Point A bright(col)=25, got; Point B bright(col)=75, neglected
    if (random(100) > brightness(col)) {
      points.push(createVector(x, y));
    } else {
      //try & try & try until reach the number of the points required
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
      //i --> xpos, j --> ypos, through the calculation, we can get the rgba (4 in total) info of the corresponding pixel in the picture
      let index = (i + j * width) * 4;
      let r = picCho.pixels[index + 0];
      let g = picCho.pixels[index + 1];
      let b = picCho.pixels[index + 2];
      //calculate brightness through rgb
      let bright = (r + g + b) / 3;
      //determine whether it's bright or dark --> the weight of darkness
      //darker --> weight higher
      let weight = 1 - bright / 255;
      //determine which voronoi the pixel belongs to
      delaunayIndex = delaunay.find(i, j, delaunayIndex);
      //AWWWW, I couldn't understand the lines below as for how they work, which I think is indeed the essential part of this sketch
      //calculate & store the total weight inside a voronoi
      centroids[delaunayIndex].x += i * weight;
      centroids[delaunayIndex].y += j * weight;
      weights[delaunayIndex] += weight;
    }
  }

  // Compute weighted centroids
  for (let i = 0; i < centroids.length; i++) {
    if (weights[i] > 0) {
      //So as to how it works
      //calculate the pos of the centroids according to the weight
      centroids[i].div(weights[i]);
    } else {
      //no pixel inside the voronoi --> remain the original pos as points[i]
      centroids[i] = points[i].copy();
    }
  }

  // Interpolate points
  for (let i = 0; i < points.length; i++) {
    //https://p5js.org/reference/p5/lerp/
    //points[i] gradually (0.1) move to centroids
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
  //https://github.com/d3/d3-delaunay
  return new d3.Delaunay(pointsArray);
}
