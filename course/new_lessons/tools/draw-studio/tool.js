import { createEmbeddedToolBridge } from "../shared/tool-bridge.js";

const canvas = document.getElementById("draw-surface");
const ctx = canvas.getContext("2d");
const status = document.getElementById("studio-status");
const clearButton = document.getElementById("clear-canvas");
const finishButton = document.getElementById("finish-drawing");
const sizeInput = document.getElementById("brush-size");
const swatches = Array.from(document.querySelectorAll(".swatch"));
const notifyLessonCompleted = createEmbeddedToolBridge("draw-studio");

let drawing = false;
let hasDrawn = false;
let currentColor = "#f97316";

ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = currentColor;
ctx.lineWidth = Number(sizeInput.value);

function setStatus(message) {
  status.textContent = message;
}

function setColor(color) {
  currentColor = color;
  ctx.strokeStyle = currentColor;
  swatches.forEach((swatch) => {
    swatch.classList.toggle("is-active", swatch.dataset.color === color);
  });
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function startDrawing(event) {
  drawing = true;
  const { x, y } = pointerPosition(event);
  ctx.beginPath();
  ctx.moveTo(x, y);
  hasDrawn = true;
  setStatus("Малюй далі. Коли будеш готовий(а), натисни «Готово».");
}

function moveDrawing(event) {
  if (!drawing) {
    return;
  }

  const { x, y } = pointerPosition(event);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function stopDrawing() {
  drawing = false;
  ctx.closePath();
}

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => setColor(swatch.dataset.color || currentColor));
});

sizeInput.addEventListener("input", () => {
  ctx.lineWidth = Number(sizeInput.value);
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
  setStatus("Полотно очищено. Спробуй новий малюнок.");
});

finishButton.addEventListener("click", () => {
  if (!hasDrawn) {
    setStatus("Спочатку намалюй хоча б кілька ліній.");
    return;
  }

  notifyLessonCompleted();
  setStatus("Готово. Можна повернутися до уроку.");
});

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", moveDrawing);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

setColor(currentColor);
