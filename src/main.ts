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

const stickers = [
    { emoji: '🚴', id: 'sticker1Button' },
    { emoji: '🍜', id: 'sticker2Button' },
    { emoji: '🥩', id: 'sticker3Button' }
];

stickers.forEach(sticker => {
    const button = document.createElement('button');
    button.innerText = sticker.emoji;
    button.id = sticker.id;
    buttonContainer.appendChild(button);
    button.addEventListener('click', () => {
        currentSticker = sticker.emoji;
        toolPreview = null; // Reset tool preview
        updateSelectedTool(button);
        canvas.dispatchEvent(new Event('tool-moved'));
    });
});

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
    updateSelectedTool(thinButton);
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    previewColor = 'gray'; // Lighter color for thick preview
    currentSticker = null; // Disable sticker mode
    updateSelectedTool(thickButton);
});

// Custom sticker button event listener
customStickerButton.addEventListener('click', () => {
    const customSticker = prompt('Enter your custom sticker:', '⭐');
    if (customSticker) {
        const customStickerObj = { emoji: customSticker, id: `sticker${stickers.length + 1}Button` };
        stickers.push(customStickerObj);
        const button = document.createElement('button');
        button.innerText = customSticker;
        button.id = customStickerObj.id;
        buttonContainer.appendChild(button);
        button.addEventListener('click', () => {
            currentSticker = customSticker;
            toolPreview = null; // Reset tool preview
            updateSelectedTool(button);
            canvas.dispatchEvent(new Event('tool-moved'));
        });
    }
});

// Export button event listener
exportButton.addEventListener('click', () => {
    // Create a new canvas of size 1024x1024
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext('2d')!;
    
    // Scale the context to fit the larger canvas
    exportContext.scale(4, 4);
    
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

//==============================================================================//

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