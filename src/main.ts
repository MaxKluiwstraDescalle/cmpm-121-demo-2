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

//========================================================//

buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);
buttonContainer.appendChild(customStickerButton);
buttonContainer.appendChild(exportButton);

//========================================================//

function createStickerButton(emoji: string, container: HTMLElement) {
    const button = document.createElement('button');
    button.innerText = emoji;
    button.id = `sticker${emoji}Button`;
    button.addEventListener('click', () => {
        currentSticker = emoji;
        randomizeRotation();
        toolPreview = null;
        updateSelectedTool(button);
        canvas.dispatchEvent(new Event('tool-moved'));
    });
    container.appendChild(button);
}

createStickerButton('🚴', buttonContainer);
createStickerButton('🍜', buttonContainer);
createStickerButton('🥩', buttonContainer);

//=========================================================//

container.appendChild(canvas);
container.appendChild(buttonContainer);
document.body.appendChild(container);

let isDrawing = false;
let points: (MarkerLine | Sticker)[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: (MarkerLine | Sticker)[] = [];
let currentThickness = 1; 
let currentColor = '#000000'; 
let currentRotation = 0; 
let toolPreview: ToolPreview | StickerPreview | null = null;
let currentSticker: string | null = null;

const context = canvas.getContext('2d')!;
if (!context) {
    throw new Error('Unable to get 2D context');
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', moveTool);

//=========================================================//

function startDrawing(event: MouseEvent) {
    const { offsetX, offsetY } = getMousePosition(event);
    if (currentSticker) {
        const sticker = new Sticker(offsetX, offsetY, currentSticker, currentRotation);
        points.push(sticker);
        toolPreview = null; 
        canvas.dispatchEvent(new Event('drawing-changed'));
    } else {
        isDrawing = true;
        currentLine = new MarkerLine(offsetX, offsetY, currentThickness, currentColor);
        points.push(currentLine);
        toolPreview = null; 
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

clearButton.addEventListener('click', () => {
    points = [];
    redoStack = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dispatchEvent(new Event('drawing-changed'));
});

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

thinButton.addEventListener('click', () => {
    currentThickness = 1;
    currentSticker = null;
    updateSelectedTool(thinButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

thickButton.addEventListener('click', () => {
    currentThickness = 5;
    currentSticker = null; 
    updateSelectedTool(thickButton);
    canvas.dispatchEvent(new Event('tool-moved'));
});

customStickerButton.addEventListener('click', () => {
    const customSticker = prompt('Enter your custom sticker:', '⭐');
    if (customSticker) {
        const button = document.createElement('button');
        button.innerText = customSticker;
        button.id = `sticker${Date.now()}`;
        buttonContainer.appendChild(button);
        button.addEventListener('click', () => {
            currentSticker = customSticker;
            currentRotation = 0;
            toolPreview = null; 
            updateSelectedTool(button);
            canvas.dispatchEvent(new Event('tool-moved'));
        });
    }
});

const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.id = 'colorPicker';
buttonContainer.appendChild(colorPicker);

colorPicker.addEventListener('input', (event) => {
    currentColor = (event.target as HTMLInputElement).value;
});

exportButton.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext('2d')!;
    exportContext.scale(2, 2);
    points.forEach(item => item.display(exportContext));
    exportCanvas.toBlob(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob!);
        link.download = 'sketchpad_export.png';
        link.click();
    });
});

//=========================================================//

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