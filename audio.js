/* ============================================================
   audio.js — Síntesis de Voz para Resúmenes de NIA
   Utiliza la Web Speech API (SpeechSynthesis) del navegador.
   ============================================================ */

/**
 * Obtiene la preferencia de voz en español.
 * Busca voces en español (España o América Latina) y las ordena por preferencia.
 */
function getSpanishVoice() {
  var voices = window.speechSynthesis.getVoices();
  // Preferencia: español de España > español latinoamericano > cualquier español
  var preferred = voices.filter(function(v) {
    return v.lang && v.lang.startsWith('es');
  });
  if (preferred.length === 0) return null;

  // Buscar voz con "Spain" o "España" primero
  var spainVoice = preferred.find(function(v) {
    return v.lang === 'es-ES' || v.lang.includes('ES');
  });
  return spainVoice || preferred[0];
}

/**
 * Variables de estado global.
 */
var currentUtterance = null;
var currentId = null;
var lastProgress = 0;
var voicesLoaded = false;
var stopTimeoutId = null;

/**
 * Inicializa el flag de voces cargadas.
 */
if (window.speechSynthesis) {
  if (window.speechSynthesis.getVoices().length > 0) {
    voicesLoaded = true;
  } else {
    window.speechSynthesis.onvoiceschanged = function() {
      voicesLoaded = true;
    };
  }
}

/**
 * Actualiza el estado visual del reproductor de audio.
 * @param {string} id - Identificador de la norma ("210" o "240")
 * @param {string} status - Texto de estado
 * @param {number} progress - Porcentaje de progreso (0-100)
 */
function updateAudioUI(id, status, progress) {
  var statusEl = document.getElementById('status-' + id);
  var progressEl = document.getElementById('progress-' + id);
  if (statusEl) statusEl.textContent = status;
  if (progressEl) progressEl.style.width = Math.min(100, Math.max(0, progress)) + '%';
}

/**
 * Actualiza las clases de los botones de audio para reflejar el estado activo.
 * @param {string} id - Identificador de la norma
 * @param {string} activeBtn - Botón activo: 'play', 'pause', o null (ninguno)
 */
function updateAudioButtons(id, activeBtn) {
  var panel = document.getElementById('sec-audio');
  if (!panel) return;
  var buttons = panel.querySelectorAll('.audio-btn');
  buttons.forEach(function(btn) {
    btn.classList.remove('playing', 'paused', 'stopped');
    if (activeBtn === 'play' && btn.classList.contains('play')) {
      btn.classList.add('playing');
    } else if (activeBtn === 'pause' && btn.classList.contains('pause')) {
      btn.classList.add('paused');
    } else if (activeBtn === 'stop' && btn.classList.contains('stop')) {
      btn.classList.add('stopped');
    }
  });
}

/**
 * Reproduce el texto proporcionado mediante síntesis de voz.
 * @param {string} text - Texto a reproducir
 * @param {string} id - Identificador de la norma (ej. "210", "240")
 */
function speak(text, id) {
  // Limpiar cualquier timeout pendiente (evita race condition)
  if (stopTimeoutId) {
    clearTimeout(stopTimeoutId);
    stopTimeoutId = null;
  }

  // Cancelar cualquier reproducción anterior
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }

  if (!text || text.trim() === '') {
    updateAudioUI(id, '❌ No hay texto para reproducir.', 0);
    updateAudioButtons(id, null);
    return;
  }

  // Verificar soporte de SpeechSynthesis
  if (!window.speechSynthesis) {
    updateAudioUI(id, '❌ Tu navegador no soporta síntesis de voz.', 0);
    updateAudioButtons(id, null);
    return;
  }

  currentId = id;
  lastProgress = 0;

  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.92;        // Velocidad ligeramente pausada para claridad
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Intentar asignar voz en español
  var voice = getSpanishVoice();
  if (voice) {
    utterance.voice = voice;
  }

  // Evento: inicio
  utterance.onstart = function() {
    updateAudioUI(currentId, '▶ Reproduciendo...', 0);
    updateAudioButtons(currentId, 'play');
    currentUtterance = utterance;
  };

  // Evento: progreso (boundary)
  utterance.onboundary = function(event) {
    if (currentId !== id) return;
    if (event.name === 'word' && utterance) {
      var charIndex = event.charIndex;
      var totalLen = text.length;
      var pct = totalLen > 0 ? (charIndex / totalLen) * 100 : 0;
      lastProgress = pct;
      updateAudioUI(currentId, '▶ Reproduciendo...', pct);
    }
  };

  // Evento: fin
  utterance.onend = function() {
    updateAudioUI(id, '✅ Reproducción completada.', 100);
    updateAudioButtons(id, null);
    currentUtterance = null;
    currentId = null;
    lastProgress = 0;
  };

  // Evento: error
  utterance.onerror = function(event) {
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    updateAudioUI(id, '❌ Error al reproducir: ' + event.error, lastProgress);
    updateAudioButtons(id, null);
    currentUtterance = null;
    currentId = null;
    lastProgress = 0;
  };

  // Iniciar reproducción
  window.speechSynthesis.speak(utterance);
}

/**
 * Alterna entre pausar y reanudar la reproducción de voz.
 */
function togglePause() {
  if (!window.speechSynthesis) return;

  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    // Pausar
    window.speechSynthesis.pause();
    if (currentId) {
      updateAudioUI(currentId, '⏸ Pausado', lastProgress);
      updateAudioButtons(currentId, 'pause');
      // Cambiar texto del botón a "Reanudar"
      var pauseBtn = document.querySelector('#sec-audio .audio-btn.pause');
      if (pauseBtn) pauseBtn.textContent = '▶ Reanudar';
    }
  } else if (window.speechSynthesis.paused) {
    // Reanudar
    window.speechSynthesis.resume();
    if (currentId) {
      updateAudioUI(currentId, '▶ Reproduciendo...', lastProgress);
      updateAudioButtons(currentId, 'play');
      // Restaurar texto del botón a "Pausar"
      var pauseBtn = document.querySelector('#sec-audio .audio-btn.pause');
      if (pauseBtn) pauseBtn.textContent = '❚❚ Pausar';
    }
  } else {
    if (currentId) {
      updateAudioUI(currentId, '⚠ Sin reproducción activa.', lastProgress);
      updateAudioButtons(currentId, null);
    }
  }
}

/**
 * Detiene completamente la reproducción de voz.
 */
function cancelSpeech() {
  if (!window.speechSynthesis) return;
  
  // Limpiar timeout previo
  if (stopTimeoutId) {
    clearTimeout(stopTimeoutId);
    stopTimeoutId = null;
  }

  window.speechSynthesis.cancel();
  if (currentId) {
    updateAudioUI(currentId, '■ Detenido.', lastProgress);
    updateAudioButtons(currentId, 'stop');
    // Restaurar texto del botón de pausa
    var pauseBtn = document.querySelector('#sec-audio .audio-btn.pause');
    if (pauseBtn) pauseBtn.textContent = '❚❚ Pausar';
    // Restaurar botones después de un breve momento
    var id = currentId;
    stopTimeoutId = setTimeout(function() {
      updateAudioButtons(id, null);
      stopTimeoutId = null;
    }, 600);
  }
  currentUtterance = null;
  currentId = null;
  lastProgress = 0;
}

/**
 * Inicialización: cargar voces y detectar si el navegador soporta SpeechSynthesis.
 */
(function init() {
  if (!window.speechSynthesis) {
    console.warn('audio.js: SpeechSynthesis no está disponible en este navegador.');
  }

  if (window.speechSynthesis) {
    if (!voicesLoaded) {
      window.speechSynthesis.onvoiceschanged = function() {
        voicesLoaded = true;
      };
      setTimeout(function() {
        if (!voicesLoaded) {
          voicesLoaded = true;
        }
      }, 3000);
    }
  }
})();
