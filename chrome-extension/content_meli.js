// Script de contenido inyectado en Mercado Libre Argentina
console.log('AutoTech MercadoLibre Integrator activo.');

// Función para limpiar texto de precios y convertir a entero (ej: "$ 15.500" -> 15500)
function cleanPriceText(priceText) {
  if (!priceText) return 0;
  // Elimina todo lo que no sea un número (remueve $, espacios y puntos de miles)
  let clean = priceText.replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

// Crear el botón naranja premium integrado de AutoTech (soporta modo píldora flotante o ancho completo)
function createElegirButton(onClickHandler, isPill = false) {
  const btn = document.createElement('button');
  btn.className = 'autotech-injected-btn';
  btn.innerText = '+ Agregar a cotización';
  
  // Estilo premium en línea respetando la marca
  if (isPill) {
    btn.style.cssText = `
      position: absolute !important;
      top: 14px !important;
      left: 14px !important;
      z-index: 999 !important;
      background: linear-gradient(135deg, #F18416, #c96a0e) !important;
      color: white !important;
      border: none !important;
      border-radius: 24px !important;
      padding: 8px 16px !important;
      font-family: 'Outfit', 'Inter', sans-serif !important;
      font-size: 12.5px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      box-sizing: border-box !important;
      text-transform: none !important;
      outline: none !important;
      text-decoration: none !important;
    `;
  } else {
    btn.style.cssText = `
      background: linear-gradient(135deg, #F18416, #c96a0e) !important;
      color: white !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 10px 16px !important;
      font-family: 'Outfit', 'Inter', sans-serif !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 4px 10px rgba(241, 132, 22, 0.25) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      margin-top: 10px !important;
      margin-bottom: 6px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      text-transform: none !important;
      outline: none !important;
      text-decoration: none !important;
    `;
  }

  // Animaciones hover
  btn.addEventListener('mouseenter', () => {
    if (isPill) {
      btn.style.transform = 'scale(1.05) translateY(-1px)';
      btn.style.boxShadow = '0 6px 15px rgba(241, 132, 22, 0.5)';
    } else {
      btn.style.transform = 'translateY(-1px) scale(1.02)';
      btn.style.boxShadow = '0 6px 14px rgba(241, 132, 22, 0.4)';
    }
    btn.style.filter = 'brightness(1.08)';
  });

  btn.addEventListener('mouseleave', () => {
    if (isPill) {
      btn.style.transform = 'scale(1) translateY(0)';
      btn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    } else {
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.boxShadow = '0 4px 10px rgba(241, 132, 22, 0.25)';
    }
    btn.style.filter = 'brightness(1)';
  });

  // Evento de clic con micro-interacción verde de éxito
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Feedback visual verde de éxito
    const originalText = btn.innerText;
    btn.style.background = '#10b981'; // color-listo premium
    if (isPill) {
      btn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.5)';
    } else {
      btn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
    }
    btn.innerText = '✓ ¡Elegido!';
    btn.style.transform = 'scale(0.98)';
    btn.disabled = true;

    // Ejecutar extracción y envío
    onClickHandler();

    // Restaurar estado después de 1.5 segundos
    setTimeout(() => {
      btn.style.background = 'linear-gradient(135deg, #F18416, #c96a0e)';
      if (isPill) {
        btn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
      } else {
        btn.style.boxShadow = '0 4px 10px rgba(241, 132, 22, 0.25)';
      }
      btn.innerText = originalText;
      btn.style.transform = 'translateY(0) scale(1)';
      btn.disabled = false;
    }, 1500);
  });

  return btn;
}

// Inyección en páginas de Listados de Resultados
function injectInListings() {
  // Buscar todas las tarjetas de producto comunes en Mercado Libre
  const cardElements = document.querySelectorAll(
    '.ui-search-layout__item, .ui-search-result__wrapper, .ui-search-result, .results-item'
  );

  cardElements.forEach(card => {
    // Si ya le inyectamos el botón, omitir
    if (card.querySelector('.autotech-injected-btn')) return;

    // Asegurar posicionamiento relativo en la tarjeta para anclar la píldora flotante
    card.style.position = 'relative';

    const btn = createElegirButton(() => {
      // Función extractora al hacer clic en esta tarjeta
      const data = extractCardData(card);
      chrome.runtime.sendMessage({ type: 'ADD_PART', data: data }, (response) => {
        console.log('Datos enviados desde listado:', data, response);
      });
    }, true); // true indica que se renderiza como píldora flotante

    card.appendChild(btn);
  });
}

// Extraer datos de una tarjeta del listado
function extractCardData(card) {
  // 1. Obtener Título con fallbacks robustos para Mercado Libre
  let title = '';
  const selectors = [
    '.ui-search-item__title',
    'h2.ui-search-item__title',
    '.ui-search-link h2',
    '.ui-search-item__group__element',
    '.ui-search-link',
    'h2',
    'h3',
    '[itemprop="name"]',
    '.ui-search-result__content-title',
    '.main-title'
  ];
  
  for (const sel of selectors) {
    const el = card.querySelector(sel);
    if (el && el.innerText && el.innerText.trim()) {
      title = el.innerText.trim();
      break;
    }
  }
  
  if (!title) {
    // Si no se encuentra con selectores, buscar en enlaces representativos
    const anchors = card.querySelectorAll('a');
    for (const a of anchors) {
      if (a.title && a.title.trim()) {
        title = a.title.trim();
        break;
      }
      const text = a.innerText ? a.innerText.trim() : '';
      if (text && text.length > 12 && !text.includes('$') && !text.includes('\n')) {
        title = text;
        break;
      }
    }
  }

  if (!title) {
    // Fallback final sobre encabezados
    const headings = card.querySelectorAll('h2, h3, h4');
    for (const h of headings) {
      const text = h.innerText ? h.innerText.trim() : '';
      if (text && text.length > 5) {
        title = text;
        break;
      }
    }
  }

  if (!title) {
    title = 'Repuesto de Mercado Libre';
  }

  // 2. Obtener Precio
  const priceFractionEl = card.querySelector('.andes-money-amount__fraction') || 
                          card.querySelector('.price-tag-fraction');
  let price = 0;
  if (priceFractionEl) {
    price = cleanPriceText(priceFractionEl.innerText);
  } else {
    const priceTextEl = card.querySelector('.ui-search-price__part') || 
                        card.querySelector('.price-tag-amount');
    price = priceTextEl ? cleanPriceText(priceTextEl.innerText) : 0;
  }

  // 3. Obtener URL
  const linkEl = card.querySelector('a.ui-search-link') || 
                 card.querySelector('a.ui-search-item__group__element') ||
                 card.querySelector('a');
  const url = linkEl ? linkEl.href : window.location.href;

  // 4. Obtener Imagen (cuidando Lazy Loading)
  const imgEl = card.querySelector('img.ui-search-result-image__element') || 
                card.querySelector('.ui-search-result__image img') ||
                card.querySelector('img');
  let image = '';
  if (imgEl) {
    image = imgEl.getAttribute('data-src') || 
            imgEl.getAttribute('data-srcset') || 
            imgEl.src || 
            '';
  }

  return { title, price, url, image };
}

// Inyección en páginas de Detalle de Producto
function injectInProductDetails() {
  // Comprobar si estamos en un detalle de producto
  if (!window.location.href.includes('/articulo.mercadolibre.com.ar') && 
      !document.querySelector('.ui-pdp-container')) {
    return;
  }

  // Comprobar si ya inyectamos el botón
  if (document.querySelector('.autotech-injected-btn')) return;

  // Buscar la caja de acciones de compra en el lateral derecho
  const actionContainer = document.querySelector('.ui-pdp-actions') || 
                          document.querySelector('.ui-pdp-container__row--actions') ||
                          document.querySelector('.ui-box-component');

  if (!actionContainer) return;

  const btn = createElegirButton(() => {
    // Función extractora para la ficha técnica del producto
    const data = extractProductPageData();
    chrome.runtime.sendMessage({ type: 'ADD_PART', data: data }, (response) => {
      console.log('Datos enviados desde detalle de producto:', data, response);
    });
  });

  // Poner el botón naranja en la cima o fondo de las acciones secundarias
  actionContainer.appendChild(btn);
}

// Extraer datos de la página de detalle del producto
function extractProductPageData() {
  // 1. Obtener Título
  const titleEl = document.querySelector('.ui-pdp-title') || 
                  document.querySelector('h1.ui-pdp-title') ||
                  document.querySelector('h1') ||
                  document.querySelector('[property="og:title"]');
  
  let title = '';
  if (titleEl) {
    title = titleEl.getAttribute('content') || titleEl.innerText || '';
    title = title.trim();
  }
  
  if (!title) {
    title = document.title.replace(/\s*-\s*Mercado\s*Libre.*/gi, '').trim();
  }

  // 2. Obtener Precio
  const priceFractionEl = document.querySelector('.ui-pdp-price .andes-money-amount__fraction') || 
                          document.querySelector('.andes-money-amount__fraction') ||
                          document.querySelector('.price-tag-fraction');
  let price = 0;
  if (priceFractionEl) {
    price = cleanPriceText(priceFractionEl.innerText);
  }

  // 3. Obtener URL
  const url = window.location.href;

  // 4. Obtener Imagen de Galería
  const imgEl = document.querySelector('img.ui-pdp-image') || 
                document.querySelector('.ui-pdp-gallery img') ||
                document.querySelector('.ui-pdp-main-container img');
  let image = '';
  if (imgEl) {
    image = imgEl.getAttribute('data-src') || imgEl.src || '';
  }

  return { title, price, url, image };
}

// Función principal para iniciar la inyección
function initializeExtensionInjection() {
  injectInListings();
  injectInProductDetails();
}

// Ejecutar inmediatamente al cargar y monitorizar cambios dinámicos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtensionInjection);
} else {
  initializeExtensionInjection();
}

// Observar cambios dinámicos del DOM (Paginación, Scroll Infinito, SPA)
const observer = new MutationObserver(() => {
  initializeExtensionInjection();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Respaldo de seguridad cada 2 segundos por si fallan las mutaciones
setInterval(initializeExtensionInjection, 2000);
