// Service Worker de fondo para retransmitir mensajes entre pestañas
let lastStoredFile = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_PART') {
    const partData = message.data;
    console.log('Recibido repuesto de Mercado Libre:', partData);

    // Buscar todas las pestañas abiertas para retransmitir el mensaje
    chrome.tabs.query({}, (tabs) => {
      let sentCount = 0;
      tabs.forEach((tab) => {
        // Retransmitir a cualquier pestaña local file:// o localhost
        if (tab.url && (tab.url.startsWith('file://') || tab.url.includes('localhost') || tab.url.includes('127.0.0.1'))) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ADD_PART_TO_COTIZADOR',
            data: partData
          }, (response) => {
            // Silenciar el error en caso de que la pestaña no tenga el content script activo
            if (chrome.runtime.lastError) {
              // Es normal si el usuario tiene otras pestañas file:// abiertas que no son el cotizador
            }
          });
          sentCount++;
        }
      });
      console.log(`Repuesto retransmitido a ${sentCount} pestañas potenciales.`);
    });

    // Guardar en el almacenamiento de la sesión/historial rápido de la extensión
    // (Opcional, compatible si tiene permisos chrome.storage)
    try {
      chrome.storage.local.get({ history: [] }, (result) => {
        const history = result.history || [];
        history.unshift({ ...partData, timestamp: Date.now() });
        // Limitar a los últimos 10 repuestos elegidos
        if (history.length > 10) history.pop();
        chrome.storage.local.set({ history });
      });
    } catch (e) {
      console.warn("Chrome Storage no disponible o sin permisos", e);
    }

    sendResponse({ success: true, targetsFound: true });
  } else if (message.type === 'WHATSAPP_SEND_REQUEST') {
    handleWhatsAppSendRequest(message.payload, sendResponse);
    return true; // Habilita respuesta asíncrona para sendResponse
  } else if (message.type === 'WHATSAPP_GET_STORED_FILE') {
    const { phone } = message;
    console.log('background.js: Solicitud de archivo para el teléfono:', phone);
    
    if (lastStoredFile) {
      const timeDiff = Date.now() - lastStoredFile.timestamp;
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      const cleanStoredPhone = lastStoredFile.phone ? lastStoredFile.phone.replace(/\D/g, '') : '';
      
      // Coincide si el teléfono es igual o si se guardó hace menos de 2 minutos (para evitar pérdidas por redirecciones)
      const phoneMatches = cleanPhone && (cleanPhone.includes(cleanStoredPhone) || cleanStoredPhone.includes(cleanPhone));
      const isRecent = timeDiff < 120000; // 2 minutos
      
      if (phoneMatches || isRecent) {
        console.log('background.js: Archivo encontrado y listo para enviar.', lastStoredFile.filename);
        sendResponse({ success: true, file: lastStoredFile });
      } else {
        console.log('background.js: Teléfono no coincide o archivo muy antiguo.', { phoneMatches, isRecent });
        sendResponse({ success: false, error: 'No hay archivos recientes para este número.' });
      }
    } else {
      console.log('background.js: No hay ningún archivo guardado.');
      sendResponse({ success: false, error: 'No hay archivos guardados.' });
    }
    return true;
  } else if (message.type === 'WHATSAPP_CLEAR_STORED_FILE') {
    console.log('background.js: Limpiando archivo guardado.');
    lastStoredFile = null;
    sendResponse({ success: true });
    return true;
  }
  return true; // Habilita respuesta asíncrona
});

async function handleWhatsAppSendRequest(payload, sendResponse) {
  const { token, phoneId, clientPhone, filename, pdfBase64, msgType, templateName, templateLang, method } = payload;
  
  try {
    // Si el método es WhatsApp Web con Extensión, guardamos el archivo temporalmente en memoria
    if (method === 'wa_link_ext') {
      console.log('background.js: Guardando PDF temporalmente para auto-carga en WhatsApp Web...');
      lastStoredFile = {
        phone: clientPhone,
        filename: filename,
        pdfBase64: pdfBase64,
        timestamp: Date.now()
      };
      sendResponse({
        success: true
      });
      return;
    }

    // 1. Convertir Base64 a Blob
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

    // Si el método es Enlace Directo (wa_link), subimos a Pixeldrain
    if (method === 'wa_link') {
      console.log('background.js: Subiendo PDF a Pixeldrain para envío gratuito...');
      const formData = new FormData();
      formData.append('file', pdfBlob, filename);
      formData.append('anonymous', 'true');

      const uploadResponse = await fetch('https://pixeldrain.com/api/file', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.id) {
        console.error('Error al subir a Pixeldrain:', uploadResult);
        sendResponse({
          success: false,
          error: `Error al subir a Pixeldrain: ${uploadResult.message || 'Error desconocido'}`
        });
        return;
      }

      const downloadUrl = `https://pixeldrain.com/u/${uploadResult.id}`;
      console.log('background.js: PDF subido con éxito a Pixeldrain:', downloadUrl);
      sendResponse({
        success: true,
        downloadUrl: downloadUrl
      });
      return;
    }

    // 2. Subir el archivo a Meta Media Endpoint (Método API oficial)
    console.log('background.js: Iniciando envío de WhatsApp oficial a', clientPhone);
    console.log('background.js: Subiendo PDF a Meta Media...');
    const formData = new FormData();
    formData.append('file', pdfBlob, filename);
    formData.append('type', 'application/pdf');
    formData.append('messaging_product', 'whatsapp');

    const uploadResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const uploadResult = await uploadResponse.json();
    if (!uploadResponse.ok || !uploadResult.id) {
      console.error('Error al subir media:', uploadResult);
      sendResponse({
        success: false,
        error: `Error al subir el PDF a Meta: ${uploadResult.error?.message || 'Error desconocido'}`
      });
      return;
    }

    const mediaId = uploadResult.id;
    console.log('background.js: PDF subido con éxito, ID de Media:', mediaId);

    // 3. Enviar el mensaje a través de WhatsApp Cloud API
    console.log('background.js: Enviando mensaje a cliente...', clientPhone);
    let messageBody = {};
    if (msgType === 'template') {
      messageBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: clientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: templateLang || 'es'
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'document',
                  document: {
                    id: mediaId,
                    filename: filename
                  }
                }
              ]
            }
          ]
        }
      };
    } else {
      messageBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: clientPhone,
        type: 'document',
        document: {
          id: mediaId,
          filename: filename
        }
      };
    }

    const msgResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    const msgResult = await msgResponse.json();
    if (!msgResponse.ok || msgResult.error) {
      console.error('Error al enviar mensaje:', msgResult);
      sendResponse({
        success: false,
        error: `Error al enviar el WhatsApp: ${msgResult.error?.message || 'Error desconocido'}`
      });
      return;
    }

    console.log('background.js: Mensaje enviado con éxito!', msgResult);
    sendResponse({
      success: true,
      data: msgResult
    });

  } catch (error) {
    console.error('background.js: Excepción al procesar el envío de WhatsApp:', error);
    sendResponse({
      success: false,
      error: `Error en la extensión: ${error.message}`
    });
  }
}
