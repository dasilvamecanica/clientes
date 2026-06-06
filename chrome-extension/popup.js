// Controlador del popup de configuración e información rápida de la extensión
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Verificar si tiene acceso a URLs file:// locales
  checkFileSchemeAccess();

  // 2. Cargar el historial rápido de repuestos cotizados
  loadPartsHistory();

  // 3. Enlazar el botón para abrir la administración de extensiones
  const openExtBtn = document.getElementById('btn-open-extensions');
  if (openExtBtn) {
    openExtBtn.addEventListener('click', () => {
      // Abre la página de configuración específica de esta extensión
      const extensionId = chrome.runtime.id;
      chrome.tabs.create({ url: `chrome://extensions/?id=${extensionId}` });
    });
  }
});

// Función para comprobar permisos de lectura sobre archivos locales
function checkFileSchemeAccess() {
  chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
    const badge = document.getElementById('file-access-badge');
    const alertBox = document.getElementById('file-access-alert');
    
    if (!badge || !alertBox) return;

    if (isAllowed) {
      // Acceso concedido
      badge.className = 'badge badge-green';
      badge.innerHTML = '<span class="dot dot-green"></span>PERMITIDO';
      alertBox.style.display = 'none';
    } else {
      // Acceso requerido
      badge.className = 'badge badge-orange';
      badge.innerHTML = '<span class="dot dot-orange"></span>REQUERIDO';
      alertBox.style.display = 'block';
    }
  });
}

// Cargar y listar los repuestos del historial rápido guardados
function loadPartsHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  chrome.storage.local.get({ history: [] }, (result) => {
    const history = result.history || [];
    
    if (history.length === 0) {
      container.innerHTML = '<div class="history-empty">No has cotizado ningún repuesto aún.</div>';
      return;
    }

    // Renderizar los elementos formateados
    container.innerHTML = history.map(item => {
      // Formatear precio en moneda argentina ARS
      const formattedPrice = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
      }).format(item.price);

      return `
        <div class="history-item">
          <img class="history-img" src="${item.image || 'icon.png'}" onerror="this.src='icon.png'">
          <div class="history-details">
            <h4 class="history-item-title" title="${item.title}">${item.title}</h4>
            <span class="history-item-price">${formattedPrice}</span>
          </div>
          <a class="history-item-link" href="${item.url}" target="_blank" title="Ver en Mercado Libre">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      `;
    }).join('');
  });
}
