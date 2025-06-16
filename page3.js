let canvas, ctx;
let isDrawing = false;
let currentTool = 'draw';
let lastX = 0;
let lastY = 0;
let originalImage = null;
let breakClickCount = 0;
let customCursor; // 커서 요소 변수

function initCanvas() {
    canvas = document.getElementById('imageCanvas');
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

function showLargeImage(src) {
    const img = new Image();
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.style.display = 'block';
        canvas.style.opacity = 1;
        originalImage = img;
    };
    img.src = src;
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return [
        (e.clientX - rect.left) * (canvas.width / rect.width),
        (e.clientY - rect.top) * (canvas.height / rect.height)
    ];
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCanvasCoords(e);
}

function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const num = parseInt(hex, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

function draw(e) {
    if (!isDrawing) return;
    const [x, y] = getCanvasCoords(e);
    const color = document.getElementById('colorPicker').value;
    const size = document.getElementById('brushSize').value;
    ctx.lineCap = 'round';
    if (currentTool === 'draw') {
        const dist = Math.hypot(x - lastX, y - lastY);
        const steps = Math.ceil(dist / 2);
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const ix = lastX + (x - lastX) * t;
            const iy = lastY + (y - lastY) * t;
            const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, size / 2);
            grad.addColorStop(0, color);
            grad.addColorStop(0.5, hexToRgba(color, 0.4));
            grad.addColorStop(1, hexToRgba(color, 0));
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(ix, iy, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        [lastX, lastY] = [x, y];
    }
}

function createShatteredPiece(tri) {
    const w = canvas.width;
    const h = canvas.height;
    const pieceCanvas = document.createElement('canvas');
    pieceCanvas.width = w;
    pieceCanvas.height = h;
    const pieceCtx = pieceCanvas.getContext('2d');

    // 1. 조각 이미지 생성
    pieceCtx.save();
    pieceCtx.beginPath();
    pieceCtx.moveTo(tri[0][0], tri[0][1]);
    pieceCtx.lineTo(tri[1][0], tri[1][1]);
    pieceCtx.lineTo(tri[2][0], tri[2][1]);
    pieceCtx.closePath();
    pieceCtx.clip();
    pieceCtx.drawImage(canvas, 0, 0);
    pieceCtx.restore();

    // 2. canvas에서 해당 부분 지우기 (구멍 효과)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tri[0][0], tri[0][1]);
    ctx.lineTo(tri[1][0], tri[1][1]);
    ctx.lineTo(tri[2][0], tri[2][1]);
    ctx.closePath();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // 3. DOM에 조각 추가
    const rect = canvas.getBoundingClientRect();
    pieceCanvas.style.position = 'fixed';
    pieceCanvas.style.left = rect.left + 'px';
    pieceCanvas.style.top = rect.top + 'px';
    pieceCanvas.style.width = rect.width + 'px';
    pieceCanvas.style.height = rect.height + 'px';
    pieceCanvas.style.pointerEvents = 'none';
    pieceCanvas.style.zIndex = 20;

    // 4. 애니메이션
    const tx = (Math.random() - 0.5) * 600;
    const ty = (Math.random() - 0.5) * 600;
    const rotate = (Math.random() - 0.5) * 720;

    pieceCanvas.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`, opacity: 0 }
    ], {
        duration: 1500 + Math.random() * 400,
        easing: 'ease-out',
        fill: 'forwards'
    });

    document.body.appendChild(pieceCanvas);
    setTimeout(() => pieceCanvas.remove(), 2000);
}

function shatterAtPoint(x, y, size) {
    breakClickCount++;
    const pieces = 8 + breakClickCount * 2;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = x * scaleX;
    const cy = y * scaleY;
    const r = size * scaleX / 2 + breakClickCount * 10;

    const points = [];
    for (let i = 0; i < pieces; i++) {
        const angle = (Math.PI * 2 / pieces) * i + Math.random() * 0.3;
        const radius = r * (0.7 + Math.random() * 0.5);
        points.push([
            cx + Math.cos(angle) * radius,
            cy + Math.sin(angle) * radius
        ]);
    }
    points.push([cx, cy]);

    for (let i = 0; i < pieces; i++) {
        const tri = [points[i], points[(i + 1) % pieces], points[pieces]];
        createShatteredPiece(tri);
    }

    // canvas는 유지됨 (사라지지 않음!)
}

function stopDrawing() {
    isDrawing = false;
}

function setTool(tool) {
    currentTool = tool;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.opacity = 1;
    canvas.style.display = 'block';
    if (originalImage) {
        ctx.drawImage(originalImage, 0, 0);
    }
}

function saveImage() {
    const link = document.createElement('a');
    link.download = 'vandalized-image.png';
    link.href = canvas.toDataURL();
    link.click();
}

window.addEventListener('load', initCanvas);

document.addEventListener('click', function (event) {
    const largeImage = document.getElementById('largeImage');
    const imageStack = document.querySelector('.image-stack');
    if (!imageStack.contains(event.target) && event.target !== largeImage) {
        largeImage.style.display = 'none';
    }
});

// 도구 선택 함수
function selectTool(tool) {
    currentTool = tool;
    // 도구 버튼 스타일 업데이트
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
}




window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.wrap').classList.add('show');
    document.querySelector('.content').classList.add('show');
  });