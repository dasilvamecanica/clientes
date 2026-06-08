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
        if (diagnosticBadge && !diagnosticBadge.style.opacity || diagnosticBadge.style.opacity === '0') {
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
    // A veces la URL se redirige pero el path conserva partes o el número se encuentra de otra manera
    // Por ejemplo en web.whatsapp.com/send/?phone=XXXXXXXX
    const match = window.location.href.match(/phone=([0-9]+)/);
    if (match) phone = match[1];
  }
  
  return phone;
}

// Convertir base64 a Blob
function base64ToBlob(base64, type = 'application/pdf') {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: type });
}

// Simular el Drag & Drop del archivo sobre el objetivo
function simulateFileDrop(target, file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  
  try {
    dataTransfer.effectAllowed = 'all';
    dataTransfer.dropEffect = 'copy';
  } catch (e) {
    // Ignorar si el navegador restringe escritura directa
  }

  const createDragEvent = (type) => {
    const event = new DragEvent(type, {
      bubbles: true,
      cancelable: true
    });
    // Forzar la inyección de dataTransfer ya que en Chrome suele ser de solo lectura en constructores
    Object.defineProperty(event, 'dataTransfer', {
      value: dataTransfer,
      writable: false,
      configurable: true
    });
    return event;
  };

  target.dispatchEvent(createDragEvent('dragenter'));
  target.dispatchEvent(createDragEvent('dragover'));
  target.dispatchEvent(createDragEvent('drop'));
  
  console.log('content_wa_web.js: Evento Drop despachado con éxito para:', file.name);
}

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
          showDiagnosticStatus('Chat cargado. Inyectando PDF...', 'success');
          
          setTimeout(() => {
            try {
              // Convertir base64 de vuelta a File
              const blob = base64ToBlob(fileData.pdfBase64, 'application/pdf');
              const file = new File([blob], fileData.filename, { type: 'application/pdf' });
              
              // Intentar soltar el archivo en la ventana principal de chat, el panel de app o en el body
              const targets = [
                document.querySelector('#main'),
                document.querySelector('#app'),
                document.body
              ];
              
              let dispatched = false;
              targets.forEach(t => {
                if (t) {
                  simulateFileDrop(t, file);
                  dispatched = true;
                }
              });
              
              if (dispatched) {
                showDiagnosticStatus('¡PDF cargado con éxito!', 'success');
              } else {
                showDiagnosticStatus('Error: No se encontró objetivo para inyectar archivo.', 'error');
              }
              
              // Limpiar de la memoria de la extensión para evitar duplicados si recarga
              chrome.runtime.sendMessage({ type: 'WHATSAPP_CLEAR_STORED_FILE' }, (clearRes) => {
                console.log('content_wa_web.js: Memoria temporal de la extensión limpiada.');
              });
              
              removeDiagnosticStatus(4000);
            } catch (err) {
              console.error('content_wa_web.js: Error al inyectar el archivo:', err);
              showDiagnosticStatus('Error al inyectar: ' + err.message, 'error');
              removeDiagnosticStatus(5000);
            }
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

// Ejecutar init al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
