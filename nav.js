/* ========== NAVEGACIÓN POR PESTAÑAS — Compartido ========== */
function showSection(id) {
  // Ocultar todas las secciones
  document.querySelectorAll('.section-panel').forEach(function(p) {
    p.classList.remove('active');
  });
  
  // Desactivar todas las pestañas
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  
  // Mostrar la sección seleccionada
  var targetPanel = document.getElementById('sec-' + id);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }
  
  // Activar la pestaña correspondiente
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    var onclickAttr = btn.getAttribute('onclick');
    if (onclickAttr && onclickAttr.indexOf("'" + id + "'") !== -1) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
  });
}