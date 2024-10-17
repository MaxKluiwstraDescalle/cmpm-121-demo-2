import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const gameName = "Sketchpad";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.id = 'drawingCanvas';

document.body.appendChild(canvas);

let isDrawing = false;

const context = canvas.getContext('2d')!;
if (!context) {
    throw new Error('Unable to get 2D context');
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(event: MouseEvent) {
    isDrawing = true;
    const { offsetX, offsetY } = getMousePosition(event);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
}

function draw(event: MouseEvent) {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getMousePosition(event);
    context.lineTo(offsetX, offsetY);
    context.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function getMousePosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
    };
}

const clearButton = document.createElement('button');
clearButton.innerText = 'Clear';
clearButton.addEventListener('click', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});
document.body.appendChild(clearButton);