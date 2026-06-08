console.log('AutoTech WhatsApp Web Injector: Inyectado con éxito.');

// Crear banner de diagnóstico flotante
let diagnosticBadge = null;
function showDiagnosticStatus(text, statusType = 'info') {
  if (!diagnosticBadge) {
    diagnosticBadge = document.createElement('div');
    diagnosticBadge.style.cssText = `
      position: fixed;
      top: 15px;
      right: 15px;
      z-index: 99999;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(diagnosticBadge);
  }
  
  diagnosticBadge.style.opacity = '1';
  diagnosticBadge.textContent = `AutoTech: ${text}`;
  
  if (statusType === 'info') {
    diagnosticBadge.style.backgroundColor = '#F18416'; // Naranja
  } else if (statusType === 'success') {
    diagnosticBadge.style.backgroundColor = '#10b981'; // Verde
  } else if (statusType === 'error') {
    diagnosticBadge.style.backgroundColor = '#ef4444'; // Rojo
  } else {
    diagnosticBadge.style.backgroundColor = '#71717a'; // Gris
  }
}

function removeDiagnosticStatus(delay = 3000) {
  setTimeout(() => {
    if (diagnosticBadge) {
      diagnosticBadge.style.opacity = '0';
      setTimeout(() => {
        if (diagnosticBadge && (!diagnosticBadge.style.opacity || diagnosticBadge.style.opacity === '0')) {
          if (diagnosticBadge.parentNode) {
            diagnosticBadge.parentNode.removeChild(diagnosticBadge);
          }
          diagnosticBadge = null;
        }
      }, 300);
    }
  }, delay);
}

// Obtener el número de teléfono desde la URL
function getPhoneFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  let phone = urlParams.get('phone');
  
  if (!phone) {
    const match = window.location.href.match(/phone=([0-9]+)/);
    if (match) phone = match[1];
  }
  
  return phone;
}

// Escuchar el estado de la inyección desde el main world
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.type !== 'AUTOTECH_INJECTION_STATUS') {
    return;
  }
  
  const status = event.data;
  console.log('content_wa_web.js: Estado de inyección recibido desde Main World:', status);
  
  if (status.success) {
    showDiagnosticStatus('¡PDF cargado con éxito! (' + status.message + ')', 'success');
    removeDiagnosticStatus(4000);
  } else {
    showDiagnosticStatus('Fallo: ' + status.message, 'error');
    removeDiagnosticStatus(6000);
  }
});

// Función principal
function init() {
  const phone = getPhoneFromUrl();
  console.log('content_wa_web.js: Teléfono detectado en URL:', phone);
  
  showDiagnosticStatus('Buscando archivo pendiente...', 'info');
  
  // Solicitar el archivo almacenado a la extensión (background.js)
  chrome.runtime.sendMessage({
    type: 'WHATSAPP_GET_STORED_FILE',
    phone: phone
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('content_wa_web.js: Error comunicándose con background.js:', chrome.runtime.lastError.message);
      showDiagnosticStatus('Error de extensión: ' + chrome.runtime.lastError.message, 'error');
      removeDiagnosticStatus(5000);
      return;
    }
    
    if (response && response.success && response.file) {
      const fileData = response.file;
      console.log('content_wa_web.js: Encontrado archivo para cargar:', fileData.filename);
      showDiagnosticStatus(`Archivo detectado: ${fileData.filename}. Esperando chat...`, 'info');
      
      // Esperar a que el chat esté cargado (buscamos el panel principal #main y el campo de entrada)
      let attempts = 0;
      const maxAttempts = 45; // 45 segundos de timeout
      
      const checkInterval = setInterval(() => {
        attempts++;
        const mainChat = document.querySelector('#main');
        const chatInput = document.querySelector('div[contenteditable="true"]');
        
        if (mainChat && chatInput) {
          clearInterval(checkInterval);
          showDiagnosticStatus('Chat cargado. Inyectando PDF nativamente...', 'success');
          
          setTimeout(() => {
            // Solicitar al background script que inyecte el archivo en el MAIN world
            chrome.runtime.sendMessage({ type: 'WHATSAPP_INJECT_FILE' }, (injectRes) => {
              if (chrome.runtime.lastError) {
                showDiagnosticStatus('Error de inyección: ' + chrome.runtime.lastError.message, 'error');
                removeDiagnosticStatus(5000);
              } else if (injectRes && !injectRes.success) {
                showDiagnosticStatus('Error: ' + injectRes.error, 'error');
                removeDiagnosticStatus(5000);
              }
              
              // Limpiar de la memoria de la extensión para evitar duplicados si recarga
              chrome.runtime.sendMessage({ type: 'WHATSAPP_CLEAR_STORED_FILE' });
            });
          }, 1500); // Pequeña espera para asegurar estabilidad en la interfaz React
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          showDiagnosticStatus('Timeout: El chat tardó demasiado en cargar.', 'error');
          removeDiagnosticStatus(5000);
        }
      }, 1000);
    } else {
      console.log('content_wa_web.js: No hay archivo almacenado para auto-cargar en este chat.');
      showDiagnosticStatus('No hay archivos pendientes para este chat.', 'gray');
      removeDiagnosticStatus(2000);
    }
  });
}

// Registrar init al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
