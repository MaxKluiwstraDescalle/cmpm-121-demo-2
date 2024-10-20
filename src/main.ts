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

const sticker1Button = document.createElement('button');
sticker1Button.innerText = '🚴'; // Cycling emoji
sticker1Button.id = 'sticker1Button';

const sticker2Button = document.createElement('button');
sticker2Button.innerText = '🍜'; // Noodles emoji
sticker2Button.id = 'sticker2Button';

const sticker3Button = document.createElement('button');
sticker3Button.innerText = '🥩'; // Steak emoji
sticker3Button.id = 'sticker3Button';

buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);
buttonContainer.appendChild(sticker1Button);
buttonContainer.appendChild(sticker2Button);
buttonContainer.appendChild(sticker3Button);

container.appendChild(canvas);
container.appendChild(buttonContainer);
document.body.appendChild(container);

let isDrawing = false;
let points: (MarkerLine | Sticker)[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: (MarkerLine | Sticker)[] = [];
let currentThickness = 1; // Default thickness
let toolPreview: ToolPreview | StickerPreview | null = null;
let previewColor = 'black'; // Default color for thin preview
let currentSticker: string | null = null;

const context = canvas.getContext('2d')!;
if (!context) {
    throw new Error('Unable to get 2D context');
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', moveTool);

function startDrawing(event: MouseEvent) {
    const { offsetX, offsetY } = getMousePosition(event);
    if (currentSticker) {
        const sticker = new Sticker(offsetX, offsetY, currentSticker);
        points.push(sticker);
        toolPreview = null; // Hide tool preview when placing a sticker
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        isDrawing = true;
        currentLine = new MarkerLine(offsetX, offsetY, currentThickness);
        points.push(currentLine);
        toolPreview = null; // Hide tool preview when drawing
    }
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
    if (currentSticker) {
        if (!toolPreview || !(toolPreview instanceof StickerPreview)) {
            toolPreview = new StickerPreview(offsetX, offsetY, currentSticker);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    } else {
        if (!toolPreview || !(toolPreview instanceof ToolPreview)) {
            toolPreview = new ToolPreview(offsetX, offsetY, currentThickness, previewColor);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
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

// Observer for "drawing-changed" and "tool-moved" events
canvas.addEventListener('drawing-changed', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(item => item.display(context));
    if (toolPreview) {
        toolPreview.draw(context);
    }
});

canvas.addEventListener('tool-moved', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(item => item.display(context));
    if (toolPreview) {
        toolPreview.draw(context);
    }
});

// Clear button event listener
clearButton.addEventListener('click', () => {
    points = [];
    redoStack = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event('drawing-changed'));
});

// Undo button event listener
undoButton.addEventListener('click', () => {
    if (points.length > 0) {
        const lastItem = points.pop();
        if (lastItem) {
            redoStack.push(lastItem);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

// Redo button event listener
redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lastItem = redoStack.pop();
        if (lastItem) {
            points.push(lastItem);
        }
        canvas.dispatchEvent(new Event('drawing-changed'));
    }
});

// Tool buttons event listeners
thinButton.addEventListener('click', () => {
    currentThickness = 1;
    previewColor = 'black'; // Darker color for thin preview
    currentSticker = null; // Disable sticker mode
    thinButton.classList.add('selectedTool');
    thickButton.classList.remove('selectedTool');
    sticker1Button.classList.remove('selectedTool');
    sticker2Button.classList.remove('selectedTool');
    sticker3Button.classList.remove('selectedTool');
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    previewColor = 'gray'; // Lighter color for thick preview
    currentSticker = null; // Disable sticker mode
    thickButton.classList.add('selectedTool');
    thinButton.classList.remove('selectedTool');
    sticker1Button.classList.remove('selectedTool');
    sticker2Button.classList.remove('selectedTool');
    sticker3Button.classList.remove('selectedTool');
});

// Sticker buttons event listeners
sticker1Button.addEventListener('click', () => {
    currentSticker = '🚴'; // Cycling emoji
    toolPreview = null; // Reset tool preview
    sticker1Button.classList.add('selectedTool');
    sticker2Button.classList.remove('selectedTool');
    sticker3Button.classList.remove('selectedTool');
    thinButton.classList.remove('selectedTool');
    thickButton.classList.remove('selectedTool');
    canvas.dispatchEvent(new Event('tool-moved'));
});

sticker2Button.addEventListener('click', () => {
    currentSticker = '🍜'; // Noodles emoji
    toolPreview = null; // Reset tool preview
    sticker2Button.classList.add('selectedTool');
    sticker1Button.classList.remove('selectedTool');
    sticker3Button.classList.remove('selectedTool');
    thinButton.classList.remove('selectedTool');
    thickButton.classList.remove('selectedTool');
    canvas.dispatchEvent(new Event('tool-moved'));
});

sticker3Button.addEventListener('click', () => {
    currentSticker = '🥩'; // Steak emoji
    toolPreview = null; // Reset tool preview
    sticker3Button.classList.add('selectedTool');
    sticker1Button.classList.remove('selectedTool');
    sticker2Button.classList.remove('selectedTool');
    thinButton.classList.remove('selectedTool');
    thickButton.classList.remove('selectedTool');
    canvas.dispatchEvent(new Event('tool-moved'));
});

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
    private color: string;

    constructor(x: number, y: number, thickness: number, color: string) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
        this.color = color;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
    }
}

class Sticker {
    private x: number;
    private y: number;
    private emoji: string;

    constructor(x: number, y: number, emoji: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
    }

    display(context: CanvasRenderingContext2D) {
        context.font = '24px serif';
        context.fillText(this.emoji, this.x, this.y);
    }
}

class StickerPreview {
    private x: number;
    private y: number;
    private emoji: string;

    constructor(x: number, y: number, emoji: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(context: CanvasRenderingContext2D) {
        context.font = '24px serif';
        context.fillText(this.emoji, this.x, this.y);
    }
}