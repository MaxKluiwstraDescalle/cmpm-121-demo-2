import "./style.css";

//const APP_NAME = "Sketchpad Assignement";
const app = document.querySelector<HTMLDivElement>("#app")!;

//document.title = APP_NAME;
//app.innerHTML = APfP_NAME;


const gameName = "Sketchpad";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.id = 'drawingCanvas';

document.body.appendChild(canvas);