// Script de contenido inyectado de forma segura en el cotizador local (file:// o localhost)
console.log('AutoTech Cotizador Listener inyectado en página local.');

// Verificar si la pestaña actual es efectivamente nuestro panel operativo premium de AutoTech
function isAutoTechDashboard() {
  return (
    document.title === 'Gestión de taller' || 
    document.getElementById('main-sidebar') !== null || 
    document.querySelector('.app-container') !== null
  );
}

if (isAutoTechDashboard()) {
  console.log('¡AutoTech Cotizador detectado con éxito! Escuchando repuestos de Mercado Libre...');

  // Escuchar mensajes provenientes del Service Worker de fondo de la extensión
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_PART_TO_COTIZADOR') {
      const partData = message.data;
      console.log('Retransmitiendo repuesto recibido a la aplicación local:', partData);

      // Reenviar de forma segura a través de postMessage hacia el contexto de la página principal (app.js)
      window.postMessage({
        type: 'ADD_PART_FROM_EXTENSION',
        data: partData
      }, '*');

      // Indicar éxito de vuelta a background.js
      sendResponse({ success: true, delivered: true });
    }
    return true; // Habilita respuesta asíncrona
  });

  // Escuchar solicitudes de envío de WhatsApp desde el cotizador local (app.js)
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'WHATSAPP_SEND_REQUEST') {
      return;
    }

    const payload = event.data.payload;
    console.log('content_cotizador.js: Recibida solicitud de envío de WhatsApp para retransmitir a background.js:', payload.filename);

    // Reenviar a background.js con manejo de contexto invalidado
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        throw new Error('Extension context invalidated.');
      }
      
      chrome.runtime.sendMessage({
        type: 'WHATSAPP_SEND_REQUEST',
        payload: payload
      }, (response) => {
        const responseData = response || { success: false, error: 'Respuesta vacía de la extensión.' };
        if (chrome.runtime.lastError) {
          console.error('Error de comunicación con background.js:', chrome.runtime.lastError.message);
          window.postMessage({
            type: 'WHATSAPP_SEND_RESPONSE',
            response: { success: false, error: 'Error en la extensión: ' + chrome.runtime.lastError.message }
          }, '*');
        } else {
          console.log('content_cotizador.js: Respuesta de envío recibida de background.js y retransmitida:', responseData);
          window.postMessage({
            type: 'WHATSAPP_SEND_RESPONSE',
            response: responseData
          }, '*');
        }
      });
    } catch (err) {
      console.error('content_cotizador.js: El contexto de la extensión se invalidó.', err);
      alert('La extensión de Chrome se ha recargado o actualizado. Por favor, refresca esta página (F5) para restablecer la conexión.');
      window.postMessage({
        type: 'WHATSAPP_SEND_RESPONSE',
        response: { success: false, error: 'Extensión desactualizada. Por favor recarga la página.' }
      }, '*');
    }
  });
} else {
  console.log('Página local detectada pero no corresponde al Panel Operativo AutoTech. Listener inactivo.');
}
