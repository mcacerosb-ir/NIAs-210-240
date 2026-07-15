/* ========== MOTOR MAPA MENTAL — Estilo Medieval/Pizarra ========== */
function renderMindMap(id) {
  const data = mmData[id];
  const viewport = document.getElementById('mm-viewport-' + id);
  let html = '';

  data.branches.forEach(b => {
    html += drawCurve(data.center.x, data.center.y, b.x, b.y, b.color, 2.5);
    b.sub.forEach(s => {
      html += drawCurve(b.x, b.y, s.x, s.y, s.color, 1.5);
    });
  });

  data.branches.forEach(b => {
    html += drawNode(b.x, b.y, b.text, b.color, '#F5EDE0', 14, 1, b, id);
    b.sub.forEach(s => {
      html += drawNode(s.x, s.y, s.text, s.color, '#F5EDE0', 12, 2, s, id);
    });
  });

  html += drawNode(data.center.x, data.center.y, data.center.text, data.center.color, '#D4AF37', 18, 0, data.center, id);

  viewport.innerHTML = html;
}

function drawCurve(x1, y1, x2, y2, color, width) {
  const mx = (x1 + x2) / 2;
  return `<path d="M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="0.5"/>`;
}

function drawNode(x, y, text, fill, textColor, fontSize, level, data, mapId) {
  const lines = text.split('\n');
  const lineH = fontSize * 1.4;
  const h = lines.length * lineH + 24;
  const maxW = Math.max(...lines.map(l => l.length));
  const w = Math.max(110, maxW * fontSize * 0.6 + 32);
  const rx = level === 0 ? 24 : (level === 1 ? 18 : 14);
  const esc = JSON.stringify(data).replace(/"/g, '&quot;');

  let textHtml = lines.map((l, i) =>
    `<text x="${x}" y="${y - (lines.length-1)*lineH/2 + i*lineH + 6}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="${fontSize}px" font-weight="500" font-family="'Caveat', cursive">${l}</text>`
  ).join('');

  return `<g class="mm-node" data-info="${esc}" data-map="${mapId}" onclick="onNodeClick(this)">
    <rect class="mm-node-rect" x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" filter="url(#mm-shadow-${mapId})" stroke="rgba(212,175,55,0.6)" stroke-width="2"/>
    ${textHtml}
  </g>`;
}

function onNodeClick(el) {
  const mapId = el.getAttribute('data-map');
  document.querySelectorAll('.mm-node[data-map="' + mapId + '"]').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  const info = JSON.parse(el.getAttribute('data-info'));
  document.getElementById('mm-detail-' + mapId).classList.add('show');
  document.getElementById('mm-detail-title-' + mapId).textContent = info.text.replace(/\n/g, ' ');
  document.getElementById('mm-detail-desc-' + mapId).textContent = info.desc || 'Sin descripción adicional.';
}

function closeDetail(mapId) {
  document.getElementById('mm-detail-' + mapId).classList.remove('show');
  document.querySelectorAll('.mm-node[data-map="' + mapId + '"]').forEach(n => n.classList.remove('active'));
}

function mmUpdateTransform(id) {
  const s = mmState[id];
  document.getElementById('mm-viewport-' + id).setAttribute('transform', `translate(${s.tx},${s.ty}) scale(${s.scale})`);
}

function mmZoom(id, factor) {
  const s = mmState[id];
  const container = document.getElementById('mm-canvas-' + id);
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2, cy = rect.height / 2;
  s.tx = cx - (cx - s.tx) * factor;
  s.ty = cy - (cy - s.ty) * factor;
  s.scale *= factor;
  s.scale = Math.max(0.3, Math.min(4, s.scale));
  mmUpdateTransform(id);
}

function mmReset(id) {
  mmState[id] = { scale: 1, tx: 0, ty: 0 };
  mmUpdateTransform(id);
}

function setupPanZoom(id) {
  const container = document.getElementById('mm-canvas-' + id);
  let isDragging = false, lastX = 0, lastY = 0;

  container.addEventListener('mousedown', e => {
    if (e.target.closest('.mm-node') || e.target.closest('.mm-controls') || e.target.closest('.mm-detail')) return;
    isDragging = true; lastX = e.clientX; lastY = e.clientY;
    container.classList.add('grabbing');
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    mmState[id].tx += e.clientX - lastX;
    mmState[id].ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    mmUpdateTransform(id);
  });
  window.addEventListener('mouseup', () => { isDragging = false; container.classList.remove('grabbing'); });

  container.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const s = mmState[id];
    s.tx = mx - (mx - s.tx) * factor;
    s.ty = my - (my - s.ty) * factor;
    s.scale *= factor;
    s.scale = Math.max(0.3, Math.min(4, s.scale));
    mmUpdateTransform(id);
  }, { passive: false });
}