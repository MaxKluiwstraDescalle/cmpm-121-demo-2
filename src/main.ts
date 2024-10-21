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

const buttonContainer = document.createElement('div');
buttonContainer.id = 'buttonContainer';

const clearButton = document.createElement('button');
clearButton.innerText = 'Clear';
clearButton.id = 'clearButton';

const undoButton = document.createElement('button');
undoButton.innerText = 'Undo';
undoButton.id = 'undoButton';

const redoButton = document.createElement('button');
redoButton.innerText = 'Redo';
redoButton.id = 'redoButton';

const thinButton = document.createElement('button');
thinButton.innerText = 'Thin';
thinButton.id = 'thinButton';

const thickButton = document.createElement('button');
thickButton.innerText = 'Thick';
thickButton.id = 'thickButton';

//=======================================================//

buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);

container.appendChild(canvas);
container.appendChild(buttonContainer);
document.body.appendChild(container);

//=======================================================//

let isDrawing = false;
let points: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: MarkerLine[] = [];
let currentThickness = 1; 
let toolPreview: ToolPreview | null = null;

const context = canvas.getContext('2d')!;
if (!context) {
    throw new Error('Unable to get 2D context');
}
//=======================================================//

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', moveTool);

//=======================================================//

function startDrawing(event: MouseEvent) {
    isDrawing = true;
    const { offsetX, offsetY } = getMousePosition(event);
    currentLine = new MarkerLine(offsetX, offsetY, currentThickness);
    points.push(currentLine);
    toolPreview = null;
}

function draw(event: MouseEvent) {
    if (!isDrawing || !currentLine) return;
    const { offsetX, offsetY } = getMousePosition(event);
    currentLine.drag(offsetX, offsetY);
    canvas.dispatchEvent(new Event('drawing-changed'));
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        currentLine = null;
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
}

function moveTool(event: MouseEvent) {
    if (isDrawing) return;
    const { offsetX, offsetY } = getMousePosition(event);
    if (!toolPreview) {
        toolPreview = new ToolPreview(offsetX, offsetY, currentThickness);
    } else {
        toolPreview.updatePosition(offsetX, offsetY);
    }
    canvas.dispatchEvent(new Event('tool-moved'));
}

function getMousePosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
    };
}

//=======================================================//

canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(line => line.display(context));
    if (toolPreview) {
        toolPreview.draw(context);
    }
});

canvas.addEventListener('tool-moved', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(line => line.display(context));
    if (toolPreview) {
        toolPreview.draw(context);
    }
});

clearButton.addEventListener('click', () => {
    points = [];
    redoStack = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event('drawing-changed'));
});

undoButton.addEventListener('click', () => {
    if (points.length > 0) {
        const lastLine = points.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastLine = redoStack.pop();
        if (lastLine) {
            points.push(lastLine);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

thinButton.addEventListener('click', () => {
    currentThickness = 1;
    thinButton.classList.add('selectedTool');
    thickButton.classList.remove('selectedTool');
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    thickButton.classList.add('selectedTool');
    thinButton.classList.remove('selectedTool');
});

//=======================================================//

class MarkerLine {
    private points: { x: number, y: number }[] = [];
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points.push({ x, y });
        this.thickness = thickness;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(context: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.lineWidth = this.thickness;
        context.stroke();
    }
}

class ToolPreview {
    private x: number;
    private y: number;
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 0, 0, 180)';
        context.fill();
    }
}