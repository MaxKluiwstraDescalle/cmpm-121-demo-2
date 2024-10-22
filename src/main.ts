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
canvas.width = 512;
canvas.height = 512;

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

const customStickerButton = document.createElement('button');
customStickerButton.innerText = 'Custom Sticker';
customStickerButton.id = 'customStickerButton';

const exportButton = document.createElement('button');
exportButton.innerText = 'Export';
exportButton.id = 'exportButton';

buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);
buttonContainer.appendChild(customStickerButton);
buttonContainer.appendChild(exportButton);

// Create button for cyclist sticker with rotation
const cyclistButton = document.createElement('button');
cyclistButton.innerText = '🚴';
cyclistButton.id = 'sticker1Button';
buttonContainer.appendChild(cyclistButton);
cyclistButton.addEventListener('click', () => {
    currentSticker = '🚴';
    randomizeRotation();
    toolPreview = null; 
    updateSelectedTool(cyclistButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

// Create button for noodles sticker without rotation
const noodlesButton = document.createElement('button');
noodlesButton.innerText = '🍜';
noodlesButton.id = 'sticker2Button';
buttonContainer.appendChild(noodlesButton);
noodlesButton.addEventListener('click', () => {
    currentSticker = '🍜';
    currentRotation = 0; 
    toolPreview = null; 
    updateSelectedTool(noodlesButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

// Create button for steak sticker without rotation
const steakButton = document.createElement('button');
steakButton.innerText = '🥩';
steakButton.id = 'sticker3Button';
buttonContainer.appendChild(steakButton);
steakButton.addEventListener('click', () => {
    currentSticker = '🥩';
    currentRotation = 0; 
    toolPreview = null; 
    updateSelectedTool(steakButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

container.appendChild(canvas);
container.appendChild(buttonContainer);
document.body.appendChild(container);

let isDrawing = false;
let points: (MarkerLine | Sticker)[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: (MarkerLine | Sticker)[] = [];
let currentThickness = 1; // Default thickness
let currentColor = '#000000'; // Default color
let currentRotation = 0; // Default rotation
let toolPreview: ToolPreview | StickerPreview | null = null;
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
        const sticker = new Sticker(offsetX, offsetY, currentSticker, currentRotation);
        points.push(sticker);
        toolPreview = null; // Hide tool preview when placing a sticker
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        isDrawing = true;
        currentLine = new MarkerLine(offsetX, offsetY, currentThickness, currentColor);
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
            toolPreview = new StickerPreview(offsetX, offsetY, currentSticker, currentRotation);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    } else {
        if (!toolPreview || !(toolPreview instanceof ToolPreview)) {
            toolPreview = new ToolPreview(offsetX, offsetY, currentThickness, currentColor);
        } else {
            toolPreview.updatePosition(offsetX, offsetY);
        }
    }
    canvas.dispatchEvent(new Event('tool-moved'));
}

function getMousePosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        offsetX: (event.clientX - rect.left) * scaleX,
        offsetY: (event.clientY - rect.top) * scaleY
    };
}

//=========================================================//

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
    currentSticker = null; // Disable sticker mode
    updateSelectedTool(thinButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    currentSticker = null; // Disable sticker mode
    updateSelectedTool(thickButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

// Custom sticker button event listener
customStickerButton.addEventListener('click', () => {
    const customSticker = prompt('Enter your custom sticker:', '⭐');
    if (customSticker) {
        const button = document.createElement('button');
        button.innerText = customSticker;
        button.id = `sticker${Date.now()}`; // Unique ID
        buttonContainer.appendChild(button);
        button.addEventListener('click', () => {
            currentSticker = customSticker;
            currentRotation = 0; // No rotation for custom stickers
            toolPreview = null; // Reset tool preview
            updateSelectedTool(button);
            canvas.dispatchEvent(new Event('tool-moved'));
        });
    }
});

// Define the color picker element
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.id = 'colorPicker';
buttonContainer.appendChild(colorPicker);

// Color picker event listener
colorPicker.addEventListener('input', (event) => {
    currentColor = (event.target as HTMLInputElement).value;
});

// Export button event listener
exportButton.addEventListener('click', () => {
    // Create a new canvas of size 1024x1024
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext('2d')!;
    
    // Scale the context to fit the larger canvas
    exportContext.scale(2, 2);
    
    // Execute all items on the display list against the new context
    points.forEach(item => item.display(exportContext));
    
    // Trigger a file download with the contents of the canvas as a PNG file
    exportCanvas.toBlob(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob!);
        link.download = 'sketchpad_export.png';
        link.click();
    });
});

function updateSelectedTool(selectedButton: HTMLButtonElement) {
    const allButtons = buttonContainer.querySelectorAll('button');
    allButtons.forEach(button => button.classList.remove('selectedTool'));
    selectedButton.classList.add('selectedTool');
}

function randomizeRotation() {
    currentRotation = Math.floor(Math.random() * 360);
}

//=========================================================//

class MarkerLine {
    private points: { x: number, y: number }[] = [];
    private thickness: number;
    private color: string;

    constructor(x: number, y: number, thickness: number, color: string) {
        this.points.push({ x, y });
        this.thickness = thickness;
        this.color = color;
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
        context.strokeStyle = this.color;
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
    private rotation: number;

    constructor(x: number, y: number, emoji: string, rotation: number) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.rotation = rotation;
    }

    display(context: CanvasRenderingContext2D) {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation * Math.PI / 180);
        context.font = '24px serif';
        context.fillText(this.emoji, 0, 0);
        context.restore();
    }
}

class StickerPreview {
    private x: number;
    private y: number;
    private emoji: string;
    private rotation: number;

    constructor(x: number, y: number, emoji: string, rotation: number) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.rotation = rotation;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(context: CanvasRenderingContext2D) {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation * Math.PI / 180);
        context.font = '24px serif';
        context.fillText(this.emoji, 0, 0);
        context.restore();
    }
}