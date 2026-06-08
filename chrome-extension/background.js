// Service Worker de fondo para retransmitir mensajes entre pestañas
// lastStoredFile se guarda de forma persistente en chrome.storage.local para soportar suspensiones MV3

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
    
    chrome.storage.local.get(['lastStoredFile'], (result) => {
      const fileData = result.lastStoredFile;
      if (fileData) {
        const timeDiff = Date.now() - fileData.timestamp;
        const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
        const cleanStoredPhone = fileData.phone ? fileData.phone.replace(/\D/g, '') : '';
        
        // Coincide si el teléfono es igual o si se guardó hace menos de 5 minutos (para evitar pérdidas por redirecciones)
        const phoneMatches = cleanPhone && (cleanPhone.includes(cleanStoredPhone) || cleanStoredPhone.includes(cleanPhone));
        const isRecent = timeDiff < 300000; // 5 minutos
        
        if (phoneMatches || isRecent) {
          console.log('background.js: Archivo encontrado y listo para enviar.', fileData.filename);
          sendResponse({ success: true, file: fileData });
        } else {
          console.log('background.js: Teléfono no coincide o archivo muy antiguo.', { phoneMatches, isRecent });
          sendResponse({ success: false, error: 'No hay archivos recientes para este número.' });
        }
      } else {
        console.log('background.js: No hay ningún archivo guardado.');
        sendResponse({ success: false, error: 'No hay archivos guardados.' });
      }
    });
    return true;
  } else if (message.type === 'WHATSAPP_CLEAR_STORED_FILE') {
    console.log('background.js: Limpiando archivo guardado.');
    chrome.storage.local.remove(['lastStoredFile'], () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (message.type === 'WHATSAPP_INJECT_FILE') {
    chrome.storage.local.get(['lastStoredFile'], (result) => {
      const fileData = result.lastStoredFile;
      if (fileData) {
        console.log('background.js: Inyectando archivo en el MAIN world de la pestaña:', sender.tab.id);
        
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          world: 'MAIN',
          args: [fileData.filename, fileData.pdfBase64, fileData.messageText],
          func: (filename, base64Data, messageText) => {
            console.log('AutoTech Main World: Iniciando inyección de', filename);
            
            function base64ToBlob(base64, type = 'application/pdf') {
              const byteCharacters = atob(base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              return new Blob([byteArray], { type: type });
            }

            function emulateDragAndDrop(file) {
              return new Promise((resolve, reject) => {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                try {
                  Object.defineProperty(dataTransfer, 'files', {
                    value: dataTransfer.files,
                    writable: false,
                    configurable: true
                  });
                } catch (e) {}

                const createDragEvent = (type) => {
                  const event = new DragEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dataTransfer
                  });
                  try {
                    Object.defineProperty(event, 'dataTransfer', {
                      value: dataTransfer,
                      writable: false,
                      configurable: true
                    });
                  } catch (e) {}
                  return event;
                };

                console.log('AutoTech Main World: Iniciando emulación de Drag & Drop...');
                const target = document.querySelector('#main') || document.querySelector('#app') || document.body;
                
                if (!target) {
                  reject(new Error('No se encontró objetivo de drop (#main, #app o body).'));
                  return;
                }

                target.dispatchEvent(createDragEvent('dragenter'));
                target.dispatchEvent(createDragEvent('dragover'));
                
                // Esperar a que React active/muestre la zona de drop
                setTimeout(() => {
                  const overlay = document.querySelector('[data-testid="drop-zone"]') || 
                                  document.querySelector('.drop-zone') || 
                                  document.querySelector('[class*="drop"]') ||
                                  target;
                                  
                  console.log('AutoTech Main World: Despachando evento drop en:', overlay.tagName);
                  overlay.dispatchEvent(createDragEvent('drop'));
                  
                  try {
                    overlay.dispatchEvent(createDragEvent('dragleave'));
                  } catch (e) {}
                  
                  resolve(true);
                }, 180); // 180ms para asegurar renderizado
              });
            }

            function uploadFileViaInput(file) {
              return new Promise((resolve, reject) => {
                const findDocInput = () => {
                  let inputs = Array.from(document.querySelectorAll('input[type="file"]'));
                  return inputs.find(input => {
                    const accept = (input.getAttribute('accept') || '').toLowerCase();
                    // Si el accept incluye image, video o audio, NO es el input de documentos
                    if (accept.includes('image') || accept.includes('video') || accept.includes('audio')) {
                      return false;
                    }
                    return true; // Cualquier otro input (documento) es válido!
                  });
                };

                // Verificar si el menú ya está abierto
                const isMenuOpen = document.querySelector('span[data-icon="attach-document"]') || 
                                   document.querySelector('[data-testid="mi-document"]') ||
                                   document.querySelector('ul li div[role="button"]');

                let docInput = findDocInput();

                if (docInput) {
                  try {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    docInput.files = dataTransfer.files;
                    docInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('AutoTech Main World: Archivo inyectado vía input directo.');
                    resolve(true);
                    return;
                  } catch (e) {
                    console.error('AutoTech Main World: Falló inyección en input directo:', e);
                  }
                }

                if (isMenuOpen) {
                  // Si el menú ya está abierto pero por alguna razón no se encontró el input, fallamos para ir a Drag & Drop
                  reject(new Error('El menú ya estaba abierto pero no se encontró el input de documentos.'));
                  return;
                }

                // 2. Si no se encontró y el menú está cerrado, hacer clic en el botón de adjuntar (clip o plus)
                console.log('AutoTech Main World: Buscando botón de adjuntar...');
                const attachSelectors = [
                  'button[title="Adjuntar"]',
                  'button[aria-label="Adjuntar"]',
                  '[data-testid="plus"]',
                  '[data-testid="clip"]',
                  '[data-icon="plus"]',
                  '[data-icon="clip"]',
                  'span[data-icon="plus-large"]'
                ];
                
                let attachBtn = null;
                for (const sel of attachSelectors) {
                  attachBtn = document.querySelector(sel);
                  if (attachBtn) break;
                }

                if (attachBtn) {
                  attachBtn.click();
                  console.log('AutoTech Main World: Botón de adjuntar clickeado. Esperando input...');
                  
                  setTimeout(() => {
                    docInput = findDocInput();

                    if (docInput) {
                      try {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        docInput.files = dataTransfer.files;
                        docInput.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('AutoTech Main World: Archivo inyectado tras abrir menú.');
                        resolve(true);
                        return;
                      } catch (e) {
                        console.error('AutoTech Main World: Falló inyección tras abrir menú:', e);
                      }
                    }
                    reject(new Error('No se encontró input de documentos tras abrir menú.'));
                  }, 600); // 600ms es seguro para dar tiempo de render
                } else {
                  reject(new Error('No se encontró botón de adjuntar.'));
                }
              });
            }

            function writeCaption(text) {
              if (!text) {
                console.log('AutoTech Main World: No hay texto de pie de página para escribir.');
                window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: true, message: 'Archivo cargado sin pie' }, '*');
                return;
              }
              console.log('AutoTech Main World: Intentando escribir pie del archivo:', text);
              let attempts = 0;
              const maxAttempts = 25; // 5 segundos
              const interval = setInterval(() => {
                attempts++;
                
                // Buscar todos los div contenteditable
                const editables = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
                
                // Intentar identificar el input del caption
                let captionInput = editables.find(el => {
                  const testId = el.getAttribute('data-testid');
                  const ariaPlaceholder = el.getAttribute('aria-placeholder') || '';
                  const dataPlaceholder = el.getAttribute('data-placeholder') || '';
                  const label = el.getAttribute('aria-label') || '';
                  
                  return testId === 'media-editor-caption-input' || 
                         testId === 'caption-input-text-area' ||
                         ariaPlaceholder.toLowerCase().includes('comentario') || 
                         ariaPlaceholder.toLowerCase().includes('caption') || 
                         ariaPlaceholder.toLowerCase().includes('añade') ||
                         dataPlaceholder.toLowerCase().includes('comentario') || 
                         dataPlaceholder.toLowerCase().includes('caption') ||
                         label.toLowerCase().includes('comentario') || 
                         label.toLowerCase().includes('caption');
                });
                
                if (!captionInput && editables.length > 0) {
                  // Si no se encuentra específicamente, tomamos el que no coincida con el composer principal
                  captionInput = editables.find(el => {
                    const testId = el.getAttribute('data-testid') || '';
                    const id = el.id || '';
                    const className = el.className || '';
                    return !testId.includes('compose') && 
                           !testId.includes('conversation') && 
                           !className.includes('compose') && 
                           !id.includes('compose');
                  });
                }
                
                if (captionInput) {
                  clearInterval(interval);
                  console.log('AutoTech Main World: Campo de pie de archivo encontrado. Escribiendo...');
                  try {
                    captionInput.focus();
                    
                    // Crear un rango de selección y colocar el cursor dentro del elemento
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(captionInput);
                    range.collapse(false); // Colapsar al final
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    // Limpiar contenido existente
                    captionInput.textContent = '';
                    
                    // Usar execCommand para simular la escritura de manera compatible con React
                    document.execCommand('insertText', false, text);
                    
                    // Lanzar eventos para asegurar que React se entere de los cambios
                    captionInput.dispatchEvent(new Event('input', { bubbles: true }));
                    captionInput.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    console.log('AutoTech Main World: Pie de archivo escrito con éxito.');
                    window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: true, message: 'Archivo y pie cargados' }, '*');
                  } catch (e) {
                    console.error('AutoTech Main World: Error al escribir pie de archivo:', e);
                    window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: true, message: 'Archivo cargado, falló pie' }, '*');
                  }
                } else if (attempts >= maxAttempts) {
                  clearInterval(interval);
                  console.warn('AutoTech Main World: No se encontró el campo de pie de archivo tras varios intentos.');
                  window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: true, message: 'Archivo cargado sin pie' }, '*');
                }
              }, 200);
            }

            try {
              const blob = base64ToBlob(base64Data, 'application/pdf');
              const file = new File([blob], filename, { type: 'application/pdf' });
              
              emulateDragAndDrop(file)
                .then(() => {
                  console.log('AutoTech Main World: Drag & Drop emulado. Esperando previsualización...');
                  
                  // Esperar para verificar si se abrió la ventana de previsualización (caption)
                  setTimeout(() => {
                    const editables = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
                    const hasPreview = editables.some(el => {
                      const testId = el.getAttribute('data-testid') || '';
                      const ariaPlaceholder = el.getAttribute('aria-placeholder') || '';
                      return testId.includes('caption') || ariaPlaceholder.toLowerCase().includes('comentario');
                    });
                    
                    if (hasPreview) {
                      console.log('AutoTech Main World: Previsualización detectada tras Drag & Drop.');
                      writeCaption(messageText);
                    } else {
                      console.warn('AutoTech Main World: Drag & Drop no activó la previsualización. Usando fallback de input...');
                      
                      uploadFileViaInput(file)
                        .then(() => {
                          console.log('AutoTech Main World: Inyección por input exitosa.');
                          writeCaption(messageText);
                        })
                        .catch(err => {
                          console.error('AutoTech Main World: Todos los métodos fallaron:', err.message);
                          window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: false, message: 'Fallo al cargar archivo' }, '*');
                        });
                    }
                  }, 1500);
                })
                .catch(err => {
                  console.error('AutoTech Main World: Error en Drag & Drop:', err);
                  uploadFileViaInput(file)
                    .then(() => {
                      writeCaption(messageText);
                    })
                    .catch(inputErr => {
                      window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: false, message: inputErr.message }, '*');
                    });
                });
            } catch (err) {
              console.error('AutoTech Main World: Excepción general:', err);
              window.postMessage({ type: 'AUTOTECH_INJECTION_STATUS', success: false, message: err.message }, '*');
            }
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error('background.js: Error en executeScript:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      } else {
        sendResponse({ success: false, error: 'No hay archivo almacenado.' });
      }
    });
    return true;
  }
  return true; // Habilita respuesta asíncrona
});

async function handleWhatsAppSendRequest(payload, sendResponse) {
  const { token, phoneId, clientPhone, filename, pdfBase64, msgType, templateName, templateLang, method } = payload;
  
  try {
    // Si el método es WhatsApp Web con Extensión, guardamos el archivo temporalmente en memoria
    if (method === 'wa_link_ext') {
      console.log('background.js: Guardando PDF temporalmente en chrome.storage.local para auto-carga...');
      const fileData = {
        phone: clientPhone,
        filename: filename,
        pdfBase64: pdfBase64,
        messageText: payload.messageText || '',
        timestamp: Date.now()
      };
      chrome.storage.local.set({ lastStoredFile: fileData }, () => {
        sendResponse({
          success: true
        });
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
