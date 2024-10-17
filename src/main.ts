import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const gameName = "Sketchpad";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const container = document.createElement("div");
container.id = 'canvasContainer';

const canvas = document.createElement("canvas");
canvas.id = 'drawingCanvas';

const clearButton = document.createElement('button');
clearButton.innerText = 'Clear';
clearButton.id = 'clearButton';

container.appendChild(canvas);
container.appendChild(clearButton);
document.body.appendChild(container);

let isDrawing = false;
let points: { x: number, y: number }[][] = [];
let currentLine: { x: number, y: number }[] = [];

const context = canvas.getContext('2d')!;
if (!context) {
    throw new Error('Unable to get 2D context');
}


canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(event: MouseEvent) {
    isDrawing = true;
    currentLine = [];
    addPoint(event);
}

function draw(event: MouseEvent) {
    if (!isDrawing) return;
    addPoint(event);
}

function stopDrawing() {
    if (isDrawing) {
        points.push(currentLine);
        isDrawing = false;
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
}

function addPoint(event: MouseEvent) {
    const { offsetX, offsetY } = getMousePosition(event);
    currentLine.push({ x: offsetX, y: offsetY });
    canvas.dispatchEvent(new Event('drawing-changed'));
}

function getMousePosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
    };
}


canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(line => {
        context.beginPath();
        line.forEach((point, index) => {
            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        });
        context.stroke();
    });
  
    if (currentLine.length > 0) {
        context.beginPath();
        currentLine.forEach((point, index) => {
            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        });
        context.stroke();
    }
});


clearButton.addEventListener('click', () => {
    points = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
});