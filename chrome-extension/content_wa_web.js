console.log('AutoTech WhatsApp Web Injector: Inyectado con éxito.');

// Obtener el número de teléfono desde la URL
function getPhoneFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  let phone = urlParams.get('phone');
  
  if (!phone) {
    // A veces la URL se redirige pero el path conserva partes o el número se encuentra de otra manera
    // Por ejemplo en web.whatsapp.com/send/?phone=XXXXXXXX
    // Intentemos buscar en la URL completa con una expresión regular si URLSearchParams falla
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
  
  // Solicitar el archivo almacenado a la extensión (background.js)
  chrome.runtime.sendMessage({
    type: 'WHATSAPP_GET_STORED_FILE',
    phone: phone
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('content_wa_web.js: Error comunicándose con background.js:', chrome.runtime.lastError.message);
      return;
    }
    
    if (response && response.success && response.file) {
      const fileData = response.file;
      console.log('content_wa_web.js: Encontrado archivo para cargar:', fileData.filename);
      
      // Esperar a que el chat esté cargado (buscamos el panel principal #main y el campo de entrada)
      let attempts = 0;
      const maxAttempts = 45; // 45 segundos de timeout
      
      const checkInterval = setInterval(() => {
        attempts++;
        const mainChat = document.querySelector('#main');
        const chatInput = document.querySelector('div[contenteditable="true"]');
        
        if (mainChat && chatInput) {
          clearInterval(checkInterval);
          console.log('content_wa_web.js: Chat cargado y listo. Preparando inyección de archivo...');
          
          setTimeout(() => {
            try {
              // Convertir base64 de vuelta a File
              const blob = base64ToBlob(fileData.pdfBase64, 'application/pdf');
              const file = new File([blob], fileData.filename, { type: 'application/pdf' });
              
              // Intentar soltar el archivo en la ventana principal de chat o en el body
              const dropTarget = document.querySelector('#main') || document.body;
              simulateFileDrop(dropTarget, file);
              
              // Limpiar de la memoria de la extensión para evitar duplicados si recarga
              chrome.runtime.sendMessage({ type: 'WHATSAPP_CLEAR_STORED_FILE' }, (clearRes) => {
                console.log('content_wa_web.js: Memoria temporal de la extensión limpiada.');
              });
            } catch (err) {
              console.error('content_wa_web.js: Error al inyectar el archivo:', err);
            }
          }, 1500); // Pequeña espera para asegurar estabilidad en la interfaz React
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.log('content_wa_web.js: Timeout alcanzado esperando que cargue el chat.');
        }
      }, 1000);
    } else {
      console.log('content_wa_web.js: No hay archivo almacenado para auto-cargar en este chat.');
    }
  });
}

// Ejecutar init al cargar la página
// A veces WhatsApp Web tarda en redireccionar, por lo que esperamos a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
