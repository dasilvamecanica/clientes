/* 
========================================================================
   LÃ“GICA PRINCIPAL DEL PANEL OPERATIVO DE TALLER MECÃNICO (app.js)
   CaracterÃ­sticas: Drag & Drop, Persistencia, Temporizadores en Vivo,
   Ficha TÃ©cnica de RecepciÃ³n (Foto 2), Modal RecepciÃ³n (Foto 1).
========================================================================
*/

// --- 1. CONFIGURACIÃ“N E INICIALIZACIÃ“N DEL ESTADO ---

let vehicles = [];
let clients = [];
let servicesCatalog = [];
let partsCatalog = [];
let teamMembers = [];
let reminders = [];
let ccFilterPill = 'Todos';
let currentView = 'tablero'; // 'tablero' | 'calendario' | 'recepcion-detalle'
let currentCalendarDate = new Date(2026, 4, 24); // Mayo 2026
let activeContextVehicleId = null;
let activeReceptionVehicleId = null; // VehÃ­culo siendo editado en Ficha Foto 2
let activeReceptionServices = []; // Lista temporal de servicios para Ficha Foto 2
let isRecordingVoice = false;

// Registro global de Marcas, Modelos y Motores utilizados en el taller
let vehicleRegistry = {
  brands: [],
  models: [],
  engines: []
};

// ConfiguraciÃ³n global del Perfil de Taller
let workshopConfig = {
  name: 'sdfds',
  phone1: '+5602235041116',
  phone2: '+5602235041116',
  address: 'DirecciÃ³n de Ejemplo 123',
  rut: '12345678-9',
  cuit: '30-12345678-9',
  ivaCondition: 'Responsable Inscripto',
  iibb: '901-123456-7',
  inicioAct: '2018-03-01',
  pv: '0005',
  waMethod: 'meta_api',
  waPhoneId: '1179474771896317'
};

window.toggleWaConfigFields = function(method) {
  const container = document.getElementById('meta-wa-config-fields');
  if (container) {
    container.style.display = (method === 'meta_api') ? 'flex' : 'none';
  }
};

window.toggleWaTemplateFields = function(type) {
  const container = document.getElementById('meta-wa-template-fields');
  if (container) {
    container.style.display = (type === 'template') ? 'grid' : 'none';
  }
};

function loadWorkshopConfig() {
  const saved = localStorage.getItem('taller_workshop_config');
  if (saved) {
    workshopConfig = JSON.parse(saved);
  }
  
  const nameInput = document.getElementById('config-workshop-name');
  if (nameInput) {
    nameInput.value = workshopConfig.name || '';
    document.getElementById('config-workshop-phone1').value = workshopConfig.phone1 || '';
    document.getElementById('config-workshop-phone2').value = workshopConfig.phone2 || '';
    document.getElementById('config-workshop-address').value = workshopConfig.address || '';
    document.getElementById('config-workshop-rut').value = workshopConfig.rut || '';
    
    // Campos fiscales argentinos
    const cuitEl = document.getElementById('config-workshop-cuit');
    if (cuitEl) cuitEl.value = workshopConfig.cuit || '30-12345678-9';
    
    const ivaEl = document.getElementById('config-workshop-iva');
    if (ivaEl) ivaEl.value = workshopConfig.ivaCondition || 'Responsable Inscripto';
    
    const iibbEl = document.getElementById('config-workshop-iibb');
    if (iibbEl) iibbEl.value = workshopConfig.iibb || '901-123456-7';
    
    const inicioEl = document.getElementById('config-workshop-inicio-act');
    if (inicioEl) inicioEl.value = workshopConfig.inicioAct || '2018-03-01';
    
    const pvEl = document.getElementById('config-workshop-pv');
    if (pvEl) pvEl.value = workshopConfig.pv || '0005';

    // Cargar token de Mercado Libre en la configuración de taller
    const meliTokenEl = document.getElementById('config-workshop-meli-token');
    if (meliTokenEl) {
      meliTokenEl.value = localStorage.getItem('meli_access_token') || '';
    }

    // Cargar configuraciones de WhatsApp
    const waMethodEl = document.getElementById('config-workshop-wa-method');
    if (waMethodEl) {
      const savedMethod = workshopConfig.waMethod || 'meta_api';
      const savedPhoneId = workshopConfig.waPhoneId || '1179474771896317';
      
      waMethodEl.value = savedMethod;
      document.getElementById('config-workshop-wa-token').value = workshopConfig.waToken || '';
      document.getElementById('config-workshop-wa-phone-id').value = savedPhoneId;
      document.getElementById('config-workshop-wa-msg-type').value = workshopConfig.waMsgType || 'direct';
      document.getElementById('config-workshop-wa-template-name').value = workshopConfig.waTemplateName || '';
      document.getElementById('config-workshop-wa-template-lang').value = workshopConfig.waTemplateLang || 'es';
      
      toggleWaConfigFields(savedMethod);
      toggleWaTemplateFields(workshopConfig.waMsgType || 'direct');
    }
  }

  const demoSwitch = document.getElementById('demo-mode-switch');
  if (demoSwitch) {
    demoSwitch.checked = localStorage.getItem('taller_demo_mode_enabled') === 'true';
  }

  const logoSwitch = document.getElementById('logo-visibility-switch');
  if (logoSwitch) {
    logoSwitch.checked = localStorage.getItem('taller_logos_enabled') !== 'false'; // Default to true!
  }

  const meliSwitch = document.getElementById('meli-search-switch');
  if (meliSwitch) {
    meliSwitch.checked = localStorage.getItem('taller_meli_search_enabled') !== 'false'; // Default to true!
  }

  const blockingSwitch = document.getElementById('tab-blocking-switch');
  if (blockingSwitch) {
    blockingSwitch.checked = localStorage.getItem('taller_tab_blocking_enabled') !== 'false'; // Default to true!
  }
}

window.toggleTabBlocking = function(enabled) {
  localStorage.setItem('taller_tab_blocking_enabled', enabled ? 'true' : 'false');
  if (window.activeTabName) {
    setActiveTab(window.activeTabName);
  }
};

window.saveWorkshopConfig = function() {
  const nameVal = document.getElementById('config-workshop-name').value.trim();
  const phone1Val = document.getElementById('config-workshop-phone1').value.trim();
  const phone2Val = document.getElementById('config-workshop-phone2').value.trim();
  const addressVal = document.getElementById('config-workshop-address').value.trim();
  const rutVal = document.getElementById('config-workshop-rut').value.trim();
  
  // Campos argentinos
  const cuitVal = document.getElementById('config-workshop-cuit') ? document.getElementById('config-workshop-cuit').value.trim() : '';
  const ivaVal = document.getElementById('config-workshop-iva') ? document.getElementById('config-workshop-iva').value : '';
  const iibbVal = document.getElementById('config-workshop-iibb') ? document.getElementById('config-workshop-iibb').value.trim() : '';
  const inicioVal = document.getElementById('config-workshop-inicio-act') ? document.getElementById('config-workshop-inicio-act').value : '';
  const pvVal = document.getElementById('config-workshop-pv') ? document.getElementById('config-workshop-pv').value.trim() : '';
  
  // Guardar token de Mercado Libre
  const meliTokenVal = document.getElementById('config-workshop-meli-token') ? document.getElementById('config-workshop-meli-token').value.trim() : '';
  if (meliTokenVal) {
    localStorage.setItem('meli_access_token', meliTokenVal);
  } else {
    localStorage.removeItem('meli_access_token');
  }

  const waMethodVal = document.getElementById('config-workshop-wa-method') ? document.getElementById('config-workshop-wa-method').value : 'wa_link';
  const waTokenVal = document.getElementById('config-workshop-wa-token') ? document.getElementById('config-workshop-wa-token').value.trim() : '';
  const waPhoneIdVal = document.getElementById('config-workshop-wa-phone-id') ? document.getElementById('config-workshop-wa-phone-id').value.trim() : '';
  const waMsgTypeVal = document.getElementById('config-workshop-wa-msg-type') ? document.getElementById('config-workshop-wa-msg-type').value : 'direct';
  const waTemplateNameVal = document.getElementById('config-workshop-wa-template-name') ? document.getElementById('config-workshop-wa-template-name').value.trim() : '';
  const waTemplateLangVal = document.getElementById('config-workshop-wa-template-lang') ? document.getElementById('config-workshop-wa-template-lang').value.trim() : 'es';

  workshopConfig = {
    name: nameVal || 'sdfds',
    phone1: phone1Val || '+5602235041116',
    phone2: phone2Val || '+5602235041116',
    address: addressVal || 'DirecciÃ³n de Ejemplo 123',
    rut: rutVal || '12345678-9',
    cuit: cuitVal || '30-12345678-9',
    ivaCondition: ivaVal || 'Responsable Inscripto',
    iibb: iibbVal || '901-123456-7',
    inicioAct: inicioVal || '2018-03-01',
    pv: pvVal || '0005',
    waMethod: waMethodVal,
    waToken: waTokenVal,
    waPhoneId: waPhoneIdVal,
    waMsgType: waMsgTypeVal,
    waTemplateName: waTemplateNameVal,
    waTemplateLang: waTemplateLangVal
  };
  
  localStorage.setItem('taller_workshop_config', JSON.stringify(workshopConfig));
  
  // Re-inicializar iconos Lucide si es necesario
  if (typeof initLucide === 'function') initLucide();
  alert('✨ Configuración del taller guardada con éxito.');
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // --- RESCATE DE BASE DE DATOS ROTA ---
  // Si alguna clave crítica es un array vacío (dejado por versiones previas de clearDatabase),
  // la eliminamos para que loadState pueda reinicializar con los datos por defecto.
  const keysToCheck = ['taller_vehicles', 'taller_clients', 'taller_services', 'taller_parts', 'taller_team'];
  keysToCheck.forEach(key => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const parsed = JSON.parse(val);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.removeItem(key);
        }
      }
    } catch(e) {
      localStorage.removeItem(key);
    }
  });

  try {
    loadState();
    loadWorkshopConfig();
    initEventListeners();
    startGlobalTimer();
    renderApp();
    initDarkMode();
  } catch(err) {
    console.error('Error crítico en la inicialización:', err);
    // Si algo falla, limpiar el estado y recargar una sola vez
    if (!sessionStorage.getItem('taller_recovery_attempted')) {
      sessionStorage.setItem('taller_recovery_attempted', '1');
      keysToCheck.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('taller_vehicle_registry');
      location.reload();
    } else {
      sessionStorage.removeItem('taller_recovery_attempted');
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#e2e8f0;gap:20px;">
          <h2 style="font-size:22px;font-weight:800;">⚠️ Error de inicialización</h2>
          <p style="color:#94a3b8;font-size:14px;text-align:center;max-width:400px;">Se encontró un error al cargar la aplicación. Por favor, limpia el almacenamiento del navegador y recarga la página.</p>
          <button onclick="localStorage.clear();location.reload();" style="background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">Limpiar y Recargar</button>
        </div>`;
    }
    return;
  }
  
  const formDateEl = document.getElementById('form-date');
  if (formDateEl) {
    formDateEl.value = today.toISOString().split('T')[0];
  }

  // Atajo Global "T" para abrir la paleta de búsqueda global
  document.addEventListener('keydown', function(e) {
    // Si el usuario está escribiendo en algún input, select o textarea, no activar el atajo
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }

    if (e.key.toLowerCase() === 't') {
      e.preventDefault();
      if (typeof openGlobalSearch === 'function') openGlobalSearch();
    }
  });

  initInterfaceColor();
  initLogos();
});

// --- INITIALIZE INTERFACE COLOR ---
function initInterfaceColor() {
  const savedColor = localStorage.getItem('taller_accent_color') || '#F18416';
  updateInterfaceColor(savedColor);
  
  const presets = ['#F18416', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'];
  const isPreset = presets.some(p => p.toLowerCase() === savedColor.toLowerCase());
  
  // Resaltar el botón activo en la vista de configuración
  const buttons = document.querySelectorAll('.color-dot-btn');
  buttons.forEach(btn => {
    if (btn.id === 'custom-theme-color-btn') {
      btn.style.background = 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)';
      if (!isPreset) {
        btn.style.border = '2px solid white';
        btn.style.outline = `2px solid ${savedColor}`;
      } else {
        btn.style.border = '2px solid transparent';
        btn.style.outline = 'none';
      }
    } else {
      const onclickStr = btn.getAttribute('onclick');
      if (onclickStr && onclickStr.toLowerCase().includes(savedColor.toLowerCase())) {
        btn.style.border = '2px solid white';
        btn.style.outline = `2px solid ${savedColor}`;
      } else {
        btn.style.border = '2px solid transparent';
        btn.style.outline = 'none';
      }
    }
  });

  const customInput = document.getElementById('custom-color-picker');
  if (customInput) {
    customInput.value = savedColor;
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

window.updateInterfaceColor = function(hexColor) {
  localStorage.setItem('taller_accent_color', hexColor);
  
  const rgb = hexToRgb(hexColor);
  const rgbStr = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '241, 132, 22';
  
  const hsl = hexToHsl(hexColor);
  const hslStr = hsl ? `${hsl.h}, ${hsl.s}%, ${hsl.l}%` : '24, 90%, 50%';
  
  document.documentElement.style.setProperty('--color-accent', hexColor);
  document.documentElement.style.setProperty('--color-accent-rgb', rgbStr);
  document.documentElement.style.setProperty('--color-accent-hsl', hslStr);
};

window.changeInterfaceColor = function(colorHex, buttonEl) {
  const buttons = document.querySelectorAll('.color-dot-btn');
  buttons.forEach(btn => {
    btn.style.border = '2px solid transparent';
    btn.style.outline = 'none';
    
    // Si es el botón custom, nos aseguramos de que mantenga siempre el degradado cónico de paleta de colores.
    if (btn.id === 'custom-theme-color-btn') {
      btn.style.background = 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)';
    }
  });
  
  if (buttonEl) {
    buttonEl.style.border = '2px solid white';
    buttonEl.style.outline = `2px solid ${colorHex}`;
  }
  
  updateInterfaceColor(colorHex);
};

window.handleCustomColorPicker = function(hexValue) {
  const customBtn = document.getElementById('custom-theme-color-btn');
  if (customBtn) {
    customBtn.style.background = 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)';
    changeInterfaceColor(hexValue, customBtn);
  }
  const customInput = document.getElementById('custom-color-picker');
  if (customInput) {
    customInput.value = hexValue;
  }
};

// --- LOGO MANAGEMENT ---
window.initLogos = function() {
  const logoWide = localStorage.getItem('taller_logo_wide');
  const logoSquare = localStorage.getItem('taller_logo_square');

  const sidebar = document.getElementById('main-sidebar');
  const isCollapsed = sidebar ? sidebar.classList.contains('collapsed') : false;

  // Wide Logo UI Update (only visible when NOT collapsed)
  const wideImg = document.getElementById('logo-wide-img');
  const widePlaceholder = document.getElementById('logo-wide-placeholder');
  
  // Square Logo UI Update (only visible when collapsed)
  const squareImg = document.getElementById('logo-square-img');
  const squarePlaceholder = document.getElementById('logo-square-placeholder');

  // Setup Panel Previews (always show respective versions)
  const setupWideImg = document.getElementById('setup-logo-wide-img');
  const setupWidePlaceholder = document.getElementById('setup-logo-wide-placeholder');
  const deleteWideBtn = document.getElementById('btn-delete-logo-wide');

  const setupSquareImg = document.getElementById('setup-logo-square-img');
  const setupSquarePlaceholder = document.getElementById('setup-logo-square-placeholder');
  const deleteSquareBtn = document.getElementById('btn-delete-logo-square');

  // 1. Update Sidebar Logos according to collapse state
  if (!isCollapsed) {
    // Hide all collapsed (square) logo elements
    if (squareImg) squareImg.style.setProperty('display', 'none', 'important');
    if (squarePlaceholder) squarePlaceholder.style.setProperty('display', 'none', 'important');

    // Show appropriate wide element
    if (logoWide) {
      if (wideImg) { wideImg.src = logoWide; wideImg.style.setProperty('display', 'block', 'important'); }
      if (widePlaceholder) widePlaceholder.style.setProperty('display', 'none', 'important');
    } else {
      if (wideImg) { wideImg.src = ''; wideImg.style.setProperty('display', 'none', 'important'); }
      if (widePlaceholder) widePlaceholder.style.setProperty('display', 'flex', 'important');
    }
  } else {
    // Hide all wide logo elements
    if (wideImg) wideImg.style.setProperty('display', 'none', 'important');
    if (widePlaceholder) widePlaceholder.style.setProperty('display', 'none', 'important');

    // Show appropriate square element
    if (logoSquare) {
      if (squareImg) { squareImg.src = logoSquare; squareImg.style.setProperty('display', 'block', 'important'); }
      if (squarePlaceholder) squarePlaceholder.style.setProperty('display', 'none', 'important');
    } else {
      if (squareImg) { squareImg.src = ''; squareImg.style.setProperty('display', 'none', 'important'); }
      if (squarePlaceholder) squarePlaceholder.style.setProperty('display', 'flex', 'important');
    }
  }

  // 2. Setup Panel Previews UI
  if (logoWide) {
    if (setupWideImg) { setupWideImg.src = logoWide; setupWideImg.style.display = 'block'; }
    if (setupWidePlaceholder) setupWidePlaceholder.style.display = 'none';
    if (deleteWideBtn) deleteWideBtn.style.display = 'flex';
  } else {
    if (setupWideImg) { setupWideImg.src = ''; setupWideImg.style.display = 'none'; }
    if (setupWidePlaceholder) setupWidePlaceholder.style.display = 'flex';
    if (deleteWideBtn) deleteWideBtn.style.display = 'none';
  }

  if (logoSquare) {
    if (setupSquareImg) { setupSquareImg.src = logoSquare; setupSquareImg.style.display = 'block'; }
    if (setupSquarePlaceholder) setupSquarePlaceholder.style.display = 'none';
    if (deleteSquareBtn) deleteSquareBtn.style.display = 'flex';
  } else {
    if (setupSquareImg) { setupSquareImg.src = ''; setupSquareImg.style.display = 'none'; }
    if (setupSquarePlaceholder) setupSquarePlaceholder.style.display = 'flex';
    if (deleteSquareBtn) deleteSquareBtn.style.display = 'none';
  }

  // 3. Find and update Favicon
  let favicon = document.querySelector("link[rel~='icon']");
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    document.getElementsByTagName('head')[0].appendChild(favicon);
  }
  favicon.href = logoSquare ? logoSquare : 'logo2.png';

  // Re-initialize Lucide icons
  if (typeof initLucide === 'function') initLucide();
};

window.handleLogoUpload = function(inputEl, type) {
  if (inputEl.files && inputEl.files[0]) {
    const file = inputEl.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      if (type === 'wide') {
        localStorage.setItem('taller_logo_wide', base64);
      } else if (type === 'square') {
        localStorage.setItem('taller_logo_square', base64);
      }
      initLogos();
    };
    reader.readAsDataURL(file);
  }
};

window.deleteLogo = function(type) {
  if (type === 'wide') {
    localStorage.removeItem('taller_logo_wide');
  } else if (type === 'square') {
    localStorage.removeItem('taller_logo_square');
  }
};

window.toggleThirdPartyFields = function(show) {
  const container = document.getElementById('del-third-party-container');
  if (container) {
    container.style.display = show ? 'flex' : 'none';
  }
};

window.togglePartialPaymentField = function(status) {
  const container = document.getElementById('del-partial-payment-container');
  if (container) {
    if (status === 'Pago Parcial') {
      container.style.display = 'flex';
    } else {
      container.style.display = 'none';
      const input = document.getElementById('del-partial-amount');
      if (input) input.value = '';
    }
  }
  if (typeof updateDeliveryBalance === 'function') {
    updateDeliveryBalance();
  }
};

window.updateDeliveryBalance = function() {
  const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
  if (!vehicle) return;
  
  // Calculate total
  const services = [...(vehicle.quoteServices || [])];
  const parts = [...(vehicle.quoteParts || [])];
  const servSum = services.reduce((s, item) => s + item.value, 0);
  const partsSum = parts.reduce((s, item) => s + item.value, 0);
  const subtotal = servSum + partsSum;
  const discPercent = vehicle.discountPercent || 0;
  const discountVal = subtotal * (discPercent / 100);
  const net = subtotal - discountVal;
  const vatInclusive = vehicle.vatInclusive !== false;
  const total = Math.round(vatInclusive ? net : net * 1.19);

  const status = document.getElementById('del-payment-status')?.value || 'Totalmente Pagado';
  const partialAmountInput = document.getElementById('del-partial-amount');
  const balanceContainer = document.getElementById('del-balance-container');
  const balanceAmountEl = document.getElementById('del-balance-amount');

  if (status === 'Pago Parcial') {
    const partialVal = parseFloat(partialAmountInput?.value) || 0;
    const balance = Math.max(0, total - partialVal);
    
    if (balanceContainer) balanceContainer.style.display = 'flex';
    if (balanceAmountEl) balanceAmountEl.textContent = formatCurrency(balance);
  } else {
    if (balanceContainer) balanceContainer.style.display = 'none';
  }
};

window.saveDeliveryDetails = function() {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;

  const vehicle = vehicles[vehicleIndex];
  
  // Capturar campos
  vehicle.deliveryDate = document.getElementById('del-date')?.value || '';
  
  const radioTercero = document.querySelector('input[name="del-receiver-type"][value="tercero"]');
  vehicle.deliveryReceiverType = (radioTercero && radioTercero.checked) ? 'tercero' : 'titular';
  
  vehicle.deliveryThirdName = document.getElementById('del-third-name')?.value || '';
  vehicle.deliveryThirdDni = document.getElementById('del-third-dni')?.value || '';
  vehicle.deliveryNotes = document.getElementById('del-notes')?.value || '';
  vehicle.deliveryPaymentStatus = document.getElementById('del-payment-status')?.value || 'Totalmente Pagado';
  vehicle.deliveryPaymentMethod = document.getElementById('del-payment-method')?.value || 'Efectivo';
  vehicle.deliveryPartialAmount = parseFloat(document.getElementById('del-partial-amount')?.value) || 0;

  saveState();
  renderApp();

  // Toast de guardado exitoso
  const toast = document.createElement('div');
  toast.textContent = '✓ Datos de entrega guardados exitosamente';
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: var(--color-accent); color: white; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(var(--color-accent-rgb),0.3);
    animation: slide-up 0.2s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

window.archiveVehicle = function() {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;

  const vehicle = vehicles[vehicleIndex];
  
  // Guardar datos actuales del formulario de entrega antes de archivar
  saveDeliveryDetails();

  if (confirm(`¿Está seguro de que desea finalizar y archivar de forma permanente el vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate})?\n\nEsta acción lo removerá de la lista activa del taller y del Kanban de forma irreversible.`)) {
    // Marcar como entregado y archivado de forma permanente
    vehicles[vehicleIndex].delivered = true;
    vehicles[vehicleIndex].stage = 'entregado';
    
    // Si no tiene fecha cargada, forzar fecha actual
    if (!vehicles[vehicleIndex].deliveryDate) {
      const now = new Date();
      vehicles[vehicleIndex].deliveryDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    saveState();
    exitDetailedReception();
    renderApp();

    // Toast de éxito de archivado
    const toast = document.createElement('div');
    toast.textContent = '✓ Vehículo finalizado y archivado correctamente';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #00b050; color: white; font-weight: 700; font-size: 13px;
      padding: 12px 24px; border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,176,80,0.3);
      animation: slide-up 0.2s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};

window.downloadDeliveryPDF = function(vehicleId, returnBlob = false) {
  if (typeof loadWorkshopConfig === 'function') {
    loadWorkshopConfig();
  }
  const id = vehicleId || activeReceptionVehicleId;
  if (!id) {
    alert('No hay ningún vehículo activo para generar el certificado.');
    return;
  }
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) {
    alert('Vehículo no encontrado.');
    return;
  }

  const logoWide = localStorage.getItem('taller_logo_wide');
  const logoSquare = localStorage.getItem('taller_logo_square');

  // Formatear fecha y hora de entrega
  let rawDate = vehicle.deliveryDate;
  if (!rawDate) {
    const now = new Date();
    rawDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  
  let formattedDeliveryDate = '';
  try {
    const d = new Date(rawDate);
    formattedDeliveryDate = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} a las ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} hs`;
  } catch (e) {
    formattedDeliveryDate = rawDate;
  }

  // Quien retira
  let receiverInfo = 'Cliente Titular';
  if (vehicle.deliveryReceiverType === 'tercero') {
    receiverInfo = `Tercero Autorizado (Nombre: ${vehicle.deliveryThirdName || '—'}, DNI: ${vehicle.deliveryThirdDni || '—'})`;
  }

  // Calcular totales
  const services = [...(vehicle.quoteServices || [])];
  const parts = [...(vehicle.quoteParts || [])];
  const servSum = services.reduce((s, item) => s + item.value, 0);
  const partsSum = parts.reduce((s, item) => s + item.value, 0);
  const subtotal = servSum + partsSum;
  const discPercent = vehicle.discountPercent || 0;
  const discountVal = subtotal * (discPercent / 100);
  const net = subtotal - discountVal;
  const vatInclusive = vehicle.vatInclusive !== false;
  const total = vatInclusive ? net : net * 1.19;
  const partialAmount = vehicle.deliveryPartialAmount || 0;
  const remainingAmount = Math.max(0, total - partialAmount);

  // Generar filas de trabajos realizados
  let rowsHtml = '';
  let globalIndex = 1;
  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);

  if (services.length > 0) {
    rowsHtml += `<tr class="cat-row"><td colspan="3"><b>Servicios Realizados</b></td></tr>`;
    services.forEach(item => {
      rowsHtml += `<tr class="item-row"><td>${globalIndex++}</td><td>${item.name}</td><td style="text-align:right">${fmt(item.value)}</td></tr>`;
    });
  }
  if (parts.length > 0) {
    rowsHtml += `<tr class="cat-row"><td colspan="3"><b>Repuestos e Insumos Instalados</b></td></tr>`;
    parts.forEach(item => {
      rowsHtml += `<tr class="item-row"><td>${globalIndex++}</td><td>${item.name}</td><td style="text-align:right">${fmt(item.value)}</td></tr>`;
    });
  }

  // Preparar Logo HTML
  let logoHtml = '';
  if (logoWide) {
    logoHtml = `<img src="${logoWide}" style="height: 38px; width: auto; max-width: 160px; object-fit: contain;">`;
  } else if (logoSquare) {
    logoHtml = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="${logoSquare}" style="height: 32px; width: 32px; object-fit: contain;">
        <div class="brand-name" style="font-size: 15px; font-weight: 800; color: var(--color-accent); font-family: 'Inter', sans-serif; text-transform: uppercase;">${workshopConfig.name || 'Appli-Car'}</div>
      </div>
    `;
  } else {
    logoHtml = `
      <div style="display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; font-weight: 800; font-size: 16px; color: #1e293b;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, var(--color-accent) 0%, #2a2a2a 100%); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: white;">${(workshopConfig.name || 'Appli-Car').charAt(0).toUpperCase()}</div>
        <span style="letter-spacing: -0.5px; background: linear-gradient(to right, #1e293b 60%, #475569 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${workshopConfig.name || 'appli-car'}</span>
      </div>
    `;
  }

  // Preparar Observaciones HTML
  let notesHtml = '';
  if (vehicle.deliveryNotes) {
    notesHtml = `
      <div style="font-size: 8.5px; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
        <b>Observaciones de Salida:</b> ${vehicle.deliveryNotes}
      </div>
    `;
  }

  // Preparar IVA HTML
  let vatHtml = '';
  if (!vatInclusive) {
    vatHtml = `
      <div style="display: flex; justify-content: space-between; font-size: 9px; padding: 3px 0; color: #475569;">
        <span>IVA (19%):</span><span>${fmt(net * 0.19)}</span>
      </div>
    `;
  }

  const deliveryDateOnly = formattedDeliveryDate.split(' a las ')[0];

  // Crear contenedor temporal oculto
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px';
  container.style.height = '1px';
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';

  container.innerHTML = `
    <div class="pdf-container" style="--color-accent: ${localStorage.getItem('taller_accent_color') || '#ff6b00'}; padding: 10px 15px; background: #ffffff;">
      <style>
        .pdf-container { font-family: 'Inter', sans-serif !important; color: #1e293b !important; margin: 0 !important; padding: 10px 15px !important; font-size: 10px !important; line-height: 1.4 !important; background-color: #ffffff !important; }
        .pdf-container table { background-color: #ffffff !important; color: #1e293b !important; }
        .pdf-container td { background-color: #ffffff !important; color: #1e293b !important; border-color: #f1f5f9 !important; }
        .header-table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 8px !important; }
        .header-table td { background-color: transparent !important; }
        .header-title { text-align: center !important; font-size: 14px !important; font-weight: 800 !important; color: #475569 !important; text-transform: uppercase !important; margin: 0 !important; letter-spacing: 0.5px !important; }
        .workshop-card { border: 1px solid #e2e8f0 !important; border-left: 4px solid var(--color-accent) !important; border-radius: 6px !important; padding: 10px 16px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 12px !important; background-color: #ffffff !important; }
        .workshop-logo-area { display: flex !important; align-items: center !important; gap: 10px !important; }
        .workshop-logo-area img { height: 38px !important; width: auto !important; max-width: 120px !important; object-fit: contain !important; }
        .brand-name { font-size: 15px !important; font-weight: 800 !important; color: var(--color-accent) !important; }
        .workshop-info-area { text-align: right !important; }
        .workshop-name { font-size: 13px !important; font-weight: 800 !important; text-transform: uppercase !important; color: #1e293b !important; }
        .workshop-detail { font-size: 9px !important; color: #64748b !important; }
        
        .info-section { display: flex !important; gap: 10px !important; margin-bottom: 12px !important; }
        .info-block { flex: 1 !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; overflow: hidden !important; background-color: #ffffff !important; }
        .info-block-header { background-color: #f8fafc !important; color: #334155 !important; font-size: 9px !important; font-weight: 800 !important; padding: 5px 8px !important; border-bottom: 1px solid #e2e8f0 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; }
        .info-table { width: 100% !important; border-collapse: collapse !important; }
        .info-table td { padding: 5px 8px !important; font-size: 9px !important; border-bottom: 1px solid #f1f5f9 !important; background-color: #ffffff !important; color: #1e293b !important; }
        .info-label { color: #64748b !important; font-weight: 600 !important; width: 35% !important; }
        .plate-pill { border: 1px solid var(--color-accent) !important; background-color: #fff7ed !important; padding: 1px 6px !important; border-radius: 4px !important; font-weight: 700 !important; color: var(--color-accent) !important; font-size: 9px !important; display: inline-block !important; }
        
        .items-table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 12px !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; overflow: hidden !important; background-color: #ffffff !important; }
        .items-table th { background-color: #334155 !important; color: #ffffff !important; font-size: 9px !important; padding: 6px 8px !important; text-align: left !important; border: none !important; }
        .items-table th:nth-child(3) { text-align: right !important; }
        .cat-row td { background-color: #f8fafc !important; padding: 5px 8px !important; font-size: 9px !important; font-weight: 700 !important; color: #334155 !important; border-bottom: 1px solid #e2e8f0 !important; }
        .item-row td { padding: 5px 8px !important; font-size: 9px !important; color: #475569 !important; border-bottom: 1px solid #f1f5f9 !important; background-color: #ffffff !important; }
        .item-row td:nth-child(3) { text-align: right !important; }
        
        .footer-section { display: flex !important; gap: 10px !important; margin-top: 15px !important; }
        .conformity-card { flex: 1.5 !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; padding: 10px 14px !important; background-color: #f8fafc !important; color: #1e293b !important; }
        .conformity-text { font-size: 8.5px !important; color: #64748b !important; line-height: 1.4 !important; margin-bottom: 6px !important; text-align: justify !important; }
        
        .signatures-area { display: flex !important; justify-content: space-around !important; margin-top: 50px !important; }
        .signature-line { border-top: 1px solid #94a3b8 !important; width: 180px !important; text-align: center !important; font-size: 8.5px !important; color: #64748b !important; padding-top: 4px !important; }
        .signature-line .signature-title { font-weight: 700 !important; color: #334155 !important; margin-top: 2px !important; }
      </style>
      <table class="header-table">
        <tr>
          <td style="width: 20%;"></td>
          <td style="width: 60%;"><h1 class="header-title">Certificado de Conformidad y Entrega</h1></td>
          <td style="width: 20%; text-align: right; font-size: 9px; color: #64748b; font-weight: 500;">Salida: ${deliveryDateOnly}</td>
        </tr>
      </table>
      
      <div class="workshop-card">
        <div class="workshop-logo-area">
          ${logoHtml}
        </div>
        <div class="workshop-info-area">
          <div class="workshop-name">${workshopConfig.name || 'AutoTech'}</div>
          <div class="workshop-detail">Tel: ${workshopConfig.phone1 || '—'}${workshopConfig.phone2 ? ' / ' + workshopConfig.phone2 : ''}</div>
          <div class="workshop-detail">${workshopConfig.address || '—'}</div>
          <div class="workshop-detail">CUIT: ${workshopConfig.cuit || workshopConfig.rut || '—'}</div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <div class="info-block-header">DATOS DEL VEHÍCULO</div>
          <table class="info-table">
            <tr><td class="info-label">Patente</td><td><span class="plate-pill">${vehicle.plate}</span></td></tr>
            <tr><td class="info-label">Marca / Modelo</td><td>${vehicle.brand} ${vehicle.model}</td></tr>
            <tr><td class="info-label">Año / Motor</td><td>${vehicle.year || '—'} · ${vehicle.motor || '—'}</td></tr>
            <tr><td class="info-label">Kilometraje Final</td><td>${vehicle.kilometers ? vehicle.kilometers.toLocaleString('es-AR') + ' km' : '—'}</td></tr>
          </table>
        </div>
        <div class="info-block">
          <div class="info-block-header">DATOS DEL RETIRO</div>
          <table class="info-table">
            <tr><td class="info-label">Fecha y Hora</td><td>${formattedDeliveryDate}</td></tr>
            <tr><td class="info-label">Quién Retira</td><td>${receiverInfo}</td></tr>
            <tr><td class="info-label">Condición Pago</td><td><b>${vehicle.deliveryPaymentStatus || 'Totalmente Pagado'}</b>${vehicle.deliveryPaymentStatus === 'Pago Parcial' ? `<br><span style="font-size: 8px; color: #475569;">Abonó: ${fmt(partialAmount)} / Restante: ${fmt(remainingAmount)}</span>` : ''}</td></tr>
            <tr><td class="info-label">Medio de Pago</td><td>${vehicle.deliveryPaymentMethod || 'Efectivo'}</td></tr>
          </table>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 30px">#</th>
            <th>Trabajo Realizado / Concepto</th>
            <th style="width: 100px; text-align: right">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer-section">
        <div class="conformity-card">
          <div class="info-block-header" style="background: transparent; border: none; padding: 0 0 4px 0; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1;">Conformidad del Cliente</div>
          <div class="conformity-text">
            Por medio de la presente firma, declaro recibir a entera conformidad el vehículo detallado anteriormente, habiendo verificado el correcto funcionamiento del mismo y la culminación de los trabajos descritos. Asimismo, confirmo haber recibido de regreso las piezas mecánicas y repuestos sustituidos correspondientes a esta orden de trabajo (en caso de corresponder).
          </div>
          ${notesHtml}
        </div>
        
        <div class="conformity-card" style="flex: 0.8; background: transparent; display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; border: 1px solid #cbd5e1;">
          <div class="info-block-header" style="background: transparent; border: none; padding: 0 0 4px 0; border-bottom: 1px solid #cbd5e1; margin-bottom: 4px;">Resumen Liquidación</div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; padding: 3px 0; color: #475569;">
            <span>Subtotal Neto:</span><span>${fmt(subtotal - discountVal)}</span>
          </div>
          ${vatHtml}
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--color-accent); border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 4px;">
            <span>TOTAL NETO:</span><span>${fmt(total)}</span>
          </div>
          ${vehicle.deliveryPaymentStatus === 'Pago Parcial' ? `
          <div style="display: flex; justify-content: space-between; font-size: 9px; padding: 3px 0; color: #16a34a; font-weight: 600; border-top: 1px dashed #cbd5e1; margin-top: 4px;">
            <span>Abonado:</span><span>${fmt(partialAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #dc2626; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 2px;">
            <span>RESTANTE:</span><span>${fmt(remainingAmount)}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="signatures-area">
        <div class="signature-line">
          <div class="signature-title">Firma del Taller Autorizado</div>
          <div>AutoTech Service Representative</div>
        </div>
        <div class="signature-line">
          <div class="signature-title">Firma de Conformidad del Cliente</div>
          <div>Aclaración / DNI o Cédula de Identidad</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const opt = {
    margin:       [8, 10, 8, 10],
    filename:     `Certificado_Entrega_${vehicle.plate}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const targetElement = container.querySelector('.pdf-container');
  const worker = html2pdf().set(opt).from(targetElement);
  if (returnBlob) {
    return worker.outputPdf('blob').then(blob => {
      container.remove();
      return blob;
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      container.remove();
      throw err;
    });
  } else {
    worker.save().then(() => {
      container.remove();
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      container.remove();
    });
  }
};

function initLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// --- MODO OSCURO ---
function initDarkMode() {
  const saved = localStorage.getItem('taller_dark_mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved !== null ? saved === 'true' : prefersDark;
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
  updateDarkModeIcon(isDark);
}

window.toggleDarkMode = function() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('taller_dark_mode', isDark);
  updateDarkModeIcon(isDark);
};

window.clearDatabase = function() {
  if (confirm('âš ï¸  Â¡ATENCIÃ“N! Â¿EstÃ¡ seguro de que desea eliminar toda la base de datos del taller?\n\nEsto borrarÃ¡ todos los vehÃ­culos, citas, clientes y catÃ¡logos de forma permanente. Esta acciÃ³n no se puede deshacer.')) {
    localStorage.removeItem('taller_vehicles');
    localStorage.removeItem('taller_clients');
    localStorage.removeItem('taller_services');
    localStorage.removeItem('taller_parts');
    localStorage.removeItem('taller_team');
    localStorage.removeItem('taller_reminders');
    localStorage.removeItem('taller_vehicle_registry');
    alert('Base de datos eliminada con Ã©xito. La pÃ¡gina se recargarÃ¡ para aplicar los cambios.');
    location.reload();
  }
};

function updateDarkModeIcon(isDark) {
  const icon = document.getElementById('dark-mode-icon');
  if (!icon) return;
  icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Carga y almacenamiento del Estado mediante LocalStorage
function loadState() {
  // 1. Clientes
  try {
    const savedClients = localStorage.getItem('taller_clients');
    const parsed = savedClients ? JSON.parse(savedClients) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      clients = parsed;
    } else {
      throw new Error('empty');
    }
  } catch(e) {
    clients = [
      { id: 'c-1', name: 'Enzo Da Silva', phone: '+5602235041116', email: 'enzo@gmail.com', createdAt: '2026-05-23' },
      { id: 'c-2', name: 'Silva', phone: '+56987654321', email: 'silva@email.com', createdAt: '2026-05-24' },
      { id: 'c-3', name: 'Juan GarcÃ­a', phone: '+56911223344', email: 'garcia@email.com', createdAt: '2026-05-25' }
    ];
    saveClients();
  }

  // 2. VehÃ­culos
  try {
    const savedVehicles = localStorage.getItem('taller_vehicles');
    const parsed = savedVehicles ? JSON.parse(savedVehicles) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      vehicles = parsed;
    } else {
      throw new Error('empty');
    }
  } catch(e) {
    // Datos de demostraciÃ³n idÃ©nticos a los de las capturas (Volkswagen Gol GLZ665)
    const mockEntryTime = Date.now() - (2 * 60 + 27) * 1000;
    vehicles = [
      {
        id: 'mock-vehicle-gol-2026',
        plate: 'GLZ665',
        brand: 'Volkswagen',
        model: 'Gol',
        year: '2026',
        color: 'Gris Plata',
        motor: '1.6 8V',
        client: 'Enzo Da Silva',
        clientPhone: '+5602235041116',
        clientEmail: 'enzo@gmail.com',
        stage: 'cotizacion',
        value: 30018.45,
        entryDate: '2026-05-23',
        entryTime: mockEntryTime,
        delivered: false,
        kilometers: 45000,
        fuelLevel: '1/2',
        services: ['Cambio de aceite y filtro', 'InspecciÃ³n de frenos delanteros', 'AlineaciÃ³n y balanceo'],
        hasDetails: true,
        detailsNotes: 'PequeÃ±o rayÃ³n en paragolpes trasero',
        quoteServices: [
          { name: 'cambio de aceite', value: 30000 }
        ],
        quoteParts: [
          { name: 'Filtro de Aceite', value: 18.45 }
        ],
        discountPercent: 0,
        vatInclusive: true,
        quoteNotes: 'Presupuesto preliminar para service completo de mantenimiento periÃ³dico.',
        quoteSendEmail: false,
        quoteCompleted: true
      }
    ];
    saveState();
  }

  // 3. CatÃ¡logo de Servicios
  try {
    const savedServices = localStorage.getItem('taller_services');
    const parsed = savedServices ? JSON.parse(savedServices) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      servicesCatalog = parsed;
    } else {
      throw new Error('empty');
    }
  } catch(e) {
    servicesCatalog = [
      { id: 's-1', name: 'Cambio de aceite y filtro', description: 'Reemplazo de aceite sintÃ©tico y filtro original homologado.', price: 30000, date: '2026-05-23' },
      { id: 's-2', name: 'AlineaciÃ³n y balanceo', description: 'AlineaciÃ³n computarizada del tren delantero y balanceo de 4 ruedas.', price: 25000, date: '2026-05-23' },
      { id: 's-3', name: 'InspecciÃ³n de frenos', description: 'Control de desgaste de pastillas, rectificaciÃ³n de discos y lÃ­quido.', price: 18000, date: '2026-05-23' },
      { id: 's-4', name: 'DiagnÃ³stico por scanner', description: 'Lectura completa de cÃ³digos de falla del motor y sensores de a bordo.', price: 15000, date: '2026-05-24' }
    ];
    saveServices();
  }

  // 4. CatÃ¡logo de Repuestos
  try {
    const savedParts = localStorage.getItem('taller_parts');
    const parsed = savedParts ? JSON.parse(savedParts) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      partsCatalog = parsed;
    } else {
      throw new Error('empty');
    }
  } catch(e) {
    partsCatalog = [
      { id: 'p-1', name: 'Aceite SintÃ©tico 5W30 (4L)', brand: 'Universal', model: 'Multimarca', year: 'â€”', description: 'Aceite sintÃ©tico premium multigrado para alto rendimiento.', price: 35000, date: '2026-05-23' },
      { id: 'p-2', name: 'Filtro de Aceite original', brand: 'Universal', model: 'Multimarca', year: 'â€”', description: 'Filtro original homologado de alta eficiencia y filtrado.', price: 12000, date: '2026-05-23' },
      { id: 'p-3', name: 'Pastillas de Freno delanteras', brand: 'Universal', model: 'Multimarca', year: 'â€”', description: 'Kit de pastillas originales de alta duraciÃ³n y adherencia.', price: 45000, date: '2026-05-23' },
      { id: 'p-4', name: 'BujÃ­a de Platino premium', brand: 'Universal', model: 'Multimarca', year: 'â€”', description: 'BujÃ­a de alta conductividad tÃ©rmica y elÃ©ctrica.', price: 8000, date: '2026-05-24' },
      { id: 'p-5', name: 'Kit de DistribuciÃ³n premium', brand: 'Universal', model: 'Multimarca', year: 'â€”', description: 'Correa, tensores y bomba de agua original.', price: 120000, date: '2026-05-24' }
    ];
    saveParts();
  }

  // 5. Equipo del Taller
  try {
    const savedTeam = localStorage.getItem('taller_team');
    const parsed = savedTeam ? JSON.parse(savedTeam) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      teamMembers = parsed;
    } else {
      throw new Error('empty');
    }
  } catch(e) {
    teamMembers = [
      { id: 't-1', name: 'Laura GÃ³mez', phone: '+56987654321', email: 'laura@taller.com', role: 'Administrador', specialty: 'GestiÃ³n General', salary: 1200000, active: true },
      { id: 't-2', name: 'Carlos PÃ©rez', phone: '+56912345678', email: 'carlos@taller.com', role: 'MecÃ¡nico', specialty: 'Motores y Embragues', salary: 850000, active: true },
      { id: 't-3', name: 'AndrÃ©s Silva', phone: '+56911223344', email: 'andres@taller.com', role: 'Vendedor', specialty: 'AtenciÃ³n al Cliente', salary: 700000, active: true }
    ];
    saveTeam();
  }

  // 6. Recordatorios
  try {
    const savedReminders = localStorage.getItem('taller_reminders');
    const parsed = savedReminders ? JSON.parse(savedReminders) : null;
    reminders = Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    reminders = [];
  }

  // 7. Registro de VehÃ­culos (Marcas, Modelos, Motores)
  loadVehicleRegistry();
}

function saveState() {
  localStorage.setItem('taller_vehicles', JSON.stringify(vehicles));
}

window.saveVehicleRegistry = function() {
  localStorage.setItem('taller_vehicle_registry', JSON.stringify(vehicleRegistry));
};

window.loadVehicleRegistry = function() {
  const saved = localStorage.getItem('taller_vehicle_registry');
  if (saved) {
    vehicleRegistry = JSON.parse(saved);
    // Backward compatibility migration:
    if (vehicleRegistry.models.length > 0 && typeof vehicleRegistry.models[0] === 'string') {
      vehicleRegistry.models = vehicleRegistry.models.map(m => ({ name: m, brand: '' }));
    }
    if (vehicleRegistry.engines.length > 0 && typeof vehicleRegistry.engines[0] === 'string') {
      vehicleRegistry.engines = vehicleRegistry.engines.map(e => ({ name: e, model: '', brand: '' }));
    }
  } else {
    // Build from existing vehicles
    const brandsSet = new Set();
    const modelsList = [];
    const enginesList = [];
    
    vehicles.forEach(v => {
      if (v.brand) brandsSet.add(v.brand.trim());
      if (v.model) {
        const mTrim = v.model.trim();
        const bTrim = v.brand ? v.brand.trim() : '';
        if (!modelsList.some(m => m.name.toLowerCase() === mTrim.toLowerCase() && m.brand.toLowerCase() === bTrim.toLowerCase())) {
          modelsList.push({ name: mTrim, brand: bTrim });
        }
      }
      if (v.motor) {
        const eTrim = v.motor.trim();
        const mTrim = v.model ? v.model.trim() : '';
        const bTrim = v.brand ? v.brand.trim() : '';
        if (!enginesList.some(e => e.name.toLowerCase() === eTrim.toLowerCase() && e.model.toLowerCase() === mTrim.toLowerCase())) {
          enginesList.push({ name: eTrim, model: mTrim, brand: bTrim });
        }
      }
    });
    
    vehicleRegistry = {
      brands: Array.from(brandsSet),
      models: modelsList,
      engines: enginesList
    };
    saveVehicleRegistry();
  }
};

window.addToVehicleRegistry = function(brand, model, engine) {
  let updated = false;
  const bTrim = brand ? brand.trim() : '';
  const mTrim = model ? model.trim() : '';
  const eTrim = engine ? engine.trim() : '';

  if (bTrim) {
    if (!vehicleRegistry.brands.some(b => b.toLowerCase() === bTrim.toLowerCase())) {
      vehicleRegistry.brands.push(bTrim);
      updated = true;
    }
  }

  if (mTrim) {
    // Check if model + brand already exists
    const exists = vehicleRegistry.models.some(m => {
      if (typeof m === 'object') {
        return m.name.toLowerCase() === mTrim.toLowerCase() && (m.brand || '').toLowerCase() === bTrim.toLowerCase();
      }
      return m.toLowerCase() === mTrim.toLowerCase() && !bTrim;
    });
    
    if (!exists) {
      vehicleRegistry.models.push({ name: mTrim, brand: bTrim });
      updated = true;
    }
  }

  if (eTrim) {
    // Check if engine + model already exists
    const exists = vehicleRegistry.engines.some(e => {
      if (typeof e === 'object') {
        return e.name.toLowerCase() === eTrim.toLowerCase() && (e.model || '').toLowerCase() === mTrim.toLowerCase();
      }
      return e.toLowerCase() === eTrim.toLowerCase() && !mTrim;
    });
    
    if (!exists) {
      vehicleRegistry.engines.push({ name: eTrim, model: mTrim, brand: bTrim });
      updated = true;
    }
  }

  if (updated) {
    saveVehicleRegistry();
    if (typeof populateAutocompleteDatalists === 'function') {
      populateAutocompleteDatalists();
    }
    if (currentView === 'configuracion' && typeof renderVehicleRegistryPanel === 'function') {
      renderVehicleRegistryPanel();
    }
  }
};

function saveClients() {
  localStorage.setItem('taller_clients', JSON.stringify(clients));
}

function saveServices() {
  localStorage.setItem('taller_services', JSON.stringify(servicesCatalog));
}

function saveParts() {
  localStorage.setItem('taller_parts', JSON.stringify(partsCatalog));
}

function saveTeam() {
  localStorage.setItem('taller_team', JSON.stringify(teamMembers));
}

function saveReminders() {
  localStorage.setItem('taller_reminders', JSON.stringify(reminders));
}

// --- MODO DEMOSTRACIÓN / DATOS DE PRUEBA ---
window.toggleDemoMode = function(enabled) {
  localStorage.setItem('taller_demo_mode_enabled', enabled ? 'true' : 'false');
  
  if (enabled) {
    // 1. GENERAR CLIENTES SIMULADOS (isDemo: true)
    const demoClients = [
      { id: 'demo-c-1', name: 'Juan Pérez', phone: '+5491138459201', email: 'juan.perez@gmail.com', createdAt: '2026-05-10', isDemo: true },
      { id: 'demo-c-2', name: 'María Rodríguez', phone: '+5491147582291', email: 'maria.rod@hotmail.com', createdAt: '2026-05-12', isDemo: true },
      { id: 'demo-c-3', name: 'Santiago Herrera', phone: '+5491158229910', email: 'santiago.herrera@yahoo.com', createdAt: '2026-05-15', isDemo: true },
      { id: 'demo-c-4', name: 'Ana Martínez', phone: '+5491162394851', email: 'ana.martinez@outlook.com', createdAt: '2026-05-18', isDemo: true },
      { id: 'demo-c-5', name: 'Diego Fernández', phone: '+5491129384756', email: 'diego.f@gmail.com', createdAt: '2026-05-20', isDemo: true }
    ];
    // Evitar duplicados por ID
    demoClients.forEach(c => {
      if (!clients.some(item => item.id === c.id)) {
        clients.push(c);
      }
    });
    saveClients();

    // 2. GENERAR SERVICIOS SIMULADOS EN CATÁLOGO
    const demoServices = [
      { id: 'demo-s-1', name: 'Cambio de Pastillas de Freno', description: 'Reemplazo de pastillas delanteras y rectificación de discos.', price: 28000, date: '2026-05-20', isDemo: true },
      { id: 'demo-s-2', name: 'Escaneo Computarizado', description: 'Diagnóstico general de fallas de inyección y sensores con scanner OBD2.', price: 12000, date: '2026-05-20', isDemo: true },
      { id: 'demo-s-3', name: 'Limpieza de Inyectores', description: 'Limpieza por ultrasonido y reemplazo de microfiltros y o-rings.', price: 35000, date: '2026-05-21', isDemo: true },
      { id: 'demo-s-4', name: 'Alineación 3D y Balanceo', description: 'Alineación tridimensional y balanceo dinámico de cuatro llantas.', price: 22000, date: '2026-05-22', isDemo: true }
    ];
    demoServices.forEach(s => {
      if (!servicesCatalog.some(item => item.id === s.id)) {
        servicesCatalog.push(s);
      }
    });
    saveServices();

    // 3. GENERAR REPUESTOS SIMULADOS EN CATÁLOGO
    const demoParts = [
      { id: 'demo-p-1', name: 'Pastillas de Freno Brembo', brand: 'Brembo', model: 'Corolla / Civic', year: '2018-2022', description: 'Pastillas cerámicas de alto coeficiente de fricción.', price: 42000, date: '2026-05-20', isDemo: true },
      { id: 'demo-p-2', name: 'Filtro de Aire Mann', brand: 'Mann', model: 'Multimarca', year: '—', description: 'Filtro de aire de alta retención de partículas.', price: 8500, date: '2026-05-20', isDemo: true },
      { id: 'demo-p-3', name: 'Batería Willard 12V 75Ah', brand: 'Willard', model: 'Multimarca', year: '—', description: 'Batería de libre mantenimiento con alta corriente de arranque.', price: 65000, date: '2026-05-21', isDemo: true }
    ];
    demoParts.forEach(p => {
      if (!partsCatalog.some(item => item.id === p.id)) {
        partsCatalog.push(p);
      }
    });
    saveParts();

    // 4. GENERAR VEHÍCULOS / ORDENES DE TRABAJO (isDemo: true)
    const now = Date.now();
    const hr = 60 * 60 * 1000;
    const day = 24 * hr;

    const demoVehicles = [
      {
        id: 'demo-v-1',
        plate: 'AA123BB',
        brand: 'Toyota',
        model: 'Corolla',
        year: '2020',
        color: 'Blanco Perlado',
        motor: '1.8 Hybrid',
        client: 'Juan Pérez',
        clientPhone: '+5491138459201',
        clientEmail: 'juan.perez@gmail.com',
        stage: 'reparacion',
        value: 50000.00,
        entryDate: new Date(now - 3 * hr).toISOString().split('T')[0],
        entryTime: now - 3 * hr,
        delivered: false,
        kilometers: 68000,
        fuelLevel: '1/2',
        services: ['Escaneo Computarizado', 'Cambio de Pastillas de Freno'],
        hasDetails: false,
        detailsNotes: '',
        quoteServices: [{ name: 'Escaneo Computarizado', value: 12000 }, { name: 'Cambio de Pastillas de Freno', value: 28000 }],
        quoteParts: [{ name: 'Pastillas de Freno Brembo', value: 10000 }],
        discountPercent: 0,
        vatInclusive: true,
        quoteNotes: 'Servicio de mantenimiento de frenos e inspección eléctrica híbrida.',
        quoteSendEmail: false,
        quoteCompleted: true,
        isDemo: true
      },
      {
        id: 'demo-v-2',
        plate: 'AD789YY',
        brand: 'Ford',
        model: 'Fiesta',
        year: '2017',
        color: 'Azul Kinetic',
        motor: '1.6 Sigma',
        client: 'María Rodríguez',
        clientPhone: '+5491147582291',
        clientEmail: 'maria.rod@hotmail.com',
        stage: 'recepcion',
        value: 12000.00,
        entryDate: new Date(now - 1 * hr).toISOString().split('T')[0],
        entryTime: now - 1 * hr,
        delivered: false,
        kilometers: 92000,
        fuelLevel: '1/4',
        services: ['Escaneo Computarizado'],
        hasDetails: true,
        detailsNotes: 'Luz de check-engine encendida en tablero.',
        quoteServices: [{ name: 'Escaneo Computarizado', value: 12000 }],
        quoteParts: [],
        discountPercent: 0,
        vatInclusive: true,
        quoteNotes: 'Lectura de códigos de diagnóstico de inyección.',
        quoteSendEmail: false,
        quoteCompleted: false,
        isDemo: true
      },
      {
        id: 'demo-v-3',
        plate: 'AC456XX',
        brand: 'Honda',
        model: 'Civic',
        year: '2019',
        color: 'Gris Oscuro',
        motor: '2.0 i-VTEC',
        client: 'Santiago Herrera',
        clientPhone: '+5491158229910',
        clientEmail: 'santiago.herrera@yahoo.com',
        stage: 'cotizacion',
        value: 75000.00,
        entryDate: new Date(now - 5 * hr).toISOString().split('T')[0],
        entryTime: now - 5 * hr,
        delivered: false,
        kilometers: 55000,
        fuelLevel: '3/4',
        services: ['Limpieza de Inyectores', 'Alineación 3D y Balanceo'],
        hasDetails: false,
        detailsNotes: '',
        quoteServices: [{ name: 'Limpieza de Inyectores', value: 35000 }, { name: 'Alineación 3D y Balanceo', value: 22000 }],
        quoteParts: [{ name: 'Filtro de Aire Mann', value: 18000 }],
        discountPercent: 0,
        vatInclusive: true,
        quoteNotes: 'Servicio de afinación motor y alineación tridimensional.',
        quoteSendEmail: false,
        quoteCompleted: true,
        isDemo: true
      },
      {
        id: 'demo-v-4',
        plate: 'AE951ZZ',
        brand: 'Chevrolet',
        model: 'Onix',
        year: '2021',
        color: 'Rojo Metálico',
        motor: '1.2 Ecotec',
        client: 'Ana Martínez',
        clientPhone: '+5491162394851',
        clientEmail: 'ana.martinez@outlook.com',
        stage: 'listo',
        value: 20500.00,
        entryDate: new Date(now - 10 * hr).toISOString().split('T')[0],
        entryTime: now - 10 * hr,
        delivered: false,
        kilometers: 32000,
        fuelLevel: 'Full',
        services: ['Alineación 3D y Balanceo'],
        hasDetails: false,
        detailsNotes: '',
        quoteServices: [{ name: 'Alineación 3D y Balanceo', value: 20500 }],
        quoteParts: [],
        discountPercent: 0,
        vatInclusive: true,
        quoteNotes: 'Alineación y balanceo terminado con éxito.',
        quoteSendEmail: false,
        quoteCompleted: true,
        isDemo: true
      },
      // VEHÍCULOS HISTÓRICOS ENTREGADOS (Para estadísticas financieras reales)
      {
        id: 'demo-v-5',
        plate: 'AB987CC',
        brand: 'Fiat',
        model: 'Cronos',
        year: '2022',
        color: 'Blanco',
        motor: '1.3 Firefly',
        client: 'Diego Fernández',
        clientPhone: '+5491129384756',
        clientEmail: 'diego.f@gmail.com',
        stage: 'listo',
        value: 95000.00,
        entryDate: new Date(now - 2 * day).toISOString().split('T')[0],
        entryTime: now - 2 * day,
        deliveryTime: now - 1 * day,
        delivered: true,
        kilometers: 28000,
        fuelLevel: '1/2',
        services: ['Alineación 3D y Balanceo'],
        quoteServices: [{ name: 'Mantenimiento General', value: 30000 }],
        quoteParts: [{ name: 'Batería Willard 12V 75Ah', value: 65000 }],
        discountPercent: 0,
        vatInclusive: true,
        quoteCompleted: true,
        isDemo: true
      },
      {
        id: 'demo-v-6',
        plate: 'AF753MM',
        brand: 'Peugeot',
        model: '208',
        year: '2023',
        color: 'Gris Grafito',
        motor: '1.6 VTi',
        client: 'Juan Pérez',
        clientPhone: '+5491138459201',
        clientEmail: 'juan.perez@gmail.com',
        stage: 'listo',
        value: 120000.00,
        entryDate: new Date(now - 3 * day).toISOString().split('T')[0],
        entryTime: now - 3 * day,
        deliveryTime: now - 1 * day,
        delivered: true,
        kilometers: 15000,
        fuelLevel: '3/4',
        services: ['Afinación Completa'],
        quoteServices: [{ name: 'Afinación Completa', value: 50000 }],
        quoteParts: [{ name: 'Bujías de Platino x4', value: 32000 }, { name: 'Filtro Mann', value: 38000 }],
        discountPercent: 0,
        vatInclusive: true,
        quoteCompleted: true,
        isDemo: true
      },
      {
        id: 'demo-v-7',
        plate: 'AG246KK',
        brand: 'Renault',
        model: 'Sandero',
        year: '2018',
        color: 'Negro Nacré',
        motor: '1.6 16V K4M',
        client: 'María Rodríguez',
        clientPhone: '+5491147582291',
        clientEmail: 'maria.rod@hotmail.com',
        stage: 'listo',
        value: 85000.00,
        entryDate: new Date(now - 4 * day).toISOString().split('T')[0],
        entryTime: now - 4 * day,
        deliveryTime: now - 2 * day,
        delivered: true,
        kilometers: 105000,
        fuelLevel: '1/2',
        services: ['Cambio de Aceite y Filtros'],
        quoteServices: [{ name: 'Servicio Mecánico', value: 35000 }],
        quoteParts: [{ name: 'Kit Pastillas Freno', value: 50000 }],
        discountPercent: 0,
        vatInclusive: true,
        quoteCompleted: true,
        isDemo: true
      }
    ];

    demoVehicles.forEach(v => {
      if (!vehicles.some(item => item.id === v.id)) {
        vehicles.push(v);
        // Registrar marcas/modelos en sugerencias de autocompletado
        addToVehicleRegistry(v.brand, v.model, v.motor);
      }
    });
    saveState();

    alert('✨ Modo Demostración activado. Se han generado 5 clientes, 4 servicios, 3 repuestos y 7 vehículos/OTs de prueba.');
  } else {
    // 5. REMOVER TODO EL CONTENIDO SIMULADO
    vehicles = vehicles.filter(v => !v.isDemo);
    clients = clients.filter(c => !c.isDemo);
    servicesCatalog = servicesCatalog.filter(s => !s.isDemo);
    partsCatalog = partsCatalog.filter(p => !p.isDemo);

    saveState();
    saveClients();
    saveServices();
    saveParts();

    alert('🧹 Modo Demostración desactivado. Todos los datos de prueba simulados han sido eliminados de su base de datos.');
  }

  // 6. RE-RENDERIZAR INTERRUPTORES DE VISTAS
  if (typeof renderApp === 'function') renderApp();
  if (typeof renderVehiclesListTable === 'function') renderVehiclesListTable();
  if (typeof renderReportesView === 'function') renderReportesView();
  if (typeof renderCotizacionesTable === 'function') renderCotizacionesTable();
  if (typeof renderOrdenesTrabajoView === 'function') renderOrdenesTrabajoView();
  if (typeof renderClientesListaView === 'function') renderClientesListaView();
  if (typeof renderServiciosCatalogView === 'function') renderServiciosCatalogView();
  if (typeof renderRepuestosCatalogView === 'function') renderRepuestosCatalogView();
  if (typeof initLucide === 'function') initLucide();
};

window.toggleLogoVisibility = function(enabled) {
  localStorage.setItem('taller_logos_enabled', enabled ? 'true' : 'false');
  // Re-renderizar las vistas activas para reflejar el cambio de inmediato
  if (typeof renderVehiclesListTable === 'function') renderVehiclesListTable();
  if (typeof renderApp === 'function') renderApp();
  if (typeof initLucide === 'function') initLucide();
};

window.toggleMeliSearchButton = function(enabled) {
  localStorage.setItem('taller_meli_search_enabled', enabled ? 'true' : 'false');
};

// ============================================================
// RECORDATORIOS (REMINDERS)
// ============================================================

window.openReminderModal = function(dateString, reminderId = null) {
  const modal = document.getElementById('reminder-modal');
  if (!modal) return;

  const titleEl = document.getElementById('reminder-modal-title');
  const idInput = document.getElementById('reminder-form-id');
  const dateInput = document.getElementById('reminder-form-date');
  const titleInput = document.getElementById('reminder-form-title');
  const descInput = document.getElementById('reminder-form-desc');
  const dateLabelEl = document.getElementById('reminder-modal-date-label');
  const deleteBtn = document.getElementById('reminder-delete-btn');

  // Format date label
  const dateObj = new Date(dateString + 'T00:00:00');
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  dateLabelEl.textContent = dateObj.toLocaleDateString('es-ES', opts);

  dateInput.value = dateString;

  if (reminderId) {
    // Edit mode
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;
    titleEl.innerHTML = '<i data-lucide="bell"></i> Editar Recordatorio';
    idInput.value = reminder.id;
    titleInput.value = reminder.title;
    descInput.value = reminder.description || '';
    deleteBtn.style.display = 'flex';
  } else {
    // Create mode
    titleEl.innerHTML = '<i data-lucide="bell-plus"></i> Nuevo Recordatorio';
    idInput.value = '';
    titleInput.value = '';
    descInput.value = '';
    deleteBtn.style.display = 'none';
  }

  modal.classList.add('open');
  initLucide();
  setTimeout(() => titleInput.focus(), 100);
};

window.saveReminder = function() {
  const idInput = document.getElementById('reminder-form-id');
  const dateInput = document.getElementById('reminder-form-date');
  const titleInput = document.getElementById('reminder-form-title');
  const descInput = document.getElementById('reminder-form-desc');

  const title = titleInput.value.trim();
  if (!title) {
    titleInput.style.borderColor = '#ef4444';
    titleInput.focus();
    setTimeout(() => { titleInput.style.borderColor = ''; }, 1500);
    return;
  }

  const existingId = idInput.value;
  if (existingId) {
    // Update existing
    const idx = reminders.findIndex(r => r.id === existingId);
    if (idx !== -1) {
      reminders[idx].title = title;
      reminders[idx].description = descInput.value.trim();
    }
  } else {
    // Create new
    const newReminder = {
      id: 'rem-' + Date.now(),
      date: dateInput.value,
      title: title,
      description: descInput.value.trim(),
      createdAt: new Date().toISOString()
    };
    reminders.push(newReminder);
  }

  saveReminders();
  closeModal('reminder-modal');

  // Re-render calendar
  if (typeof renderAgendaCalendar === 'function') renderAgendaCalendar();
  else if (typeof renderAgendaView === 'function') renderAgendaView();
};

window.deleteReminder = function() {
  const idInput = document.getElementById('reminder-form-id');
  const reminderId = idInput.value;
  if (!reminderId) return;

  if (!confirm('\u00bfEliminar este recordatorio? Esta acci\u00f3n no se puede deshacer.')) return;

  reminders = reminders.filter(r => r.id !== reminderId);
  saveReminders();
  closeModal('reminder-modal');

  if (typeof renderAgendaCalendar === 'function') renderAgendaCalendar();
  else if (typeof renderAgendaView === 'function') renderAgendaView();
};

// --- 2. GESTORES DE EVENTOS ---

function initEventListeners() {
  // Cierre de menÃºs contextuales al hacer clic fuera
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('card-context-menu');
    if (menu && !e.target.closest('.card-actions-btn') && !e.target.closest('.dropdown-menu')) {
      menu.classList.remove('show');
    }
  });

  // Cierre de modales al hacer clic fuera (en la zona del fondo modal-overlay)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      const modalId = e.target.id;
      if (modalId === 'reception-panel-view') {
        exitDetailedReception();
      } else if (modalId === 'global-search-modal') {
        if (typeof closeGlobalSearchModal === 'function') {
          closeGlobalSearchModal(e);
        }
      } else {
        closeModal(modalId);
      }
    }
  });

  // Tecla Escape para cerrar modales
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('vehicle-modal');
      closeModal('new-client-modal');
      closeModal('quote-modal');
    }
  });

  // Enter en el input de servicios en la ficha
  const serviceInput = document.getElementById('det-service-input');
  if (serviceInput) {
    serviceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addServiceToList();
      }
    });
  }

  // Autocompletar precio de servicio/repuesto al seleccionar en cotizaciÃ³n
  const quoteItemName = document.getElementById('add-quote-item-name');
  if (quoteItemName) {
    quoteItemName.addEventListener('input', () => {
      const selectedName = quoteItemName.value.trim();
      const type = document.getElementById('add-quote-item-type').value;
      if (type === 'service') {
        const service = servicesCatalog.find(s => s.name === selectedName);
        if (service) {
          document.getElementById('add-quote-item-value').value = service.price;
        }
      } else {
        const part = partsCatalog.find(p => p.name === selectedName);
        if (part) {
          document.getElementById('add-quote-item-value').value = part.price;
        }
      }
    });
  }
}

// Intercambiar Vistas (Tablero / Calendario / Ficha RecepciÃ³n / Reportes / Ingresos / Cotizaciones / Agenda)
// Intercambiar Vistas (Tablero / Calendario / Ficha RecepciÃ³n / Reportes / Ingresos / Cotizaciones / Agenda / Ã“rdenes de Trabajo / Servicios / Equipo / Clientes / Cuentas)
window.switchView = function(view) {
  if (typeof window.closeMobileSidebarIfOpen === 'function') {
    window.closeMobileSidebarIfOpen();
  }
  // 1. Ocultar todos los contenedores principales
  const allPanels = [
    'dashboard-view-panel',
    'reportes-view-panel',
    'vehiculos-ingresados-view-panel',
    'cotizaciones-view-panel',
    'agenda-view-panel',
    'ordenes-trabajo-view-panel',
    'servicios-catalogo-view-panel',
    'repuestos-catalogo-view-panel',
    'equipo-lista-view-panel',
    'clientes-lista-view-panel',
    'cuentas-cobrar-view-panel',
    'vehiculos-lista-view-panel',
    'reception-panel-view',
    'configuracion-view-panel'
  ];
  allPanels.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = 'none';
  });

  // 2. Limpiar clases activas en los botones de navegaciÃ³n lateral
  const sidebarButtons = [
    'menu-panel', 
    'menu-reportes-main', 
    'menu-vehiculos', 
    'menu-cotizaciones', 
    'menu-agenda',
    'menu-ot',
    'menu-servicios',
    'menu-repuestos',
    'menu-equipo',
    'menu-clientes-db',
    'menu-cuentas',
    'menu-vehiculos-db'
  ];
  sidebarButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('active');
  });

  currentView = view;

  const getAndShow = (id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  };

  if (view === 'recepcion-detalle') {
    getAndShow('reception-panel-view');
    return;
  }

  if (view === 'repuestos-catalogo') {
    getAndShow('repuestos-catalogo-view-panel');
    const menuBtn = document.getElementById('menu-repuestos');
    if (menuBtn) menuBtn.classList.add('active');
    renderRepuestosCatalogView();
    return;
  }

  // Activar la vista correspondiente
  if (view === 'tablero') {
    getAndShow('dashboard-view-panel');
    const menuBtn = document.getElementById('menu-panel');
    if (menuBtn) menuBtn.classList.add('active');

    const boardContainer = document.getElementById('kanban-view-container');
    const calendarContainer = document.getElementById('calendar-view-container');
    if (boardContainer) boardContainer.style.display = 'grid';
    if (calendarContainer) calendarContainer.style.display = 'none';

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Panel Operativo';

    const tableroToggle = document.getElementById('toggle-tablero-btn');
    const calendarToggle = document.getElementById('toggle-calendario-btn');
    if (tableroToggle) tableroToggle.classList.add('active');
    if (calendarToggle) calendarToggle.classList.remove('active');
  } 
  else if (view === 'calendario') {
    getAndShow('dashboard-view-panel');
    const menuBtn = document.getElementById('menu-panel');
    if (menuBtn) menuBtn.classList.add('active');

    const boardContainer = document.getElementById('kanban-view-container');
    const calendarContainer = document.getElementById('calendar-view-container');
    if (boardContainer) boardContainer.style.display = 'none';
    if (calendarContainer) calendarContainer.style.display = 'grid';

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Calendario de Ingresos';

    const tableroToggle = document.getElementById('toggle-tablero-btn');
    const calendarToggle = document.getElementById('toggle-calendario-btn');
    if (tableroToggle) tableroToggle.classList.remove('active');
    if (calendarToggle) calendarToggle.classList.add('active');

    renderCalendar();
  }
  else if (view === 'reportes') {
    getAndShow('reportes-view-panel');
    const menuBtn = document.getElementById('menu-reportes-main');
    if (menuBtn) menuBtn.classList.add('active');
    renderReportesView();
  }
  else if (view === 'vehiculos-ingresados') {
    getAndShow('vehiculos-ingresados-view-panel');
    const menuBtn = document.getElementById('menu-vehiculos');
    if (menuBtn) menuBtn.classList.add('active');
    renderVehiclesListTable();
  }
  else if (view === 'cotizaciones') {
    getAndShow('cotizaciones-view-panel');
    const menuBtn = document.getElementById('menu-cotizaciones');
    if (menuBtn) menuBtn.classList.add('active');
    renderCotizacionesTable();
  }
  else if (view === 'agenda') {
    getAndShow('agenda-view-panel');
    const menuBtn = document.getElementById('menu-agenda');
    if (menuBtn) menuBtn.classList.add('active');
    renderAgendaCalendar();
  }
  else if (view === 'ordenes-trabajo') {
    getAndShow('ordenes-trabajo-view-panel');
    const menuBtn = document.getElementById('menu-ot');
    if (menuBtn) menuBtn.classList.add('active');
    renderOrdenesTrabajoView();
  }
  else if (view === 'servicios-catalogo') {
    getAndShow('servicios-catalogo-view-panel');
    const menuBtn = document.getElementById('menu-servicios');
    if (menuBtn) menuBtn.classList.add('active');
    renderServiciosCatalogView();
  }
  else if (view === 'equipo-lista') {
    getAndShow('equipo-lista-view-panel');
    const menuBtn = document.getElementById('menu-equipo');
    if (menuBtn) menuBtn.classList.add('active');
    renderEquipoListaView();
  }
  else if (view === 'clientes-lista') {
    getAndShow('clientes-lista-view-panel');
    const menuBtn = document.getElementById('menu-clientes-db');
    if (menuBtn) menuBtn.classList.add('active');
    renderClientesListaView();
  }
  else if (view === 'cuentas-cobrar') {
    getAndShow('cuentas-cobrar-view-panel');
    const menuBtn = document.getElementById('menu-cuentas');
    if (menuBtn) menuBtn.classList.add('active');
    renderCuentasCobrarView();
  }
  else if (view === 'vehiculos-lista') {
    getAndShow('vehiculos-lista-view-panel');
    const menuBtn = document.getElementById('menu-vehiculos-db');
    if (menuBtn) menuBtn.classList.add('active');
    renderVehiculosView();
  }
  else if (view === 'configuracion') {
    getAndShow('configuracion-view-panel');
    loadWorkshopConfig();
    if (typeof renderVehicleRegistryPanel === 'function') {
      renderVehicleRegistryPanel();
    }
  }

  // Asegurar que el enrutamiento defensivo no rompa clases antiguas
  const dashboardTabNav = document.getElementById('nav-dashboard-tab');
  const calendarTabNav = document.getElementById('nav-calendar-tab');
  if (dashboardTabNav) {
    if (view === 'tablero') dashboardTabNav.classList.add('active');
    else dashboardTabNav.classList.remove('active');
  }
  if (calendarTabNav) {
    if (view === 'calendario') calendarTabNav.classList.add('active');
    else calendarTabNav.classList.remove('active');
  }

  // Sincronizar el buscador global de la barra lateral con el buscador de la vista activa
  const sidebarSearch = document.getElementById('sidebar-search-input');
  if (sidebarSearch) {
    const val = sidebarSearch.value;
    const searchInputsMap = {
      'ordenes-trabajo': 'ot-search-input',
      'cotizaciones': 'cotizaciones-search-input',
      'servicios-catalogo': 'catalogo-servicios-search',
      'repuestos-catalogo': 'catalogo-repuestos-search',
      'equipo-lista': 'eq-search-input',
      'clientes-lista': 'cli-search-input',
      'cuentas-cobrar': 'cuentas-search-input',
      'vehiculos-lista': 'veh-search-input'
    };
    const activeInputId = searchInputsMap[view];
    if (activeInputId) {
      const activeInput = document.getElementById(activeInputId);
      if (activeInput) activeInput.value = val;
    }
  }

  renderApp();
};

window.handleSidebarSearch = function() {
  const sidebarSearch = document.getElementById('sidebar-search-input');
  if (!sidebarSearch) return;
  const val = sidebarSearch.value;

  // Sincronizar el valor al buscador de la vista activa
  const searchInputsMap = {
    'ordenes-trabajo': 'ot-search-input',
    'cotizaciones': 'cotizaciones-search-input',
    'servicios-catalogo': 'catalogo-servicios-search',
    'repuestos-catalogo': 'catalogo-repuestos-search',
    'equipo-lista': 'eq-search-input',
    'clientes-lista': 'cli-search-input',
    'cuentas-cobrar': 'cuentas-search-input',
    'vehiculos-lista': 'veh-search-input'
  };

  const activeInputId = searchInputsMap[currentView];
  if (activeInputId) {
    const activeInput = document.getElementById(activeInputId);
    if (activeInput) activeInput.value = val;
  }

  // Refrescar el renderizado de la vista activa
  if (currentView === 'tablero' || currentView === 'calendario') {
    renderKanban();
  } else if (currentView === 'vehiculos-ingresados') {
    renderVehiclesListTable();
  } else if (currentView === 'ordenes-trabajo') {
    renderOrdenesTrabajoView();
  } else if (currentView === 'cotizaciones') {
    renderCotizacionesTable();
  } else if (currentView === 'servicios-catalogo') {
    renderServiciosCatalogView();
  } else if (currentView === 'repuestos-catalogo') {
    renderRepuestosCatalogView();
  } else if (currentView === 'equipo-lista') {
    renderEquipoListaView();
  } else if (currentView === 'clientes-lista') {
    renderClientesListaView();
  } else if (currentView === 'cuentas-cobrar') {
    renderCuentasCobrarView();
  } else if (currentView === 'vehiculos-lista') {
    renderVehiculosView();
  }
};

// --- 3. RENDERIZADO DEL TABLERO KANBAN ---

function renderApp() {
  populateClientSelector();
  populateDatalists();
  renderKanban();
  if (currentView === 'calendario') {
    renderCalendar();
  } else if (currentView === 'reportes') {
    renderReportesView();
  } else if (currentView === 'vehiculos-ingresados') {
    renderVehiclesListTable();
  } else if (currentView === 'cotizaciones') {
    renderCotizacionesTable();
  } else if (currentView === 'agenda') {
    renderAgendaCalendar();
  } else if (currentView === 'ordenes-trabajo') {
    renderOrdenesTrabajoView();
  } else if (currentView === 'servicios-catalogo') {
    renderServiciosCatalogView();
  } else if (currentView === 'repuestos-catalogo') {
    renderRepuestosCatalogView();
  } else if (currentView === 'equipo-lista') {
    renderEquipoListaView();
  } else if (currentView === 'clientes-lista') {
    renderClientesListaView();
  } else if (currentView === 'cuentas-cobrar') {
    renderCuentasCobrarView();
  } else if (currentView === 'vehiculos-lista') {
    renderVehiculosView();
  }
  updateMetrics();
  initLucide();
}


function renderKanban() {
  const stages = ['recepcion', 'cotizacion', 'reparacion', 'listo'];
  
  const searchInput = document.getElementById('sidebar-search-input');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  stages.forEach(stage => {
    const listContainer = document.getElementById(`list-${stage}`);
    if (!listContainer) return;

    // Filtrar vehÃ­culos de la etapa actual
    let stageVehicles = vehicles.filter(v => v.stage === stage && !v.delivered);
    
    if (searchVal) {
      stageVehicles = stageVehicles.filter(v => {
        const isGolMock = v.id === 'mock-vehicle-gol-2026';
        const indexNum = isGolMock ? '2' : (v.id && v.id.length >= 2 ? v.id.substring(v.id.length - 2) : '01');
        const client = v.client ? v.client.toLowerCase() : '';
        const phone = v.clientPhone ? v.clientPhone.toLowerCase() : '';
        const plate = v.plate ? v.plate.toLowerCase() : '';
        const brand = v.brand ? v.brand.toLowerCase() : '';
        const model = v.model ? v.model.toLowerCase() : '';
        
        // Normalizar patentes para bÃºsqueda insensible a espacios, guiones o mayÃºsculas
        const normPlate = plate.replace(/[^a-z0-9]/g, '');
        const normSearch = searchVal.replace(/[^a-z0-9]/g, '');
        
        return client.includes(searchVal) || 
               phone.includes(searchVal) || 
               plate.includes(searchVal) || 
               (normPlate && normSearch && normPlate.includes(normSearch)) ||
               brand.includes(searchVal) || 
               model.includes(searchVal) ||
               `#${indexNum}`.includes(searchVal);
      });
    }
    
    // Actualizar contadores de columna
    document.getElementById(`count-${stage}`).textContent = stageVehicles.length;

    // Si no hay tarjetas, mostrar estado vacÃ­o (excepto en recepciÃ³n que tiene el botÃ³n dashed)
    if (stageVehicles.length === 0) {
      if (stage === 'recepcion') {
        listContainer.innerHTML = '';
      } else {
        listContainer.innerHTML = `
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <span>Sin registros</span>
          </div>
        `;
      }
      return;
    }

    // Renderizar tarjetas
    listContainer.innerHTML = stageVehicles.map(vehicle => {
      const isGolMock = vehicle.id === 'mock-vehicle-gol-2026';
      const indexNum = isGolMock ? '2' : vehicle.id.substring(vehicle.id.length - 2, vehicle.id.length);
      return `
        <div class="vehicle-card" id="card-${vehicle.id}" draggable="true" ondragstart="handleDragStart(event, '${vehicle.id}')" ondragend="handleDragEnd(event, '${vehicle.id}')">
          <div class="card-top">
            <span class="license-plate">${vehicle.plate}</span>
            <span class="elapsed-time">
              <i data-lucide="clock"></i>
              <span class="elapsed-time-value" data-entry-time="${vehicle.entryTime}">Calculando...</span>
            </span>
          </div>
          
          <div class="card-middle" onclick="openDetailedReceptionFromKanban('${vehicle.id}')" style="cursor: pointer;">
            <span class="entry-badge">Ingreso # ${indexNum}</span>
            <h4 class="vehicle-name" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
              <span>${vehicle.brand} ${vehicle.model}</span>
              ${vehicle.stage === 'cotizacion' ? `
                <span class="quote-status-badge" style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background-color: ${vehicle.quoteCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)'}; color: ${vehicle.quoteCompleted ? 'var(--color-listo)' : 'var(--text-secondary)'}; transition: all 0.2s;">
                  ${vehicle.quoteCompleted ? 'Cotización aprobada' : 'Cotización pendiente'}
                </span>
              ` : ''}
            </h4>
            <div class="responsible-info" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <i data-lucide="user"></i>
                <span>${vehicle.client}</span>
              </div>
              ${vehicle.stage === 'cotizacion' ? `
                <label class="ios-switch" style="flex-shrink: 0; width: 34px; height: 20px; scale: 0.8; margin-right: -4px;" onclick="event.stopPropagation();">
                  <input type="checkbox" ${vehicle.quoteCompleted ? 'checked' : ''} onchange="toggleQuoteApproval(event, '${vehicle.id}')" onclick="event.stopPropagation();">
                  <span class="switch-slider" style="border-radius: 20px; ${vehicle.quoteCompleted ? 'background-color: var(--color-listo) !important;' : ''}"></span>
                </label>
              ` : ''}
            </div>
          </div>
          
          <div class="card-bottom">
            ${vehicle.stage === 'listo' ? `
              <button class="view-quote-btn" onclick="openDetailedDeliveryView('${vehicle.id}')" style="color: var(--color-listo);">
                <i data-lucide="check-circle" style="width: 14px; color: var(--color-listo);"></i>
                Gestionar Entrega
              </button>
            ` : vehicle.stage === 'reparacion' ? `
              <button class="view-quote-btn" onclick="openDetailedWorkOrderView('${vehicle.id}')" style="color: var(--color-reparacion);">
                <i data-lucide="wrench" style="width: 14px; color: var(--color-reparacion);"></i>
                Ver Orden de Trabajo
              </button>
            ` : vehicle.stage === 'recepcion' ? (() => {
                const hasServices = typeof vehicle.services === 'string' ? vehicle.services.trim().length > 0 : (vehicle.services || []).length > 0;
                const isReceptionCreated = vehicle.kilometers > 0 || hasServices;
                if (!isReceptionCreated) {
                  return `
                    <button class="view-quote-btn" onclick="openDetailedReceptionFromCard('${vehicle.id}')" style="color: var(--color-recepcion);">
                      <i data-lucide="clipboard-check" style="width: 14px; color: var(--color-recepcion);"></i>
                      Registrar Recepción
                    </button>
                  `;
                } else {
                  return `
                    <button class="view-quote-btn" onclick="openDetailedReceptionFromCard('${vehicle.id}')" style="color: var(--color-recepcion);">
                      <i data-lucide="clipboard-check" style="width: 14px; color: var(--color-recepcion);"></i>
                      Editar recepcion
                    </button>
                  `;
                }
              })() : `
              <button class="view-quote-btn" onclick="openDetailedQuoteView('${vehicle.id}')" style="color: var(--color-cotizacion);">
                <i data-lucide="file-spreadsheet" style="width: 14px; color: var(--color-cotizacion);"></i>
                ${vehicle.quoteCompleted ? 'Ver Cotización' : 'Crear Cotización'}
              </button>
            `}
            <button class="card-actions-btn" onclick="openContextMenu(event, '${vehicle.id}', '${vehicle.stage}')">
              <i data-lucide="more-horizontal"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  });
  renderProximasCitas();
}

window.openDetailedReceptionFromKanban = function(vehicleId) {
  openDetailedReception(vehicleId);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (vehicle) {
    if (vehicle.stage === 'recepcion') {
      setActiveTab('reception');
    } else if (vehicle.stage === 'cotizacion') {
      setActiveTab('quote');
    } else if (vehicle.stage === 'reparacion') {
      setActiveTab('workorder');
    }
  }
};

window.openDetailedReceptionFromCard = function(vehicleId) {
  openDetailedReception(vehicleId);
  setActiveTab('reception');
};

// --- 4. DRAG AND DROP NATIVO ---

window.handleDragStart = function(e, vehicleId) {
  e.dataTransfer.setData('text/plain', vehicleId);
  const card = document.getElementById(`card-${vehicleId}`);
  if (card) {
    setTimeout(() => card.classList.add('dragging'), 0);
  }
};

window.handleDragEnd = function(e, vehicleId) {
  const card = document.getElementById(`card-${vehicleId}`);
  if (card) {
    card.classList.remove('dragging');
  }
};

window.allowDrop = function(e) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.add('drag-over');
};

window.dragLeave = function(e) {
  const column = e.currentTarget;
  column.classList.remove('drag-over');
};

window.handleDrop = function(e, targetStage) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.remove('drag-over');
  
  const vehicleId = e.dataTransfer.getData('text/plain');
  const vehicleIndex = vehicles.findIndex(v => String(v.id) === String(vehicleId));
  
  if (vehicleIndex !== -1) {
    vehicles[vehicleIndex].stage = targetStage;
    
    // Si se mueve a CotizaciÃ³n y no tenÃ­a valor, le asignamos uno simulado para mantener consistencia
    if (targetStage === 'cotizacion' && vehicles[vehicleIndex].value === 0) {
      vehicles[vehicleIndex].value = 90000;
    }
    
    saveState();
    renderApp();
  }
};

// --- 5. TEMPORIZADORES EN VIVO ---

function startGlobalTimer() {
  updateAllElapsedTimes();
  setInterval(updateAllElapsedTimes, 1000);
}

function updateAllElapsedTimes() {
  const timerElements = document.querySelectorAll('.elapsed-time-value');
  
  timerElements.forEach(el => {
    const entryTime = parseInt(el.getAttribute('data-entry-time'), 10);
    if (!entryTime) return;
    
    const diffMs = Date.now() - entryTime;
    const totalSecs = Math.floor(diffMs / 1000);
    const secs = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const mins = totalMins % 60;
    const hours = Math.floor(totalMins / 60);
    
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}h ${mins}m`;
    } else if (mins > 0) {
      timeStr = `${mins}m ${secs}s`;
    } else {
      timeStr = `${secs}s`;
    }
    
    el.textContent = timeStr;
  });
}

// --- 6. CÃLCULO DE MÃ‰TRICAS DEL HEADER ---

function updateMetrics() {
  const totalIncome = vehicles
    .filter(v => v.delivered || (v.stage === 'listo' && v.delivered))
    .reduce((sum, v) => sum + (Number(v.value) || 0), 0);

  const totalQuoted = vehicles
    .filter(v => !v.delivered)
    .reduce((sum, v) => sum + (Number(v.value) || 0), 0);
    
  const deliveredCount = vehicles.filter(v => v.delivered).length;

  const totalIncomeEl = document.getElementById('metric-total-income');
  const totalQuotedEl = document.getElementById('metric-total-quoted');
  const deliveredCountEl = document.getElementById('metric-delivered-count');

  if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
  if (totalQuotedEl) totalQuotedEl.textContent = formatCurrency(totalQuoted);
  if (deliveredCountEl) deliveredCountEl.textContent = deliveredCount;
}

function formatCurrency(amount) {
  if (amount === 0) return '$0';
  const hasDecimals = amount % 1 !== 0;
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(amount);
  return formatted.replace('ARS', '').trim();
}

// --- 7. ALIMENTAR BASE DE CLIENTES EN EL SELECTOR ---

window.populateClientSelector = function() {
  // Autocomplete is built dynamically on type
  renderClientDropdown('');
};

window.renderClientDropdown = function(query) {
  const dropdown = document.getElementById('client-dropdown');
  if (!dropdown) return;

  const q = query.toLowerCase();
  const raw = query.trim();
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
  );

  let html = '';

  if (raw) {
    const escapedRaw = raw.replace(/'/g, "\\'");
    html += `
    <div class="client-opt client-opt-create" onmousedown="useTypedName('${escapedRaw}')">
      <span style="font-weight: 700; color: var(--color-accent);">${raw}</span>
      <span style="font-size: 11px; color: var(--text-muted);">Usar este nombre</span>
    </div>`;
  }

  filtered.forEach(c => {
    html += `
    <div class="client-opt" onmousedown="selectClient('${c.id}', '${c.name.replace(/'/g,"\\'")}')">
      <span style="font-weight: 600;">${c.name}</span>
      <span style="font-size: 11px; color: var(--text-muted);">${c.phone || ''}</span>
    </div>`;
  });

  if (!raw && filtered.length === 0) {
    html += `<div style="padding: 10px 14px; color: var(--text-muted); font-size: 12px;">Escribe para buscar...</div>`;
  }

  dropdown.innerHTML = html;
};

window.openClientDropdown = function() {
  const dropdown = document.getElementById('client-dropdown');
  if (!dropdown) return;
  const q = document.getElementById('form-client-search').value;
  renderClientDropdown(q);
  dropdown.style.display = 'block';
};

window.handleClientNameInput = function(inputEl) {
  renderClientDropdown(inputEl.value);
  // Clear the current client ID selection to allow creating a new client with this name
  document.getElementById('form-client-select').value = '';
};

window.delayCloseClientDropdown = function() {
  setTimeout(() => {
    const dropdown = document.getElementById('client-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  }, 180);
};

window.selectClient = function(id, name) {
  document.getElementById('form-client-search').value = name;
  document.getElementById('form-client-select').value  = id;

  const client = clients.find(c => String(c.id) === String(id));
  if (client) {
    document.getElementById('form-nc-phone').value = client.phone || '';
    document.getElementById('form-nc-email').value = client.email || '';
    
    // Campos fiscales del cliente
    const cuitEl = document.getElementById('form-client-cuit');
    if (cuitEl) cuitEl.value = client.cuit || '';
    
    const ivaEl = document.getElementById('form-client-iva');
    if (ivaEl) ivaEl.value = client.ivaCondition || 'Consumidor Final';
    
    const addressEl = document.getElementById('form-client-address');
    if (addressEl) addressEl.value = client.address || '';
  }

  const dropdown = document.getElementById('client-dropdown');
  if (dropdown) dropdown.style.display = 'none';
};

window.useTypedName = function(name) {
  document.getElementById('form-client-search').value = name;
  document.getElementById('form-client-select').value = '';
  const el = document.getElementById('form-nc-phone');
  if (el) el.focus();
  const d = document.getElementById('client-dropdown');
  if (d) d.style.display = 'none';
};

// --- 8. AUTOCUMPLEADO DE VEHÃCULO Y REGLAS DE PATENTE ---

window.autoFormatPlateInput = function(inputEl) {
  let val = inputEl.value.toUpperCase().trim();
  let clean = val.replace(/\s+/g, '');
  
  // Formato 2: ABC123 -> ABC 123
  if (/^[A-Z]{3}\d{3}$/.test(clean)) {
    inputEl.value = clean.slice(0, 3) + ' ' + clean.slice(3);
    return;
  }
  
  // Formato 1: AB123CD -> AB 123 CD
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean)) {
    inputEl.value = clean.slice(0, 2) + ' ' + clean.slice(2, 5) + ' ' + clean.slice(5);
    return;
  }
  
  // Formato 3: A123BCD -> A12 3BCD (Motos)
  if (/^[A-Z]\d{3}[A-Z]{3}$/.test(clean)) {
    inputEl.value = clean.slice(0, 3) + ' ' + clean.slice(3);
    return;
  }
};

window.validatePlateFormat = function(plate) {
  const p1 = /^[A-Z]{2} \d{3} [A-Z]{2}$/;
  const p2 = /^[A-Z]{3} \d{3}$/;
  const p3 = /^[A-Z]\d{2} \d[A-Z]{3}$/;
  return p1.test(plate) || p2.test(plate) || p3.test(plate);
};

window.renderVehicleDropdown = function(query) {
  const dropdown = document.getElementById('vehicle-dropdown');
  if (!dropdown) return;

  const q = query.toLowerCase().replace(/\s+/g, '');
  const raw = query.toUpperCase().trim();

  // Filter vehicles by plate, brand, or model
  const filtered = vehicles.filter(v =>
    v.plate.replace(/\s+/g, '').toLowerCase().includes(q) ||
    (v.brand && v.brand.toLowerCase().includes(q)) ||
    (v.model && v.model.toLowerCase().includes(q))
  );

  let html = '';

  if (raw) {
    html += `
    <div class="client-opt client-opt-create" onmousedown="useTypedPlate('${raw}')">
      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-accent);">${raw}</span>
      <span style="font-size: 11px; color: var(--text-muted);">Usar esta patente</span>
    </div>`;
  }

  const platesSeen = new Set();
  filtered.forEach(v => {
    if (platesSeen.has(v.plate.toUpperCase())) return;
    platesSeen.add(v.plate.toUpperCase());

    html += `
    <div class="client-opt" onmousedown="selectVehicle('${v.id}')">
      <span style="font-weight: 600; font-family: var(--font-mono);">${v.plate}</span>
      <span style="font-size: 11px; color: var(--text-muted);">${v.brand || ''} ${v.model || ''} ${v.year || ''}</span>
    </div>`;
  });

  if (!raw && filtered.length === 0) {
    html += `<div style="padding: 10px 14px; color: var(--text-muted); font-size: 12px;">Escribe una patente para buscar...</div>`;
  }

  dropdown.innerHTML = html;
};

window.useTypedPlate = function(plate) {
  const input = document.getElementById('form-plate');
  input.value = plate;
  autoFormatPlateInput(input);
  document.getElementById('form-vehicle-id').value = '';
  
  // Re-check if exact vehicle exists after auto-formatting
  const cleanPlate = input.value.replace(/\s+/g, '').toUpperCase();
  const matched = vehicles.find(v => v.plate.replace(/\s+/g, '').toUpperCase() === cleanPlate);
  if (matched) {
    selectVehicle(matched.id);
  } else {
    // Clear fields
    document.getElementById('form-brand').value = '';
    document.getElementById('form-model').value = '';
    document.getElementById('form-year').value = '';
    document.getElementById('form-color').value = '';
    document.getElementById('form-motor').value = '';
    const el = document.getElementById('form-year');
    if (el) el.focus();
  }
  
  const d = document.getElementById('vehicle-dropdown');
  if (d) d.style.display = 'none';
};

window.openVehicleDropdown = function() {
  const dropdown = document.getElementById('vehicle-dropdown');
  if (!dropdown) return;
  renderVehicleDropdown(document.getElementById('form-plate').value);
  dropdown.style.display = 'block';
};

window.handlePlateInput = function(inputEl) {
  inputEl.value = inputEl.value.toUpperCase();
  renderVehicleDropdown(inputEl.value);
  
  // Auto-complete if they type the exact plate (case & space insensitive)
  const cleanTyped = inputEl.value.replace(/\s+/g, '');
  const matchedVehicle = vehicles.find(v => v.plate.replace(/\s+/g, '').toUpperCase() === cleanTyped);
  
  if (matchedVehicle) {
    // Solo pre-rellenar datos del vehiculo para comodidad, pero no actualizar el registro existente
    document.getElementById('form-vehicle-id').value = ''; // Siempre crear nuevo registro
    document.getElementById('form-brand').value = matchedVehicle.brand || '';
    document.getElementById('form-model').value = matchedVehicle.model || '';
    document.getElementById('form-year').value = matchedVehicle.year || '';
    document.getElementById('form-color').value = matchedVehicle.color || '';
    document.getElementById('form-motor').value = matchedVehicle.motor || '';
    
    if (matchedVehicle.client) {
      const client = clients.find(c => c.name.trim().toLowerCase() === matchedVehicle.client.trim().toLowerCase());
      if (client) {
        selectClient(client.id, client.name);
      } else {
        document.getElementById('form-client-search').value = matchedVehicle.client;
        document.getElementById('form-nc-phone').value = matchedVehicle.clientPhone || '';
        document.getElementById('form-nc-email').value = matchedVehicle.clientEmail || '';
      }
    }
  } else {
    document.getElementById('form-vehicle-id').value = '';
  }
};

window.handlePlateBlur = function(inputEl) {
  autoFormatPlateInput(inputEl);
  
  const cleanTyped = inputEl.value.replace(/\s+/g, '');
  const matchedVehicle = vehicles.find(v => v.plate.replace(/\s+/g, '').toUpperCase() === cleanTyped);
  
  if (matchedVehicle) {
    // Solo pre-rellenar datos, nunca actualizar registro existente
    document.getElementById('form-vehicle-id').value = '';
    document.getElementById('form-brand').value = matchedVehicle.brand || '';
    document.getElementById('form-model').value = matchedVehicle.model || '';
    document.getElementById('form-year').value = matchedVehicle.year || '';
    document.getElementById('form-color').value = matchedVehicle.color || '';
    document.getElementById('form-motor').value = matchedVehicle.motor || '';
    
    if (matchedVehicle.client) {
      const client = clients.find(c => c.name.trim().toLowerCase() === matchedVehicle.client.trim().toLowerCase());
      if (client) {
        selectClient(client.id, client.name);
      } else {
        document.getElementById('form-client-search').value = matchedVehicle.client;
        document.getElementById('form-nc-phone').value = matchedVehicle.clientPhone || '';
        document.getElementById('form-nc-email').value = matchedVehicle.clientEmail || '';
      }
    }
  }
  
  delayCloseVehicleDropdown();
};

window.delayCloseVehicleDropdown = function() {
  setTimeout(() => {
    const d = document.getElementById('vehicle-dropdown');
    if (d) d.style.display = 'none';
  }, 180);
};

window.selectVehicle = function(id) {
  const v = vehicles.find(veh => String(veh.id) === String(id));
  if (v) {
    // Pre-rellenar datos del vehiculo, pero siempre crear registro nuevo
    document.getElementById('form-vehicle-id').value = '';
    document.getElementById('form-plate').value = v.plate;
    document.getElementById('form-brand').value = v.brand || '';
    document.getElementById('form-model').value = v.model || '';
    document.getElementById('form-year').value = v.year || '';
    document.getElementById('form-color').value = v.color || '';
    document.getElementById('form-motor').value = v.motor || '';
    
    if (v.client) {
      const client = clients.find(c => c.name.trim().toLowerCase() === v.client.trim().toLowerCase());
      if (client) {
        selectClient(client.id, client.name);
      } else {
        document.getElementById('form-client-search').value = v.client;
        document.getElementById('form-nc-phone').value = v.clientPhone || '';
        document.getElementById('form-nc-email').value = v.clientEmail || '';
      }
    }
  }
  const d = document.getElementById('vehicle-dropdown');
  if (d) d.style.display = 'none';
};

window.populateAutocompleteDatalists = function() {
  const brandVal = document.getElementById('form-brand') ? document.getElementById('form-brand').value.trim().toLowerCase() : '';
  const modelVal = document.getElementById('form-model') ? document.getElementById('form-model').value.trim().toLowerCase() : '';

  // Brands suggestions: show all
  const brandsList = document.getElementById('brands-suggestions');
  if (brandsList) {
    brandsList.innerHTML = vehicleRegistry.brands.map(b => `<option value="${b}">`).join('');
  }

  // Models suggestions: filter by selected brand (if any)
  const modelsList = document.getElementById('models-suggestions');
  if (modelsList) {
    let filteredModels = [];
    if (brandVal) {
      filteredModels = vehicleRegistry.models
        .filter(m => typeof m === 'object' && m.brand && m.brand.toLowerCase() === brandVal)
        .map(m => m.name);
    } else {
      filteredModels = vehicleRegistry.models.map(m => typeof m === 'object' ? m.name : m);
    }
    const uniqueModels = [...new Set(filteredModels)].filter(Boolean);
    modelsList.innerHTML = uniqueModels.map(m => `<option value="${m}">`).join('');
  }

  // Engines suggestions: filter by selected model (if any)
  const enginesList = document.getElementById('engines-suggestions');
  if (enginesList) {
    let filteredEngines = [];
    if (modelVal) {
      filteredEngines = vehicleRegistry.engines
        .filter(e => typeof e === 'object' && e.model && e.model.toLowerCase() === modelVal)
        .map(e => e.name);
    } else {
      filteredEngines = vehicleRegistry.engines.map(e => typeof e === 'object' ? e.name : e);
    }
    const uniqueEngines = [...new Set(filteredEngines)].filter(Boolean);
    enginesList.innerHTML = uniqueEngines.map(e => `<option value="${e}">`).join('');
  }
};

// --- 9. GESTIÃ“N DEL MODAL DE REGISTRO E INGRESOS ---

window.openAddVehicleModal = function(defaultStage = 'recepcion') {
  // Resetear Formulario
  document.getElementById('vehicle-form').reset();
  document.getElementById('form-vehicle-id').value = '';
  document.getElementById('form-client-select').value = '';
  
  // Poblar datalists
  populateAutocompleteDatalists();
  
  // Abrir Modal
  document.getElementById('vehicle-modal').classList.add('open');
  document.getElementById('form-plate').focus();
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('open');
};

// AcciÃ³n: RECEPCIONAR / GUARDAR
window.handleVehicleFormSubmit = function(e) {
  e.preventDefault();

  const plateInput = document.getElementById('form-plate');
  autoFormatPlateInput(plateInput);

  const plateVal  = plateInput.value.trim();
  const brandVal  = document.getElementById('form-brand').value.trim();
  const modelVal  = document.getElementById('form-model').value.trim();
  const yearVal   = document.getElementById('form-year').value.trim();
  const colorVal  = document.getElementById('form-color').value.trim();
  const motorVal  = document.getElementById('form-motor').value.trim();
  const mileageInput = document.getElementById('form-mileage');
  const mileageVal = mileageInput ? parseInt(mileageInput.value) || 0 : 0;
  const vinInput = document.getElementById('form-vin');
  const vinVal = vinInput ? vinInput.value.trim() : '';

  if (!plateVal) {
    alert('Por favor, ingresa la patente del vehículo.');
    return;
  }

  // Validar nomenclatura de patentes argentinas
  if (!validatePlateFormat(plateVal)) {
    const confirmPlate = confirm(`La patente ingresada "${plateVal}" no coincide con los formatos estÃ¡ndar de Argentina:\n- AB 123 CD\n- ABC 123\n- A12 3BCD\n\nÂ¿EstÃ¡s seguro que deseas continuar?`);
    if (!confirmPlate) return;
  }

  // Comprobación de duplicados de patente activa
  const cleanPlate = plateVal.replace(/\s+/g, '').toUpperCase();
  let formVehicleId = document.getElementById('form-vehicle-id').value;

  const duplicateVehicle = vehicles.find(v => 
    v.plate.replace(/\s+/g, '').toUpperCase() === cleanPlate && 
    String(v.id) !== String(formVehicleId)
  );

  if (duplicateVehicle) {
    if (!duplicateVehicle.delivered) {
      alert(`El vehículo con la patente "${plateVal}" ya se encuentra activo en el taller en la etapa de "${duplicateVehicle.stage === 'recepcion' ? 'Recepción' : duplicateVehicle.stage === 'cotizacion' ? 'Cotización' : 'Reparación'}".`);
      return;
    }
  }

  // Manejo de Clientes y Homónimos
  const clientSearchName = document.getElementById('form-client-search').value.trim();
  const typedPhone = document.getElementById('form-nc-phone').value.trim();
  const typedEmail = document.getElementById('form-nc-email').value.trim() || '—';
  let clientId = document.getElementById('form-client-select').value;
  let client = null;

  // Buscar si existe un cliente con este nombre (insensible a mayúsculas/minúsculas)
  const existingClient = clients.find(c => c.name.trim().toLowerCase() === clientSearchName.toLowerCase());

  if (existingClient) {
    const phoneMatches = (existingClient.phone || '').trim() === typedPhone;
    const emailMatches = (existingClient.email || '—').trim() === typedEmail;

    if (phoneMatches && emailMatches) {
      // Si coinciden perfectamente los contactos, asumimos que es el mismo cliente y lo vinculamos
      clientId = existingClient.id;
    } else {
      // Si el teléfono no está escrito aún o no coincide (y/o el mail),
      // consideramos que puede ser un homónimo (un nuevo cliente con igual nombre)
      if (window.confirmedHomonymName !== clientSearchName) {
        const confirmNewClient = confirm(`El nombre que introduciste ("${clientSearchName}") es igual al nombre de otro cliente existente, pero los datos de contacto no coinciden o están incompletos.\n\n¿Estás seguro que querés crear un nuevo cliente con este nombre?\n(Si presionas Aceptar, podrás completar o corregir el Teléfono y Correo antes de guardar haciendo clic en "Recepcionar" de nuevo. Si presionas Cancelar, podrás buscar el cliente existente).`);
        if (!confirmNewClient) return;

        // Detenemos la sumisión actual para dejarle completar Teléfono y Correo
        window.confirmedHomonymName = clientSearchName;
        alert("Confirmado. Ahora puedes verificar o completar el Teléfono y Correo Electrónico del nuevo cliente, y hacer clic en \"Recepcionar\" nuevamente para confirmar el ingreso.");
        return;
      }
      
      // Si ya confirmó la creación del homónimo, forzamos creación de nuevo cliente (vaciamos clientId)
      clientId = '';
    }
  }

  // Leer campos fiscales del cliente del formulario
  const typedClientCuit = document.getElementById('form-client-cuit') ? document.getElementById('form-client-cuit').value.trim() : '';
  const typedClientIva = document.getElementById('form-client-iva') ? document.getElementById('form-client-iva').value : 'Consumidor Final';
  const typedClientAddress = document.getElementById('form-client-address') ? document.getElementById('form-client-address').value.trim() : '';

  if (clientId) {
    client = clients.find(c => String(c.id) === String(clientId));
    if (client) {
      // Actualizar datos del cliente existente
      client.phone = typedPhone;
      client.email = typedEmail;
      if (typedClientCuit) client.cuit = typedClientCuit;
      if (typedClientIva) client.ivaCondition = typedClientIva;
      if (typedClientAddress) client.address = typedClientAddress;
      saveClients();
    }
  }

  if (!client) {
    if (!clientSearchName) {
      alert('Por favor, selecciona un cliente existente o ingresa el nombre de un nuevo cliente.');
      return;
    }

    // Crear nuevo cliente
    const newClientId = 'c-' + Date.now();
    const newClient = {
      id: newClientId,
      name: clientSearchName,
      phone: typedPhone,
      email: typedEmail,
      cuit: typedClientCuit || '99-99999999-9',
      ivaCondition: typedClientIva || 'Consumidor Final',
      address: typedClientAddress || 'Sin Dirección'
    };
    clients.push(newClient);
    saveClients();
    client = newClient;
    clientId = newClientId;
  }

  // Registrar en el catalogo de marcas/modelos/motores
  addToVehicleRegistry(brandVal, modelVal, motorVal);

  // Si estamos editando un vehículo existente, actualizamos sus datos en lugar de crear una nueva ficha
  if (formVehicleId) {
    const vehicleIndex = vehicles.findIndex(v => String(v.id) === String(formVehicleId));
    if (vehicleIndex !== -1) {
      const vehicle = vehicles[vehicleIndex];
      vehicle.plate = plateVal;
      vehicle.brand = brandVal;
      vehicle.model = modelVal;
      vehicle.year = yearVal;
      vehicle.color = colorVal;
      vehicle.motor = motorVal;
      vehicle.kilometers = mileageVal;
      vehicle.vin = vinVal;

      // Registrar propietario anterior en historial si cambia
      const prevOwner = vehicle.client;
      if (prevOwner && prevOwner.trim().toLowerCase() !== client.name.trim().toLowerCase()) {
        if (!vehicle.ownerHistory) vehicle.ownerHistory = [];
        if (!vehicle.ownerHistory.find(o => o.name.trim().toLowerCase() === prevOwner.trim().toLowerCase())) {
          vehicle.ownerHistory.push({ name: prevOwner });
        }
      }

      vehicle.client = client.name;
      vehicle.clientPhone = client.phone;
      vehicle.clientEmail = client.email;
      vehicle.clientCuit = client.cuit || typedClientCuit || '99-99999999-9';
      vehicle.clientIva = client.ivaCondition || typedClientIva || 'Consumidor Final';
      vehicle.clientAddress = client.address || typedClientAddress || 'Sin Direccion';

      saveState();
      closeModal('vehicle-modal');
      renderApp();
      return;
    }
  }

  // Siempre crear una nueva ficha de trabajo (nuevo ingreso)
  // Recuperar historial de propietarios del vehiculo mas reciente con la misma patente
  const prevRecords = vehicles
    .filter(v => v.plate.replace(/\s+/g, '').toUpperCase() === cleanPlate)
    .sort((a, b) => (b.entryTime || 0) - (a.entryTime || 0));
  const mostRecent = prevRecords[0];

  // Construir historial de propietarios heredado
  let inheritedOwnerHistory = mostRecent ? [...(mostRecent.ownerHistory || [])] : [];
  if (mostRecent && mostRecent.client && mostRecent.client !== client.name) {
    // El ultimo dueno del vehiculo pasa al historial si es distinto del nuevo propietario
    if (!inheritedOwnerHistory.find(o => o.name === mostRecent.client)) {
      inheritedOwnerHistory.push({ name: mostRecent.client });
    }
  }

  const newId = 'v-' + Date.now();
  const newVehicle = {
    id: newId,
    plate: plateVal,
    brand: brandVal,
    model: modelVal,
    year: yearVal,
    color: colorVal,
    motor: motorVal,
    vin: vinVal,
    client: client.name,
    clientPhone: client.phone,
    clientEmail: client.email,
    clientCuit: client.cuit || typedClientCuit || '99-99999999-9',
    clientIva: client.ivaCondition || typedClientIva || 'Consumidor Final',
    clientAddress: client.address || typedClientAddress || 'Sin Direccion',
    ownerHistory: inheritedOwnerHistory,
    stage: 'recepcion',
    value: 0,
    entryDate: new Date().toISOString().split('T')[0],
    entryTime: Date.now(),
    delivered: false,
    kilometers: mileageVal,
    fuelLevel: '1/2',
    services: [],
    hasDetails: false,
    detailsNotes: ''
  };

  vehicles.push(newVehicle);
  saveState();
  closeModal('vehicle-modal');
  renderApp(); // Añadido para actualizar el tablero Kanban inmediatamente
  openDetailedReception(newId);
};


// --- 10. LÃ“GICA DE LA FICHA TÃ‰CNICA DE RECEPCIÃ“N (FOTO 2) ---

window.openDetailedReception = function(vehicleId, isReadOnly = false) {
  window.isDetailedViewReadOnly = isReadOnly;
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;

  activeReceptionVehicleId = vehicle.id;
  
  const downloadBtn = document.getElementById('btn-download-pdf-quote');
  const waQuoteBtn = document.getElementById('btn-whatsapp-quote');
  const invoiceContainer = document.getElementById('container-download-invoice');
  if (downloadBtn) {
    const hasQuoteItems = (vehicle.quoteServices && vehicle.quoteServices.length > 0) || (vehicle.quoteParts && vehicle.quoteParts.length > 0);
    const isQuoteStageOrLater = ['cotizacion', 'reparacion', 'listo'].includes(vehicle.stage);
    const shouldShow = hasQuoteItems || isQuoteStageOrLater;
    downloadBtn.style.display = shouldShow ? 'flex' : 'none';
    if (waQuoteBtn) waQuoteBtn.style.display = shouldShow ? 'flex' : 'none';
    if (invoiceContainer) invoiceContainer.style.display = shouldShow ? 'inline-block' : 'none';
  }

  activeReceptionServices = typeof vehicle.services === 'string' ? vehicle.services : (vehicle.services || []).join('\n');
  
  // Cargar datos de cotización en arrays de trabajo
  activeQuoteServices = [...(vehicle.quoteServices || [])];
  activeQuoteParts = [...(vehicle.quoteParts || [])];

  // Rellenar Ficha Técnica (Foto 2)
  const isGolMock = vehicle.id === 'mock-vehicle-gol-2026';
  const indexNum = isGolMock ? '2' : vehicle.id.substring(vehicle.id.length - 2, vehicle.id.length);
  const detPlate = document.getElementById('det-vehicle-plate');
  if (detPlate) detPlate.textContent = vehicle.plate;
  
  const detClientName = document.getElementById('det-client-name');
  if (detClientName) detClientName.textContent = vehicle.client;
  
  const detClientPhone = document.getElementById('det-client-phone');
  if (detClientPhone) detClientPhone.textContent = vehicle.clientPhone || '-';
  
  const detClientEmail = document.getElementById('det-client-email');
  if (detClientEmail) detClientEmail.textContent = vehicle.clientEmail || '-';
  
  // Poblar nuevos datos del vehículo en el sidebar de la izquierda
  const detVehicleNameSidebar = document.getElementById('det-vehicle-name-sidebar');
  if (detVehicleNameSidebar) {
    const motorStr = vehicle.motor ? ` · Motor: ${vehicle.motor}` : '';
    detVehicleNameSidebar.textContent = `${vehicle.brand} ${vehicle.model} · ${vehicle.year}${motorStr}`;
  }
  const detVehiclePlateSidebar = document.getElementById('det-vehicle-plate-sidebar');
  if (detVehiclePlateSidebar) {
    detVehiclePlateSidebar.textContent = vehicle.plate;
  }
  const detVehicleKmSidebar = document.getElementById('det-vehicle-km-sidebar');
  if (detVehicleKmSidebar) {
    detVehicleKmSidebar.textContent = vehicle.kilometers ? `${vehicle.kilometers.toLocaleString('es-AR')} km` : 'Sin registrar';
  }

  // Opciones de Odometer & Fuel
  const detKm = document.getElementById('det-km');
  if (detKm) detKm.value = vehicle.kilometers || '';
  
  const detFuel = document.getElementById('det-fuel');
  if (detFuel) detFuel.value = vehicle.fuelLevel || '1/2';
  
  // Servicios e interruptor de detalles estéticos
  document.getElementById('det-service-description').value = activeReceptionServices;
  document.getElementById('det-details-toggle').checked = vehicle.hasDetails || false;
  document.getElementById('det-details-notes').value = vehicle.detailsNotes || '';
  toggleDetailsArea();
  
  // Cargar inputs del presupuesto
  document.getElementById('calc-discount').value = vehicle.discountPercent || 0;
  document.getElementById('calc-vat-inclusive').checked = vehicle.vatInclusive !== false;
  document.getElementById('quote-notes').value = vehicle.quoteNotes || '';
  document.getElementById('quote-send-email').checked = vehicle.quoteSendEmail || false;
  
  updateCalculatedTotals();
  updateTabStatuses(vehicle);

  // Sincronizar switch de cotización en el footer del panel
  const quoteSwitch = document.getElementById('input-approve-quote-switch');
  const quoteSwitchLabel = document.getElementById('label-approve-quote-switch');
  if (quoteSwitch) {
    quoteSwitch.checked = vehicle.quoteCompleted || false;
    const slider = quoteSwitch.nextElementSibling;
    if (slider) {
      if (vehicle.quoteCompleted) {
        slider.style.setProperty('background-color', 'var(--color-listo)', 'important');
      } else {
        slider.style.removeProperty('background-color');
      }
    }
  }
  if (quoteSwitchLabel) {
    quoteSwitchLabel.textContent = vehicle.quoteCompleted ? 'Cotización aprobada' : 'Cotización pendiente';
    quoteSwitchLabel.style.color = vehicle.quoteCompleted ? 'var(--color-listo)' : 'var(--text-primary)';
  }

  // --- Habilitación / Inhabilitación del Certificado de Entrega ---
  const deliveryBtn = document.getElementById('btn-download-pdf-delivery');
  const waDeliveryBtn = document.getElementById('btn-whatsapp-delivery');
  if (deliveryBtn) {
    const hasQuoteItems = (vehicle.quoteServices && vehicle.quoteServices.length > 0) || (vehicle.quoteParts && vehicle.quoteParts.length > 0);
    const isQuoteStageOrLater = ['cotizacion', 'reparacion', 'listo', 'entregado'].includes(vehicle.stage);
    const shouldShow = hasQuoteItems || isQuoteStageOrLater;
    deliveryBtn.style.display = shouldShow ? 'flex' : 'none';
    if (waDeliveryBtn) waDeliveryBtn.style.display = shouldShow ? 'flex' : 'none';
    
    if (vehicle.stage === 'listo' || vehicle.stage === 'entregado' || vehicle.delivered) {
      deliveryBtn.disabled = false;
      deliveryBtn.style.opacity = '1';
      deliveryBtn.style.cursor = 'pointer';
      deliveryBtn.style.pointerEvents = 'auto';
      deliveryBtn.title = 'Descargar Certificado de Entrega (PDF)';
      
      if (waDeliveryBtn) {
        waDeliveryBtn.disabled = false;
        waDeliveryBtn.style.opacity = '1';
        waDeliveryBtn.style.cursor = 'pointer';
        waDeliveryBtn.style.pointerEvents = 'auto';
        waDeliveryBtn.title = 'Enviar Certificado de Entrega por WhatsApp';
      }
    } else {
      deliveryBtn.disabled = true;
      deliveryBtn.style.opacity = '0.4';
      deliveryBtn.style.cursor = 'not-allowed';
      deliveryBtn.style.pointerEvents = 'none';
      deliveryBtn.title = 'El vehículo debe estar en la sección "Listo" para descargar el certificado';
      
      if (waDeliveryBtn) {
        waDeliveryBtn.disabled = true;
        waDeliveryBtn.style.opacity = '0.4';
        waDeliveryBtn.style.cursor = 'not-allowed';
        waDeliveryBtn.style.pointerEvents = 'none';
        waDeliveryBtn.title = 'El vehículo debe estar en la sección "Listo" para enviar el certificado por WhatsApp';
      }
    }
  }

  // --- Cargar datos de la pestaña de Entrega ---
  const delDateInput = document.getElementById('del-date');
  if (delDateInput) {
    if (vehicle.deliveryDate && vehicle.delivered) {
      delDateInput.value = vehicle.deliveryDate;
    } else {
      // Autocompletar con fecha y hora actual en formato local
      const now = new Date();
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      delDateInput.value = localISO;
    }
  }

  // Quién retira el vehículo
  const isTercero = vehicle.deliveryReceiverType === 'tercero';
  const radioTitular = document.querySelector('input[name="del-receiver-type"][value="titular"]');
  const radioTercero = document.querySelector('input[name="del-receiver-type"][value="tercero"]');
  if (radioTitular && radioTercero) {
    radioTitular.checked = !isTercero;
    radioTercero.checked = isTercero;
  }
  
  if (typeof toggleThirdPartyFields === 'function') {
    toggleThirdPartyFields(isTercero);
  } else {
    const container = document.getElementById('del-third-party-container');
    if (container) container.style.display = isTercero ? 'flex' : 'none';
  }

  const delThirdName = document.getElementById('del-third-name');
  if (delThirdName) delThirdName.value = vehicle.deliveryThirdName || '';

  const delThirdDni = document.getElementById('del-third-dni');
  if (delThirdDni) delThirdDni.value = vehicle.deliveryThirdDni || '';

  const delNotes = document.getElementById('del-notes');
  if (delNotes) delNotes.value = vehicle.deliveryNotes || '';

  const delPaymentStatus = document.getElementById('del-payment-status');
  if (delPaymentStatus) delPaymentStatus.value = vehicle.deliveryPaymentStatus || 'Totalmente Pagado';

  const delPaymentMethod = document.getElementById('del-payment-method');
  if (delPaymentMethod) delPaymentMethod.value = vehicle.deliveryPaymentMethod || 'Efectivo';

  const delPartialAmount = document.getElementById('del-partial-amount');
  if (delPartialAmount) delPartialAmount.value = vehicle.deliveryPartialAmount || '';

  if (typeof togglePartialPaymentField === 'function') {
    togglePartialPaymentField(vehicle.deliveryPaymentStatus || 'Totalmente Pagado');
  }

  // Actualizar la insignia de estado dinámica en la barra superior del modal técnico
  const detStatusBadge = document.getElementById('det-status-badge');
  if (detStatusBadge) {
    detStatusBadge.className = 'status-badge';
    if (vehicle.stage === 'recepcion') {
      detStatusBadge.classList.add('theme-blue');
      detStatusBadge.textContent = 'Trabajo por realizar';
    } else if (vehicle.stage === 'cotizacion') {
      detStatusBadge.classList.add('theme-violet');
      detStatusBadge.textContent = 'En cotizaci\u00f3n';
    } else if (vehicle.stage === 'reparacion') {
      detStatusBadge.classList.add('theme-red');
      detStatusBadge.textContent = 'En reparaci\u00f3n';
    } else if (vehicle.stage === 'listo') {
      detStatusBadge.classList.add('theme-green');
      detStatusBadge.textContent = 'Listo';
    }
  }

  // Dynamic header based on Stage
  if (vehicle.stage === 'reparacion') {
    document.getElementById('det-vehicle-name').innerHTML = `<i data-lucide="wrench" style="width: 18px; color: #dc2626; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Reparaci\u00f3n`;
    document.getElementById('det-vehicle-id-sub').textContent = 'Ficha de trabajo en taller';
  } else {
    const motorStr = vehicle.motor ? ` · Motor: ${vehicle.motor}` : '';
    document.getElementById('det-vehicle-name').textContent = `${vehicle.brand} ${vehicle.model} · ${vehicle.year}${motorStr}`;
    document.getElementById('det-vehicle-id-sub').textContent = `N\u00ba ${indexNum}`;
  }
  
  // Dynamic Tab Selection based on vehicle stage
  if (vehicle.stage === 'listo') {
    setActiveTab('delivery');
  } else if (vehicle.stage === 'reparacion') {
    setActiveTab('workorder');
  } else if (vehicle.stage === 'cotizacion') {
    setActiveTab('quote');
  } else {
    setActiveTab('reception');
  }

  // Apply read-only state if requested
  if (typeof window.applyDetailedModalReadOnlyState === 'function') {
    window.applyDetailedModalReadOnlyState();
  }

  // Open the detailed reception modal overlay
  const overlay = document.getElementById('reception-panel-view');
  if (overlay) {
    overlay.style.display = 'flex';
    // Force a reflow to trigger CSS transition
    overlay.offsetHeight;
    overlay.classList.add('open');
  }
};

// Abrir ficha detallada haciendo clic en la tarjeta del Kanban
window.openDetailedReceptionFromKanban = function(vehicleId) {
  openDetailedReception(vehicleId);
};

window.exitDetailedReception = function() {
  window.isDetailedViewReadOnly = false;
  if (typeof window.applyDetailedModalReadOnlyState === 'function') {
    window.applyDetailedModalReadOnlyState();
  }
  const overlay = document.getElementById('reception-panel-view');
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => {
      if (!overlay.classList.contains('open')) {
        overlay.style.display = 'none';
      }
    }, 300);
  }
  renderApp();
};

window.openFichaClienteFromBanner = function() {
  try {
    const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
    if (!vehicle) {
      alert("Error: No se encontró el vehículo activo.");
      return;
    }
    
    // Buscar por nombre (ignorando mayúsculas/minúsculas y espacios de sobra)
    let clientObj = clients.find(c => c.name && c.name.trim().toLowerCase() === (vehicle.client || '').trim().toLowerCase());
    
    // Si no coincide, buscar por teléfono
    if (!clientObj && vehicle.clientPhone) {
      const cleanPhone = vehicle.clientPhone.replace(/\D/g, '');
      if (cleanPhone) {
        clientObj = clients.find(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
      }
    }
    
    // Si no coincide, buscar por email
    if (!clientObj && vehicle.clientEmail) {
      const cleanEmail = vehicle.clientEmail.trim().toLowerCase();
      if (cleanEmail) {
        clientObj = clients.find(c => (c.email || '').trim().toLowerCase() === cleanEmail);
      }
    }
    
    if (clientObj) {
      openClientDetailsModal(clientObj.id);
    } else {
      alert(`El cliente "${vehicle.client || 'Asociado'}" no está registrado en la base de datos de Clientes. Regístrelo primero desde la pestaña de Clientes.`);
    }
  } catch (err) {
    console.error("Error in openFichaClienteFromBanner:", err);
    alert("Error crítico en openFichaClienteFromBanner: " + err.message + "\n" + err.stack);
  }
};

window.openFichaVehiculoFromBanner = function() {
  if (activeReceptionVehicleId) {
    viewVehicleDetails(activeReceptionVehicleId);
  }
};

// Renderizar la lista dinÃ¡mica de servicios
function renderAddedServicesList() {
  // No-op: services are now edited directly in the textarea
}

window.addServiceToList = function() {};
window.removeServiceFromList = function() {};

// SimulaciÃ³n de Dictado por Voz (InteracciÃ³n divertida premium para el textarea)
window.toggleVoiceDictation = function() {
  const micBtn = document.getElementById('mic-btn');
  const input = document.getElementById('det-service-description');
  
  if (!micBtn || !input) return;
  if (isRecordingVoice) return;
  
  isRecordingVoice = true;
  micBtn.classList.add('recording');
  input.placeholder = "Escuchando...";
  input.value = "";
  
  const mockFails = [
    "El cliente explica que el auto tironea en baja y siente un ruido metÃ¡lico en la rueda delantera izquierda al doblar.",
    "Cambio de aceite y filtros completo. El cliente tambiÃ©n solicita revisar el aire acondicionado que no enfrÃ­a suficiente.",
    "PÃ©rdida de lÃ­quido de direcciÃ³n hidrÃ¡ulica y un chirrido constante en la correa de distribuciÃ³n al encender en frÃ­o.",
    "Realizar afinamiento completo, cambio de bujÃ­as y chequear luz de Check Engine encendida de forma intermitente.",
    "Revisar pastillas y discos de freno traseros. El cliente nota que el pedal se siente esponjoso al frenar fuerte."
  ];
  
  setTimeout(() => {
    const randomFail = mockFails[Math.floor(Math.random() * mockFails.length)];
    
    // Simular escritura letra por letra
    let charIndex = 0;
    input.placeholder = "Escribiendo dictado...";
    
    const typeInterval = setInterval(() => {
      if (charIndex < randomFail.length) {
        input.value += randomFail.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(typeInterval);
        isRecordingVoice = false;
        micBtn.classList.remove('recording');
        input.placeholder = "ExplicaciÃ³n del cliente y problemas del auto";
        alert("DescripciÃ³n dictada por voz con Ã©xito.");
      }
    }, 30);
  }, 1000);
};

// Switch Detalles
window.toggleDetailsArea = function() {
  const toggle = document.getElementById('det-details-toggle');
  const areaGroup = document.getElementById('det-details-notes-group');
  
  if (toggle.checked) {
    areaGroup.style.display = 'flex';
    document.getElementById('det-details-notes').focus();
  } else {
    areaGroup.style.display = 'none';
  }
};

// Confirmar RecepciÃ³n (Boton "Recepcionar VehÃ­culo")
window.confirmReception = function() {
  if (!activeReceptionVehicleId) return;

  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;

  const kmVal = parseFloat(document.getElementById('det-km').value) || 0;
  const fuelVal = document.getElementById('det-fuel').value;
  const detailsToggle = document.getElementById('det-details-toggle').checked;
  const detailsNotes = document.getElementById('det-details-notes').value.trim();

  // Guardar datos tÃ©cnicos en el estado
  vehicles[vehicleIndex].kilometers = kmVal;
  vehicles[vehicleIndex].fuelLevel = fuelVal;
  vehicles[vehicleIndex].services = document.getElementById('det-service-description').value.trim();
  vehicles[vehicleIndex].hasDetails = detailsToggle;
  vehicles[vehicleIndex].detailsNotes = detailsToggle ? detailsNotes : '';
  
  // Transicionar etapa a "CotizaciÃ³n" (DESACTIVADO: Se mantiene en recepciÃ³n para mover manualmente)
  // vehicles[vehicleIndex].stage = 'cotizacion';
  
  // Asignar monto cotizado inicial para simulaciÃ³n ($90.000)
  if (vehicles[vehicleIndex].value === 0) {
    vehicles[vehicleIndex].value = 90000;
  }

  saveState();
  
  // Salir de recepciÃ³n y volver al tablero
  exitDetailedReception();
  
  // NotificaciÃ³n de Ã©xito
  const name = `${vehicles[vehicleIndex].brand} ${vehicles[vehicleIndex].model}`;
  alert(`VehÃ­culo "${name}" recepcionado con Ã©xito.\nKilometraje: ${kmVal} km.\nNivel Combustible: ${fuelVal}.`);
};

// --- 11. OTRAS ACCIONES DE TARJETAS (ELIMINAR / ENTREGAR) ---

window.openContextMenu = function(e, vehicleId, stage) {
  e.stopPropagation();
  activeContextVehicleId = vehicleId;
  
  const menu = document.getElementById('card-context-menu');
  const deliverBtn = document.getElementById('context-deliver-btn');
  const viewQuoteBtn = document.getElementById('context-view-quote-btn');
  
  // Mostrar "Entregar" si la etapa es 'listo' o 'cotizacion'
  if (stage === 'listo' || stage === 'cotizacion') {
    deliverBtn.style.display = 'flex';
  } else {
    deliverBtn.style.display = 'none';
  }
  
  // Mostrar "Ver cotizaciÃ³n" en los 3 puntos
  if (viewQuoteBtn) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && (vehicle.quoteCompleted || vehicle.stage === 'cotizacion' || vehicle.stage === 'reparacion' || vehicle.stage === 'listo')) {
      viewQuoteBtn.style.display = 'flex';
    } else {
      viewQuoteBtn.style.display = 'none';
    }
  }
  
  const rect = e.currentTarget.getBoundingClientRect();
  const menuWidth = 165;
  
  menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
  menu.style.left = `${rect.right + window.scrollX - menuWidth}px`;
  menu.classList.add('show');
};

window.handleContextEdit = function() {
  if (!activeContextVehicleId) return;
  openEditVehicleModal(activeContextVehicleId);
  document.getElementById('card-context-menu').classList.remove('show');
};

// Carga para ediciÃ³n desde el menÃº contextual
window.openEditVehicleModal = function(vehicleId) {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;

  // Abrir en Ficha tÃ©cnica si estÃ¡ en recepciÃ³n, sino en modal regular
  if (vehicle.stage === 'recepcion') {
    openDetailedReception(vehicleId);
  } else {
    // Si no estÃ¡ en recepciÃ³n, editamos su cotizaciÃ³n con modal extendido
    openDetailedReception(vehicleId);
  }
  
  document.getElementById('card-context-menu').classList.remove('show');
};

window.handleContextDeliver = function() {
  if (!activeContextVehicleId) return;
  
  const vehicleIndex = vehicles.findIndex(v => v.id === activeContextVehicleId);
  if (vehicleIndex !== -1) {
    vehicles[vehicleIndex].delivered = true;
    vehicles[vehicleIndex].deliveryTime = Date.now();
    saveState();
    renderApp();
    alert(`El vehículo "${vehicles[vehicleIndex].brand} ${vehicles[vehicleIndex].model}" ha sido entregado al cliente con éxito.`);
  }
  document.getElementById('card-context-menu').classList.remove('show');
};

window.handleContextViewQuote = function() {
  if (!activeContextVehicleId) return;
  openDetailedQuoteView(activeContextVehicleId);
  document.getElementById('card-context-menu').classList.remove('show');
};

window.deliverVehicleFromCard = function(vehicleId) {
  const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
  if (vehicleIndex !== -1) {
    vehicles[vehicleIndex].delivered = true;
    vehicles[vehicleIndex].deliveryTime = Date.now();
    saveState();
    renderApp();
    alert(`El vehículo "${vehicles[vehicleIndex].brand} ${vehicles[vehicleIndex].model}" ha sido entregado al cliente con éxito.`);
  }
};

window.handleContextDelete = function() {
  if (!activeContextVehicleId) return;
  
  if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este registro de vehÃ­culo?')) {
    const cardEl = document.getElementById(`card-${activeContextVehicleId}`);
    if (cardEl) {
      cardEl.style.transform = 'scale(0.8)';
      cardEl.style.opacity = '0';
      setTimeout(() => {
        vehicles = vehicles.filter(v => v.id !== activeContextVehicleId);
        saveState();
        renderApp();
      }, 250);
    } else {
      vehicles = vehicles.filter(v => v.id !== activeContextVehicleId);
      saveState();
      renderApp();
    }
  }
  document.getElementById('card-context-menu').classList.remove('show');
};

// --- 12. MODAL DETALLE DE COTIZACIÃ“N (FACTURA) ---

window.openQuoteModal = function(vehicleId) {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;
  
  const invoiceContent = document.getElementById('quote-invoice-content');
  
  const laborPercent = 0.4;
  const partsPercent = 0.6;
  const laborValue = Math.round(vehicle.value * laborPercent);
  const partsValue = Math.round(vehicle.value * partsPercent);
  
  invoiceContent.innerHTML = `
    <div class="invoice-header">
      <div class="invoice-logo">
        <div class="logo-badge" style="width: 36px; height: 36px; font-size: 16px;">A</div>
        <div>
          <h4 style="font-family: var(--font-display); font-weight: 700; margin: 0;">AutoTech Taller</h4>
          <span style="font-size: 10px; color: var(--text-muted);">Servicio Automotriz Premium</span>
        </div>
      </div>
      <div class="invoice-company-details">
        <strong>AutoTech Solutions S.A.</strong><br>
        Av. Santa Fe 3450, CABA<br>
        Tel: +54 11 4839-2910<br>
        contacto@autotech.com
      </div>
    </div>
    
    <div class="invoice-meta">
      <div>
        <span style="color: var(--text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase;">Cliente</span>
        <strong>${vehicle.client}</strong>
        <span>VehÃ­culo: ${vehicle.brand} ${vehicle.model}</span>
        <span>Patente: <strong style="font-family: var(--font-mono);">${vehicle.plate}</strong></span>
      </div>
      <div style="text-align: right;">
        <span style="color: var(--text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase;">Detalles CotizaciÃ³n</span>
        <strong>Ingreso #${vehicle.id.substring(vehicle.id.length - 4, vehicle.id.length) === '2026' ? '1' : vehicle.id.substring(vehicle.id.length - 4, vehicle.id.length)}</strong>
        <span>Fecha de Ingreso: ${vehicle.entryDate}</span>
        <span>Estado: <span style="font-weight: 700; text-transform: uppercase; color: ${vehicle.stage === 'recepcion' ? 'var(--color-recepcion)' : vehicle.stage === 'cotizacion' ? 'var(--color-cotizacion)' : vehicle.stage === 'reparacion' ? 'var(--color-reparacion)' : vehicle.stage === 'listo' ? 'var(--color-listo)' : 'var(--color-accent)'};">${vehicle.stage === 'recepcion' ? 'RECEPCIÃ“N' : vehicle.stage === 'cotizacion' ? 'COTIZACIÃ“N' : vehicle.stage === 'reparacion' ? 'ORDEN DE TRABAJO' : vehicle.stage === 'listo' ? 'LISTO' : vehicle.stage.toUpperCase()}</span></span>
      </div>
    </div>
    
    <div style="margin-top: 8px;">
      <h5 style="font-family: var(--font-display); font-weight: 700; font-size: 13px; margin-bottom: 8px; color: var(--text-primary);">Desglose del Presupuesto</h5>
      <table class="invoice-table">
        <thead>
          <tr>
            <th>DescripciÃ³n de Servicio / Item</th>
            <th style="text-align: right;">Total Parcial</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Mano de Obra Especializada</strong><br>
              <span style="font-size: 11px; color: var(--text-secondary);">Mano de obra especializada para el diagnÃ³stico, reparaciÃ³n y testeo de servicios detallados.</span>
              <ul style="font-size: 10px; margin-top: 4px; padding-left: 16px; color: var(--text-secondary);">
                ${typeof vehicle.services === 'string'
                  ? vehicle.services.split('\n').filter(s => s.trim().length > 0).map(s => `<li>${s}</li>`).join('') || '<li>RevisiÃ³n general del vehÃ­culo</li>'
                  : (vehicle.services || []).map(s => `<li>${s}</li>`).join('') || '<li>RevisiÃ³n general del vehÃ­culo</li>'}
              </ul>
            </td>
            <td>${formatCurrency(laborValue)}</td>
          </tr>
          <tr>
            <td>
              <strong>Repuestos e Insumos</strong><br>
              <span style="font-size: 11px; color: var(--text-secondary);">Insumos homologados y repuestos tÃ©cnicos requeridos.</span>
              <span style="font-size: 10px; color: var(--text-muted); display: block; margin-top: 2px;">(Filtros, lubricantes, componentes mecÃ¡nicos del sistema)</span>
            </td>
            <td>${formatCurrency(partsValue)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="invoice-total-row">
      <span class="invoice-total-label">Monto Neto Estimado:</span>
      <span class="invoice-total-value">${formatCurrency(vehicle.value)}</span>
    </div>
    
    <div style="margin-top: 16px; border-top: 1px dashed var(--border-color); padding-top: 12px; font-size: 11px; color: var(--text-muted); line-height: 1.4;">
      <strong>Ficha TÃ©cnica de RecepciÃ³n:</strong> Kilometraje: ${vehicle.kilometers || 0} km | Combustible: ${vehicle.fuelLevel || '1/2'}
      <br>
      <strong>Detalles FÃ­sicos:</strong> ${vehicle.detailsNotes || 'Sin anomalÃ­as registradas en la carrocerÃ­a.'}
      <br><br>
      <strong>Notas Legales:</strong> Validez de 15 dÃ­as. GarantÃ­a de reparaciÃ³n de 3 meses.
    </div>
  `;
  
  document.getElementById('quote-modal').classList.add('open');
  initLucide();
};

// --- 13. GENERADOR DE CALENDARIO MENSUAL DINÃMICO ---

window.adjustMonth = function(offset) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
  agendaCalendarDate.setMonth(agendaCalendarDate.getMonth() + offset);
  renderCalendar();
  const agendaPanel = document.getElementById('agenda-view-panel');
  if (agendaPanel && agendaPanel.style.display !== 'none') {
    renderAgendaCalendar();
  }
};

window.setTodayMonth = function() {
  currentCalendarDate = new Date(2026, 4, 24);
  agendaCalendarDate = new Date(2026, 4, 24);
  renderCalendar();
  const agendaPanel = document.getElementById('agenda-view-panel');
  if (agendaPanel && agendaPanel.style.display !== 'none') {
    renderAgendaCalendar();
  }
};

function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const currentMonthName = monthNames[month];
  const currentMonthLabel = document.getElementById('current-month-label');
  if (currentMonthLabel) {
    currentMonthLabel.textContent = `${currentMonthName} ${year}`;
  }
  document.getElementById('calendar-month-title').textContent = `${currentMonthName} ${year}`;
  
  const daysGrid = document.getElementById('calendar-days-grid');
  if (!daysGrid) return;
  daysGrid.innerHTML = '';
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Monday start adjustment
  let adjustedFirstDay = (firstDayIndex + 6) % 7;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  // Padding mes anterior
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const day = prevTotalDays - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateString = formatDateString(prevMonthDate);
    const cell = createAgendaDayCell(day, true, false, dateString);
    daysGrid.appendChild(cell);
  }

  // DÃ­as mes actual
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month, day);
    const dateString = formatDateString(currentDate);
    const isTodayDemo = (year === 2026 && month === 4 && day === 24); // Mayo 24
    const cell = createAgendaDayCell(day, false, isTodayDemo, dateString);
    daysGrid.appendChild(cell);
  }

  // Padding mes siguiente
  const totalCellsSoFar = adjustedFirstDay + totalDays;
  const nextMonthCells = 42 - totalCellsSoFar;
  for (let day = 1; day <= nextMonthCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const dateString = formatDateString(nextMonthDate);
    const cell = createAgendaDayCell(day, true, false, dateString);
    daysGrid.appendChild(cell);
  }
  renderProximasCitas();
}

function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// --- 14. LÃ“GICA DE LA PESTAÃ‘A DE COTIZACIÃ“N INTERACTIVA (FOTO 3) ---

let activeQuoteServices = [];
let activeQuoteParts = [];

window.setActiveTab = function(tabName) {
  window.activeTabName = tabName;

  // Limpiar estados de bloqueo y difuminados previos en todos los tabs
  ['reception', 'quote', 'workorder', 'delivery'].forEach(name => {
    const content = document.getElementById(`tab-content-${name}`);
    if (content) {
      Array.from(content.children).forEach(child => {
        child.style.filter = '';
        child.style.pointerEvents = '';
        child.style.opacity = '';
      });
    }
  });

  // Remover clase activa de todos los botones de pestaña
  document.getElementById('tab-reception-btn').classList.remove('active');
  document.getElementById('tab-quote-btn').classList.remove('active');
  document.getElementById('tab-workorder-btn').classList.remove('active');
  const tabDelBtn = document.getElementById('tab-delivery-btn');
  if (tabDelBtn) tabDelBtn.classList.remove('active');
  
  // Ocultar todos los contenidos
  document.getElementById('tab-content-reception').style.display = 'none';
  document.getElementById('tab-content-quote').style.display = 'none';
  document.getElementById('tab-content-workorder').style.display = 'none';
  const tabDelCont = document.getElementById('tab-content-delivery');
  if (tabDelCont) tabDelCont.style.display = 'none';
  
  // Ocultar botón de Aprobar Cotización por defecto
  const approveBtn = document.getElementById('btn-approve-quote-ot');
  if (approveBtn) {
    approveBtn.style.setProperty('display', 'none', 'important');
  }
  // Ocultar botón de Finalizar y Archivar por defecto
  const archiveBtn = document.getElementById('btn-archive-vehicle');
  if (archiveBtn) {
    archiveBtn.style.setProperty('display', 'none', 'important');
  }

  // Personalizar dinámicamente e inicializar visibilidad del botón "Aceptar" global según la pestaña activa
  const acceptBtn = document.getElementById('btn-accept-global-footer');
  if (acceptBtn) {
    acceptBtn.style.setProperty('display', 'inline-flex', 'important');
    if (tabName === 'reception') {
      acceptBtn.textContent = 'Guardar Recepción';
    } else if (tabName === 'quote') {
      acceptBtn.textContent = 'Guardar Cotización';
    } else if (tabName === 'workorder') {
      acceptBtn.textContent = 'Guardar Orden de Trabajo';
    } else if (tabName === 'delivery') {
      acceptBtn.textContent = 'Guardar Entrega';
    } else {
      acceptBtn.textContent = 'Aceptar';
    }
  }
  
  // Activar la seleccionada
  if (tabName === 'reception') {
    document.getElementById('tab-reception-btn').classList.add('active');
    document.getElementById('tab-content-reception').style.display = 'block';
  } else if (tabName === 'quote') {
    document.getElementById('tab-quote-btn').classList.add('active');
    document.getElementById('tab-content-quote').style.display = 'block';
    
    const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
    if (vehicle) {
      document.getElementById('quote-editor-view').style.display = 'block';
      document.getElementById('quote-preview-view').style.display = 'none';
      renderQuoteTab();
      updateCalculatedTotals();
      
      // Controlar dinámicamente el botón de aprobación
      if (approveBtn) {
        if (vehicle.stage === 'recepcion' || vehicle.stage === 'cotizacion') {
          approveBtn.style.setProperty('display', 'inline-flex', 'important');
        } else {
          approveBtn.style.setProperty('display', 'none', 'important');
        }
      }
    }
  } else if (tabName === 'workorder') {
    document.getElementById('tab-workorder-btn').classList.add('active');
    document.getElementById('tab-content-workorder').style.display = 'block';
    renderOTTab();
  } else if (tabName === 'delivery') {
    if (tabDelBtn) tabDelBtn.classList.add('active');
    if (tabDelCont) tabDelCont.style.display = 'block';
    if (archiveBtn) archiveBtn.style.setProperty('display', 'inline-flex', 'important');
    
    // Al abrir pestaña de entrega, actualizar el importe total que se muestra
    const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
    if (vehicle) {
      const services = [...(vehicle.quoteServices || [])];
      const parts = [...(vehicle.quoteParts || [])];
      const servSum = services.reduce((s, item) => s + item.value, 0);
      const partsSum = parts.reduce((s, item) => s + item.value, 0);
      const subtotal = servSum + partsSum;
      const discPercent = vehicle.discountPercent || 0;
      const discountVal = subtotal * (discPercent / 100);
      const net = subtotal - discountVal;
      const vatInclusive = vehicle.vatInclusive !== false;
      const total = vatInclusive ? net : net * 1.19;
      
      const totalEl = document.getElementById('del-total-amount');
      if (totalEl) totalEl.textContent = formatCurrency(Math.round(total));
      if (typeof updateDeliveryBalance === 'function') updateDeliveryBalance();
    }
  }

  // --- Validar si la etapa anterior ha sido completada y aplicar Bloqueo/Blur si es necesario ---
  let isBlocked = false;
  let blockingMessage = '';
  let isMoveToQuoteRequired = false;
  let isMoveToWorkOrderRequired = false;
  let isMoveToReadyRequired = false;
  const activeVehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
  const tabBlockingEnabled = localStorage.getItem('taller_tab_blocking_enabled') !== 'false'; // Default to true!
  
  if (activeVehicle) {
    const hasServices = typeof activeVehicle.services === 'string' ? activeVehicle.services.trim().length > 0 : (activeVehicle.services || []).length > 0;
    const isReceptionDone = (activeVehicle.kilometers > 0 || hasServices);
    const isQuoteDone = activeVehicle.quoteCompleted || ['reparacion', 'listo', 'entregado'].includes(activeVehicle.stage);
    const isWorkOrderDone = ['listo', 'entregado'].includes(activeVehicle.stage) || activeVehicle.delivered;

    if (tabName === 'quote') {
      if (activeVehicle.stage === 'recepcion') {
        isBlocked = true;
        isMoveToQuoteRequired = true;
      } else if (tabBlockingEnabled && !isReceptionDone) {
        isBlocked = true;
        blockingMessage = 'Debes completar la etapa anterior (Registrar Recepción) para acceder a Cotización.';
      }
    } else if (tabName === 'workorder') {
      if (activeVehicle.stage === 'cotizacion') {
        isBlocked = true;
        isMoveToWorkOrderRequired = true;
      } else if (tabBlockingEnabled && !isQuoteDone) {
        isBlocked = true;
        blockingMessage = 'Debes completar la etapa anterior (Aprobar Cotización) para acceder a Orden de Trabajo.';
      }
    } else if (tabName === 'delivery') {
      if (activeVehicle.stage === 'reparacion') {
        isBlocked = true;
        isMoveToReadyRequired = true;
      } else if (tabBlockingEnabled && !isWorkOrderDone) {
        isBlocked = true;
        blockingMessage = 'Debes completar la etapa anterior (Finalizar Orden de Trabajo) para acceder a Entrega.';
      }
    }
  }

  // Aplicar o remover bloqueo en el contenedor de contenido
  const tabContentId = `tab-content-${tabName}`;
  const tabContent = document.getElementById(tabContentId);
  if (tabContent) {
    const scrollContainer = tabContent.parentElement; // .workspace-tab-contents

    // Remover overlay previo del scrollbox si existe
    if (scrollContainer) {
      const existingOverlay = scrollContainer.querySelector('.workspace-tab-blocked-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
    }

    const children = Array.from(tabContent.children);

    if (isBlocked) {
      // Forzar scroll al inicio del contenedor y bloquear scroll vertical para un centrado absoluto perfecto
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
        scrollContainer.style.setProperty('overflow-y', 'hidden', 'important');
      }

      // Aplicar blur y baja opacidad a todo el contenido
      children.forEach(child => {
        child.style.filter = 'blur(5px)';
        child.style.pointerEvents = 'none';
        child.style.opacity = '0.35';
      });

      // Inyectar overlay premium directamente en el scrollbox
      if (scrollContainer) {
        const overlay = document.createElement('div');
        overlay.className = 'workspace-tab-blocked-overlay';
        if (isMoveToQuoteRequired) {
          overlay.innerHTML = `
            <div class="workspace-tab-blocked-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div class="workspace-tab-blocked-icon" style="background-color: rgba(var(--color-accent-rgb), 0.15); color: var(--color-accent);">
                <i data-lucide="arrow-right-left" style="width: 24px; height: 24px;"></i>
              </div>
              <div class="workspace-tab-blocked-title" style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Vehículo en Recepción</div>
              <div class="workspace-tab-blocked-text" style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Para acceder a la cotización, debes mover el vehículo a la etapa de Cotización.</div>
              <button class="btn-primary" onclick="moveActiveVehicleToQuoteStage()" style="background: var(--color-accent); color: white; border: none; border-radius: var(--radius-md); padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(var(--color-accent-rgb),0.3);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                <i data-lucide="file-spreadsheet" style="width: 14px; height: 14px;"></i>
                Mover vehiculo a Cotización
              </button>
            </div>
          `;
        } else if (isMoveToWorkOrderRequired) {
          overlay.innerHTML = `
            <div class="workspace-tab-blocked-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div class="workspace-tab-blocked-icon" style="background-color: rgba(var(--color-accent-rgb), 0.15); color: var(--color-accent);">
                <i data-lucide="arrow-right-left" style="width: 24px; height: 24px;"></i>
              </div>
              <div class="workspace-tab-blocked-title" style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Vehículo en Cotización</div>
              <div class="workspace-tab-blocked-text" style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Para acceder a la orden de trabajo, debes aprobar la cotización.</div>
              <button class="btn-primary" onclick="approveQuoteAndCreateWorkOrder()" style="background: var(--color-accent); color: white; border: none; border-radius: var(--radius-md); padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(var(--color-accent-rgb),0.3);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>
                Aprobar Cotización
              </button>
            </div>
          `;
        } else if (isMoveToReadyRequired) {
          overlay.innerHTML = `
            <div class="workspace-tab-blocked-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div class="workspace-tab-blocked-icon" style="background-color: rgba(var(--color-accent-rgb), 0.15); color: var(--color-accent);">
                <i data-lucide="arrow-right-left" style="width: 24px; height: 24px;"></i>
              </div>
              <div class="workspace-tab-blocked-title" style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Vehículo en Reparación (OT)</div>
              <div class="workspace-tab-blocked-text" style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Para acceder a la entrega, debes finalizar la orden de trabajo.</div>
              <button class="btn-primary" onclick="moveActiveVehicleToReadyStage()" style="background: var(--color-accent); color: white; border: none; border-radius: var(--radius-md); padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(var(--color-accent-rgb),0.3);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
                Finalizar OT y Mover a Listo
              </button>
            </div>
          `;
        } else {
          overlay.innerHTML = `
            <div class="workspace-tab-blocked-card">
              <div class="workspace-tab-blocked-icon">
                <i data-lucide="lock" style="width: 24px; height: 24px;"></i>
              </div>
              <div class="workspace-tab-blocked-title">Etapa Restringida</div>
              <div class="workspace-tab-blocked-text">${blockingMessage}</div>
            </div>
          `;
        }
        scrollContainer.appendChild(overlay);
      }

      // Ocultar botones del pie de página para prevenir guardados accidentales
      if (acceptBtn) {
        acceptBtn.style.setProperty('display', 'none', 'important');
      }
      if (approveBtn) {
        approveBtn.style.setProperty('display', 'none', 'important');
      }
      if (archiveBtn) {
        archiveBtn.style.setProperty('display', 'none', 'important');
      }
    } else {
      // Restaurar scroll de contenedor
      if (scrollContainer) {
        scrollContainer.style.removeProperty('overflow-y');
      }

      // Restaurar todo a su estado original libre
      children.forEach(child => {
        child.style.filter = '';
        child.style.pointerEvents = '';
        child.style.opacity = '';
      });
    }
  }
  
  initLucide();
  if (typeof window.applyDetailedModalReadOnlyState === 'function') {
    window.applyDetailedModalReadOnlyState();
  }
};

window.moveActiveVehicleToQuoteStage = function() {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;
  
  const vehicle = vehicles[vehicleIndex];
  
  // Mover a la etapa de cotización
  vehicle.stage = 'cotizacion';
  
  saveState();
  renderApp(); // Para actualizar el Kanban y la interfaz
  
  // Re-abrir la pestaña de cotización (que ahora estará libre)
  setActiveTab('quote');
  
  // Mostrar un brindis/toast premium de éxito
  const toast = document.createElement('div');
  toast.textContent = `✓ Vehículo ${vehicle.brand} ${vehicle.model} movido a Cotización`;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: #00b050; color: white; font-weight: 700; font-size: 13px;
    padding: 12px 24px; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,176,80,0.3);
    animation: slide-up 0.2s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

window.moveActiveVehicleToReadyStage = function() {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;
  
  const vehicle = vehicles[vehicleIndex];
  
  // Mover a la etapa de listo
  vehicle.stage = 'listo';
  
  // Si tiene tareas de OT, las marcamos como completadas para reflejar que la OT finalizó
  if (vehicle.otTasks && vehicle.otTasks.length > 0) {
    vehicle.otTasks.forEach(t => t.completed = true);
  }
  
  saveState();
  renderApp(); // Para actualizar el Kanban y la interfaz
  
  // Re-abrir la pestaña de entrega (que ahora estará libre)
  setActiveTab('delivery');
  
  // Mostrar un brindis/toast premium de éxito
  const toast = document.createElement('div');
  toast.textContent = `✓ Vehículo ${vehicle.brand} ${vehicle.model} finalizado y movido a Listo`;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: #00b050; color: white; font-weight: 700; font-size: 13px;
    padding: 12px 24px; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,176,80,0.3);
    animation: slide-up 0.2s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

window.toggleQuoteApproval = function(event, vehicleId) {
  event.stopPropagation();
  const checked = event.target.checked;
  const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
  if (vehicle) {
    vehicle.quoteCompleted = checked;
    
    // Si se aprueba y no tiene otTasks aún, las inicializamos
    if (checked && (!vehicle.otTasks || vehicle.otTasks.length === 0)) {
      const services = vehicle.quoteServices || [];
      const parts = vehicle.quoteParts || [];
      const combinedNames = [...services.map(s => s.name), ...parts.map(p => p.name)];
      vehicle.otTasks = combinedNames.map(name => ({ name, completed: false, observation: '' }));
    }
    
    saveState();
    renderApp();

    // Sincronizar el switch del modal detallado si está abierto para el mismo vehículo
    if (String(activeReceptionVehicleId) === String(vehicle.id)) {
      const quoteSwitch = document.getElementById('input-approve-quote-switch');
      const quoteSwitchLabel = document.getElementById('label-approve-quote-switch');
      if (quoteSwitch) {
        quoteSwitch.checked = checked;
        const slider = quoteSwitch.nextElementSibling;
        if (slider) {
          if (checked) {
            slider.style.setProperty('background-color', 'var(--color-listo)', 'important');
          } else {
            slider.style.removeProperty('background-color');
          }
        }
      }
      if (quoteSwitchLabel) {
        quoteSwitchLabel.textContent = checked ? 'Cotización aprobada' : 'Cotización pendiente';
        quoteSwitchLabel.style.color = checked ? 'var(--color-listo)' : 'var(--text-primary)';
      }
      updateTabStatuses(vehicle);
    }
  }
};

window.toggleDetailedQuoteApproval = function(event) {
  if (!activeReceptionVehicleId) return;
  const checked = event.target.checked;
  const vehicle = vehicles.find(v => String(v.id) === String(activeReceptionVehicleId));
  if (vehicle) {
    if (checked) {
      // Si se aprueba, debemos validar primero si hay fecha y hora estimadas de entrega
      const deliveryDateVal = document.getElementById('quote-delivery-date')?.value || '';
      const deliveryTimeVal = document.getElementById('quote-delivery-time')?.value || '';
      
      if (!deliveryDateVal || !deliveryTimeVal) {
        // Deshacer el check
        event.target.checked = false;
        alert('Por favor, ingresa primero la fecha y hora estimada de entrega en la cotización.');
        const dateInput = document.getElementById('quote-delivery-date');
        const timeInput = document.getElementById('quote-delivery-time');
        if (!deliveryDateVal && dateInput) dateInput.focus();
        else if (!deliveryTimeVal && timeInput) timeInput.focus();
        return;
      }
      
      // Guardar fecha y hora
      vehicle.deliveryDate = deliveryDateVal;
      vehicle.deliveryTime = deliveryTimeVal;
      vehicle.quoteCompleted = true;
      
      // Inicializar tareas de OT si no existen
      const services = vehicle.quoteServices || [];
      const parts = vehicle.quoteParts || [];
      const combinedNames = [...services.map(s => s.name), ...parts.map(p => p.name)];
      vehicle.otTasks = combinedNames.map(name => ({ name, completed: false, observation: '' }));
      
      alert('¡Cotización aprobada con éxito!');
    } else {
      vehicle.quoteCompleted = false;
      alert('Cotización marcada como pendiente.');
    }
    
    // Guardar estado y refrescar
    saveState();
    renderApp();
    
    // Actualizar UI del propio switch en el footer
    const quoteSwitchLabel = document.getElementById('label-approve-quote-switch');
    if (quoteSwitchLabel) {
      quoteSwitchLabel.textContent = vehicle.quoteCompleted ? 'Cotización aprobada' : 'Cotización pendiente';
      quoteSwitchLabel.style.color = vehicle.quoteCompleted ? 'var(--color-listo)' : 'var(--text-primary)';
    }
    
    // Actualizar el slider color
    const slider = event.target.nextElementSibling;
    if (slider) {
      if (vehicle.quoteCompleted) {
        slider.style.setProperty('background-color', 'var(--color-listo)', 'important');
      } else {
        slider.style.removeProperty('background-color');
      }
    }
    
    updateTabStatuses(vehicle);
  }
};

window.handleGlobalAccept = function() {
  if (window.activeTabName === 'reception') {
    confirmReception();
  } else if (window.activeTabName === 'quote') {
    confirmQuoteCreation();
  } else if (window.activeTabName === 'workorder') {
    saveOTAndUpdate();
  } else if (window.activeTabName === 'delivery') {
    saveDeliveryDetails();
  }
};

window.updateSidebarOdometer = function(val) {
  const sidebarKm = document.getElementById('det-vehicle-km-sidebar');
  if (sidebarKm) {
    const num = parseInt(val, 10);
    sidebarKm.textContent = !isNaN(num) ? `${num.toLocaleString('es-AR')} km` : 'Sin registrar';
  }
};

window.updateTabStatuses = function(vehicle) {
  const badgeRec = document.getElementById('tab-badge-reception');
  const badgeQuote = document.getElementById('tab-badge-quote');
  const badgeWork = document.getElementById('tab-badge-workorder');
  const badgeDel = document.getElementById('tab-badge-delivery');

  // Clear any existing inline styles to let classes apply perfectly
  badgeRec.style.backgroundColor = '';
  badgeRec.style.color = '';
  badgeRec.style.borderColor = '';
  badgeQuote.style.backgroundColor = '';
  badgeQuote.style.color = '';
  badgeQuote.style.borderColor = '';
  badgeWork.style.backgroundColor = '';
  badgeWork.style.color = '';
  badgeWork.style.borderColor = '';
  if (badgeDel) {
    badgeDel.style.backgroundColor = '';
    badgeDel.style.color = '';
    badgeDel.style.borderColor = '';
  }

  // Recepción
  const hasServices = typeof vehicle.services === 'string' ? vehicle.services.trim().length > 0 : (vehicle.services || []).length > 0;
  if (vehicle.kilometers > 0 || hasServices) {
    badgeRec.textContent = 'Completado';
    badgeRec.className = 'stage-pending-badge badge-green';
  } else {
    badgeRec.textContent = 'Pendiente';
    badgeRec.className = 'stage-pending-badge badge-gold';
  }
  
  // Cotización
  if (vehicle.quoteCompleted) {
    badgeQuote.textContent = 'Completado';
    badgeQuote.className = 'stage-pending-badge badge-green';
  } else {
    badgeQuote.textContent = 'Pendiente';
    badgeQuote.className = 'stage-pending-badge badge-gold';
  }
  
  // Orden de Trabajo
  if (vehicle.stage === 'reparacion' || vehicle.stage === 'listo' || vehicle.delivered) {
    badgeWork.textContent = 'Completado';
    badgeWork.className = 'stage-pending-badge badge-green';
  } else {
    badgeWork.textContent = 'Pendiente';
    badgeWork.className = 'stage-pending-badge badge-gold';
  }

  // Entrega
  if (badgeDel) {
    if (vehicle.delivered || vehicle.stage === 'entregado') {
      badgeDel.textContent = 'Completado';
      badgeDel.className = 'stage-pending-badge badge-green';
    } else {
      badgeDel.textContent = 'Pendiente';
      badgeDel.className = 'stage-pending-badge badge-gold';
    }
  }
};

window.openAddQuoteItemModal = function(type) {
  document.getElementById('add-quote-item-type').value = type;
  
  const title = document.getElementById('add-quote-item-title');
  const label = document.getElementById('add-quote-item-name-label');
  const inputName = document.getElementById('add-quote-item-name');
  const inputValue = document.getElementById('add-quote-item-value');
  
  inputName.value = '';
  inputValue.value = '';
  
  if (type === 'service') {
    title.textContent = 'Agregar Servicio';
    label.textContent = 'Nombre del Servicio*';
    inputName.placeholder = 'Ej. Cambio de aceite';
    inputName.setAttribute('list', 'quote-services-suggestions');
  } else {
    title.textContent = 'Agregar Repuesto / Insumo';
    label.textContent = 'Nombre del Repuesto*';
    inputName.placeholder = 'Ej. Filtro de Aceite SintÃ©tico';
    inputName.setAttribute('list', 'quote-parts-suggestions');
  }
  
  document.getElementById('add-quote-item-modal').classList.add('open');
  inputName.focus();
};

window.handleQuoteItemSubmit = function(e) {
  e.preventDefault();
  
  const type = document.getElementById('add-quote-item-type').value;
  const name = document.getElementById('add-quote-item-name').value.trim();
  const val = parseFloat(document.getElementById('add-quote-item-value').value) || 0;
  
  if (type === 'service') {
    activeQuoteServices.push({ name, value: val });
  } else {
    activeQuoteParts.push({ name, value: val });
  }
  
  closeModal('add-quote-item-modal');
  renderQuoteTab();
  updateCalculatedTotals();
};

window.removeQuoteService = function(index) {
  activeQuoteServices.splice(index, 1);
  renderQuoteTab();
  updateCalculatedTotals();
};

window.removeQuotePart = function(index) {
  activeQuoteParts.splice(index, 1);
  renderQuoteTab();
  updateCalculatedTotals();
};

function renderQuoteTab() {
  const servList = document.getElementById('quote-services-list');
  const partsList = document.getElementById('quote-parts-list');

  // Cargar fecha y hora comprometida de entrega en el editor de cotizaciÃ³n
  const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
  if (vehicle) {
    const dateInput = document.getElementById('quote-delivery-date');
    const timeInput = document.getElementById('quote-delivery-time');
    if (dateInput) dateInput.value = vehicle.deliveryDate || '';
    if (timeInput) timeInput.value = vehicle.deliveryTime || '';
  }
  
  // Conteo e importes de cabecera
  const servSum = activeQuoteServices.reduce((s, item) => s + item.value, 0);
  const partsSum = activeQuoteParts.reduce((s, item) => s + item.value, 0);
  
  document.getElementById('label-serv-count').textContent = `(${activeQuoteServices.length})`;
  document.getElementById('label-parts-count').textContent = `(${activeQuoteParts.length})`;
  document.getElementById('quote-services-sum').textContent = formatCurrency(servSum);
  document.getElementById('quote-parts-sum').textContent = formatCurrency(partsSum);
  
  // Dibujar lista de servicios
  let servHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: var(--card-bg-hover); border-radius: var(--radius-md); font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text-primary); margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>Servicios</span>
        <span style="font-weight: normal; font-size: 12px; color: var(--text-muted);">(${activeQuoteServices.length})</span>
        <span style="background-color: rgba(var(--color-accent-rgb), 0.08); color: var(--color-accent); font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-left: 4px;">${formatCurrency(servSum)}</span>
      </div>
      <span>Precio</span>
    </div>
  `;
  
  if (activeQuoteServices.length > 0) {
    servHTML += activeQuoteServices.map((item, index) => `
      <div class="compact-quote-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1.5px solid var(--border-color); min-height: 40px; box-sizing: border-box; transition: background-color 0.15s;" onmouseover="this.style.backgroundColor='var(--card-bg-hover)'" onmouseout="this.style.backgroundColor='transparent'">
        <span style="font-weight: 600; font-size: 13.5px; color: var(--text-secondary); cursor: pointer;" onclick="editQuoteServicePrice(${index})">${item.name}</span>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-weight: 700; color: var(--color-accent); font-size: 13.5px; cursor: pointer;" onclick="editQuoteServicePrice(${index})">${formatCurrency(item.value)}</span>
          <button onclick="removeQuoteService(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Eliminar">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  servHTML += `
    <div style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: color 0.15s; width: fit-content;" onclick="addInlineQuoteItem('service')" onmouseover="this.style.color='var(--color-accent)';" onmouseout="this.style.color='var(--text-muted)';" title="Agregar Servicio">
      <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 2px;"></i> nuevo servicio...
    </div>
  `;
  servList.innerHTML = servHTML;

  // Dibujar lista de repuestos
  let partsHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: var(--card-bg-hover); border-radius: var(--radius-md); font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text-primary); margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>Repuestos</span>
        <span style="font-weight: normal; font-size: 12px; color: var(--text-muted);">(${activeQuoteParts.length})</span>
        <span style="background-color: rgba(var(--color-accent-rgb), 0.08); color: var(--color-accent); font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-left: 4px;">${formatCurrency(partsSum)}</span>
      </div>
      <span>Precio</span>
    </div>
  `;
  
  if (activeQuoteParts.length > 0) {
    partsHTML += activeQuoteParts.map((item, index) => `
      <div class="compact-quote-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1.5px solid var(--border-color); min-height: 40px; box-sizing: border-box; transition: background-color 0.15s;" onmouseover="this.style.backgroundColor='var(--card-bg-hover)'" onmouseout="this.style.backgroundColor='transparent'">
        <span style="font-weight: 600; font-size: 13.5px; color: var(--text-secondary); cursor: pointer;" onclick="editQuotePartPrice(${index})">${item.name}</span>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-weight: 700; color: var(--color-accent); font-size: 13.5px; cursor: pointer;" onclick="editQuotePartPrice(${index})">${formatCurrency(item.value)}</span>
          <button onclick="removeQuotePart(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Eliminar">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  partsHTML += `
    <div style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: color 0.15s; width: fit-content;" onclick="addInlineQuoteItem('part')" onmouseover="this.style.color='var(--color-accent)';" onmouseout="this.style.color='var(--text-muted)';" title="Agregar Repuesto">
      <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 2px;"></i> nuevo repuesto...
    </div>
  `;
  partsList.innerHTML = partsHTML;
  
  initLucide();
}

// --- Dynamic Inline Quote Item Fields (Replacing Secondary Popup Modal) ---
window.addInlineQuoteItem = function(type) {
  const containerId = type === 'service' ? 'quote-services-list' : 'quote-parts-list';
  const container = document.getElementById(containerId);
  if (!container) return;

  // Evitar duplicar el campo de edición inline si ya hay uno abierto
  if (container.querySelector('.inline-edit-item')) {
    container.querySelector('#inline-item-name').focus();
    return;
  }

  // Limpiar el texto vacío de "No se han agregado..."
  if (type === 'service' && activeQuoteServices.length === 0) {
    container.innerHTML = '';
  } else if (type === 'part' && activeQuoteParts.length === 0) {
    container.innerHTML = '';
  }

  const row = document.createElement('div');
  row.className = 'inline-edit-item';
  row.style.cssText = 'padding: 6px 16px; border: 1.5px dashed var(--color-accent); background-color: var(--card-bg-hover); display: flex; align-items: center; gap: 12px; min-height: 48px; border-radius: var(--radius-sm); margin-bottom: 8px; box-sizing: border-box;';
  
  const datalistId = type === 'service' ? 'quote-services-suggestions' : 'quote-parts-suggestions';
  const placeholderName = type === 'service' ? 'Ej. Cambio de aceite' : 'Ej. Filtro de aceite';
  
  row.innerHTML = `
    <input type="text" id="inline-item-name" class="form-input" list="${datalistId}" placeholder="${placeholderName}" style="flex: 1; padding: 6px 10px; font-size: 13px; font-weight: 600; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary); border-radius: var(--radius-sm);" onchange="handleInlineNameChange(this, '${type}')" onkeydown="handleInlineKeydown(event, '${type}', this)">
    <input type="number" id="inline-item-value" class="form-input" placeholder="Costo" style="width: 90px; padding: 6px 10px; font-size: 13px; font-weight: 700; text-align: right; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary); border-radius: var(--radius-sm);" onkeydown="handleInlineKeydown(event, '${type}', this)">
    ${type === 'part' && localStorage.getItem('taller_meli_search_enabled') !== 'false' ? `
    <button class="meli-search-btn" type="button" onmousedown="const r = this.closest('.inline-edit-item'); if (r) r.dataset.searchingMeli = 'true';" onclick="searchInMercadoLibreFromInline()" style="background-color: #FFE600 !important; color: #2D3277 !important; border: 1px solid #d4c000 !important; border-radius: var(--radius-sm) !important; padding: 6px 10px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important; cursor: pointer !important; height: 32px !important; font-weight: 700 !important; font-size: 11px !important; transition: all 0.2s ease !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;" title="Buscar en Mercado Libre">
      <img src="logoml.png" alt="ML" style="width: 16px; height: 16px; object-fit: contain; flex-shrink: 0;">
    </button>
    ` : ''}
    <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
      <button id="inline-save-btn" onclick="saveInlineQuoteItem('${type}', this)" style="background: var(--color-listo); color: white; border: none; padding: 6px 10px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; height: 32px; width: 32px;" title="Guardar">
        <i data-lucide="check" style="width: 14px; height: 14px;"></i>
      </button>
      <button id="inline-cancel-btn" onclick="cancelInlineQuoteItem(this)" style="background: var(--card-bg-hover); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 6px 10px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; height: 32px; width: 32px;" title="Cancelar">
        <i data-lucide="x" style="width: 14px; height: 14px;"></i>
      </button>
    </div>
  `;

  // Insertar antes del trigger del botón "+ nuevo..."
  const nuevoLine = container.querySelector('[onclick^="addInlineQuoteItem"]');
  if (nuevoLine) {
    container.insertBefore(row, nuevoLine);
  } else {
    container.appendChild(row);
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Enfocar campo de entrada de nombre inmediatamente
  const nameInput = row.querySelector('#inline-item-name');
  const valueInput = row.querySelector('#inline-item-value');
  const cancelBtn = row.querySelector('#inline-cancel-btn');
  const saveBtn = row.querySelector('#inline-save-btn');

  const handleBlur = function() {
    setTimeout(() => {
      if (row.dataset.searchingMeli === 'true') return;
      
      const activeEl = document.activeElement;
      if (activeEl === nameInput || activeEl === valueInput) return;
      if (activeEl === cancelBtn || activeEl === saveBtn) return;
      if (activeEl && activeEl.closest('.meli-search-btn')) return;
      
      const name = nameInput.value.trim();
      if (name) {
        saveInlineQuoteItem(type, nameInput);
      } else {
        cancelInlineQuoteItem();
      }
    }, 180);
  };

  if (nameInput) {
    nameInput.focus();
    nameInput.addEventListener('blur', handleBlur);
  }
  if (valueInput) {
    valueInput.addEventListener('blur', handleBlur);
  }
};

window.handleInlineNameChange = function(input, type) {
  const name = input.value.trim();
  if (!name) return;

  const valueInput = input.closest('.inline-edit-item').querySelector('#inline-item-value');
  if (!valueInput) return;

  if (type === 'service') {
    const catalogItem = servicesCatalog.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (catalogItem) {
      valueInput.value = catalogItem.price;
    }
  } else {
    // Buscar coincidencia exacta por nombre simple o nombre formateado con compatibilidad
    const catalogItem = partsCatalog.find(p => {
      const compat = [];
      if (p.brand && p.brand !== 'Universal') compat.push(p.brand);
      if (p.model && p.model !== 'Multimarca') compat.push(p.model);
      if (p.year && p.year !== 'â€”') compat.push(p.year);
      const suffix = compat.length > 0 ? ` [${compat.join(' ')}]` : '';
      const fullName = `${p.name}${suffix}`;
      return fullName.toLowerCase() === name.toLowerCase() || p.name.toLowerCase() === name.toLowerCase();
    });
    if (catalogItem) {
      valueInput.value = catalogItem.price;
    }
  }
};

window.handleInlineKeydown = function(event, type, element) {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveInlineQuoteItem(type, element);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelInlineQuoteItem();
  }
};

function ensurePartExistsInCatalog(partName, price, vehicle) {
  if (!vehicle) return partName;

  const rawName = partName.trim();
  if (!rawName) return rawName;

  // Si el usuario seleccionÃ³ de las sugerencias y tiene el sufijo " [Marca Modelo AÃ±o]"
  // o si escribiÃ³ un nombre simple, busquemos limpiarlo para obtener el nombre base.
  let cleanName = rawName;
  const suffixPattern = / \[[^\]]+\]$/;
  if (suffixPattern.test(cleanName)) {
    cleanName = cleanName.replace(suffixPattern, '').trim();
  }

  const brand = (vehicle.brand || '').trim();
  const model = (vehicle.model || '').trim();
  const year = (vehicle.year || '').trim();

  // Buscar coincidencia exacta por nombre base + marca + modelo + aÃ±o en el catÃ¡logo
  const existingPart = partsCatalog.find(p => 
    p.name.toLowerCase() === cleanName.toLowerCase() && 
    (p.brand || '').toLowerCase() === brand.toLowerCase() && 
    (p.model || '').toLowerCase() === model.toLowerCase() && 
    String(p.year || '') === String(year)
  );

  if (!existingPart) {
    // Crear el repuesto en el catÃ¡logo con columnas dedicadas para marca, modelo y aÃ±o
    const newPart = {
      id: 'p-' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: cleanName,
      description: `Creado automÃ¡ticamente desde cotizaciÃ³n para ${brand} ${model} ${year}`,
      brand: brand,
      model: model,
      year: year,
      price: price,
      date: new Date().toISOString().split('T')[0]
    };
    partsCatalog.push(newPart);
    saveParts();
    if (typeof populateDatalists === 'function') {
      populateDatalists();
    }
  }

  // Devolvemos el nombre formateado con sufijo de compatibilidad para que sea claro en la cotizaciÃ³n y OT
  const compat = [];
  if (brand && brand !== 'Universal') compat.push(brand);
  if (model && model !== 'Multimarca') compat.push(model);
  if (year && year !== 'â€”') compat.push(year);
  const suffix = compat.length > 0 ? ` [${compat.join(' ')}]` : '';
  return `${cleanName}${suffix}`;
}

function ensureServiceExists(serviceName, price) {
  const rawName = serviceName.trim();
  if (!rawName) return rawName;

  const existingService = servicesCatalog.find(s => s.name.toLowerCase() === rawName.toLowerCase());
  if (!existingService) {
    const newService = {
      id: 's-' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: rawName,
      description: 'Servicio creado automÃ¡ticamente desde cotizaciÃ³n',
      price: price,
      date: new Date().toISOString().split('T')[0]
    };
    servicesCatalog.push(newService);
    saveServices();
    if (typeof populateDatalists === 'function') {
      populateDatalists();
    }
  }
  return rawName;
}

window.saveInlineQuoteItem = function(type, element) {
  const row = element.closest('.inline-edit-item');
  if (!row || !document.body.contains(row)) return;

  const nameInput = row.querySelector('#inline-item-name');
  const valueInput = row.querySelector('#inline-item-value');

  if (!nameInput || !valueInput) return;

  const name = nameInput.value.trim();
  const val = parseFloat(valueInput.value) || 0;

  if (!name) {
    alert('Por favor ingrese un nombre.');
    nameInput.focus();
    return;
  }

  const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);

  if (type === 'service') {
    const cleanServiceName = ensureServiceExists(name, val);
    activeQuoteServices.push({ name: cleanServiceName, value: val });
  } else {
    const formattedPartName = ensurePartExistsInCatalog(name, val, vehicle);
    activeQuoteParts.push({ name: formattedPartName, value: val });
  }

  renderQuoteTab();
  updateCalculatedTotals();
};

window.cancelInlineQuoteItem = function() {
  renderQuoteTab();
};

window.handleListContainerClick = function(event, type) {
  // Ignorar si el click ocurrió dentro de un item de servicio ya agregado o en un botón/input
  const isInteractive = event.target.closest('button') || event.target.closest('input') || event.target.closest('.added-service-item:not(.inline-edit-item)') || event.target.closest('.compact-quote-row:not(.inline-edit-item)');
  if (isInteractive) return;
  
  // De lo contrario, disparar el agregador inline
  addInlineQuoteItem(type);
};

window.updateCalculatedTotals = function() {
  const servSum = activeQuoteServices.reduce((s, item) => s + item.value, 0);
  const partsSum = activeQuoteParts.reduce((s, item) => s + item.value, 0);
  
  const subtotal = servSum + partsSum;
  document.getElementById('calc-subtotal').textContent = formatCurrency(subtotal);
  
  const discPercent = parseFloat(document.getElementById('calc-discount').value) || 0;
  const discountVal = subtotal * (discPercent / 100);
  
  const net = subtotal - discountVal;
  const vatInclusive = document.getElementById('calc-vat-inclusive').checked;
  
  const total = vatInclusive ? net : net * 1.19;
  document.getElementById('calc-total').textContent = formatCurrency(Math.round(total));

  // Actualizar visibilidad reactiva del botÃ³n de descarga de cotizaciÃ³n y factura
  const downloadBtn = document.getElementById('btn-download-pdf-quote');
  const waQuoteBtn = document.getElementById('btn-whatsapp-quote');
  const invoiceContainer = document.getElementById('container-download-invoice');
  if (downloadBtn) {
    const hasItems = activeQuoteServices.length > 0 || activeQuoteParts.length > 0;
    if (hasItems) {
      downloadBtn.style.display = 'flex';
      if (waQuoteBtn) waQuoteBtn.style.display = 'flex';
      if (invoiceContainer) invoiceContainer.style.display = 'inline-block';
    } else {
      const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
      const isQuoteStageOrLater = vehicle && ['cotizacion', 'reparacion', 'listo'].includes(vehicle.stage);
      if (!isQuoteStageOrLater) {
        downloadBtn.style.display = 'none';
        if (waQuoteBtn) waQuoteBtn.style.display = 'none';
        if (invoiceContainer) invoiceContainer.style.display = 'none';
      }
    }
  }
};

window.toggleQuoteNotes = function() {
  const area = document.getElementById('quote-notes');
  const arrow = document.getElementById('notes-arrow');
  
  if (!area) return;
  
  if (area.style.display === 'none') {
    area.style.display = 'block';
    if (arrow) arrow.style.transform = 'rotate(180deg)';
    area.focus();
  } else {
    area.style.display = 'none';
    if (arrow) arrow.style.transform = 'none';
  }
};

window.confirmQuoteCreation = function() {
  if (!activeReceptionVehicleId) return;

  // Si hay un renglÃ³n inline de ediciÃ³n activo, guardarlo sÃ­ncronamente primero
  const activeInlineRow = document.querySelector('.inline-edit-item');
  if (activeInlineRow) {
    const nameInput = activeInlineRow.querySelector('#inline-item-name');
    const valueInput = activeInlineRow.querySelector('#inline-item-value');
    if (nameInput && valueInput) {
      const name = nameInput.value.trim();
      const val = parseFloat(valueInput.value) || 0;
      if (name) {
        // Determinar tipo
        const isService = activeInlineRow.closest('#quote-services-list') !== null;
        const type = isService ? 'service' : 'part';
        const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
        
        if (type === 'service') {
          const cleanServiceName = ensureServiceExists(name, val);
          activeQuoteServices.push({ name: cleanServiceName, value: val });
        } else {
          const formattedPartName = ensurePartExistsInCatalog(name, val, vehicle);
          activeQuoteParts.push({ name: formattedPartName, value: val });
        }
      }
    }
    // Remover el renglÃ³n del DOM para que el blur asÃ­ncrono posterior retorne temprano sin hacer nada
    activeInlineRow.remove();
  }

  const dateVal = document.getElementById('quote-delivery-date').value;
  const timeVal = document.getElementById('quote-delivery-time').value;
  if (!dateVal || !timeVal) {
    alert('Por favor, selecciona la fecha y hora estimada de entrega del vehÃ­culo para la cotizaciÃ³n.');
    const dateInput = document.getElementById('quote-delivery-date');
    const timeInput = document.getElementById('quote-delivery-time');
    if (!dateVal && dateInput) dateInput.focus();
    else if (!timeVal && timeInput) timeInput.focus();
    return;
  }

  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;

  // Realizar Ãºltimo cÃ¡lculo
  const servSum = activeQuoteServices.reduce((s, item) => s + item.value, 0);
  const partsSum = activeQuoteParts.reduce((s, item) => s + item.value, 0);
  const subtotal = servSum + partsSum;
  const discPercent = parseFloat(document.getElementById('calc-discount').value) || 0;
  const discountVal = subtotal * (discPercent / 100);
  const net = subtotal - discountVal;
  const vatInclusive = document.getElementById('calc-vat-inclusive').checked;
  const finalTotal = vatInclusive ? net : net * 1.19;
  
  const notes = document.getElementById('quote-notes').value.trim();
  const sendEmail = document.getElementById('quote-send-email').checked;

  // Guardar en estado del vehÃ­culo
  vehicles[vehicleIndex].quoteServices = [...activeQuoteServices];
  vehicles[vehicleIndex].quoteParts = [...activeQuoteParts];
  vehicles[vehicleIndex].discountPercent = discPercent;
  vehicles[vehicleIndex].vatInclusive = vatInclusive;
  vehicles[vehicleIndex].quoteNotes = notes;
  vehicles[vehicleIndex].quoteSendEmail = sendEmail;
  vehicles[vehicleIndex].quoteCompleted = true;
  vehicles[vehicleIndex].value = Math.round(finalTotal);
  vehicles[vehicleIndex].deliveryDate = dateVal;
  vehicles[vehicleIndex].deliveryTime = timeVal;
  
  // Si estÃ¡ en RecepciÃ³n, al crear presupuesto pasa a CotizaciÃ³n de inmediato
  if (vehicles[vehicleIndex].stage === 'recepcion') {
    vehicles[vehicleIndex].stage = 'cotizacion';
  }

  saveState();
  renderApp();
  
  const vehicle = vehicles[vehicleIndex];
  updateTabStatuses(vehicle);
  
  exitDetailedReception();
};

// --- 15. NUEVA SECCIÃ“N: VISTA PREVIA Y ACCIONES DE COTIZACIÃ“N CREADA (FOTO 4) ---

window.openDetailedQuoteView = function(vehicleId) {
  openDetailedReception(vehicleId);
  setActiveTab('quote');
};

window.openDetailedWorkOrderView = function(vehicleId) {
  openDetailedReception(vehicleId);
  setActiveTab('workorder');
};

window.openDetailedDeliveryView = function(vehicleId) {
  openDetailedReception(vehicleId);
  setActiveTab('delivery');
};

window.toggleEditQuoteMode = function() {
  document.getElementById('quote-editor-view').style.display = 'block';
  document.getElementById('quote-preview-view').style.display = 'none';
  
  const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
  if (vehicle) {
    activeQuoteServices = [...(vehicle.quoteServices || [])];
    activeQuoteParts = [...(vehicle.quoteParts || [])];
    document.getElementById('calc-discount').value = vehicle.discountPercent || 0;
    document.getElementById('calc-vat-inclusive').checked = vehicle.vatInclusive !== false;
    document.getElementById('quote-notes').value = vehicle.quoteNotes || '';
    document.getElementById('quote-send-email').checked = vehicle.quoteSendEmail || false;
    document.getElementById('quote-delivery-date').value = vehicle.deliveryDate || '';
    document.getElementById('quote-delivery-time').value = vehicle.deliveryTime || '';
  }
  
  renderQuoteTab();
  updateCalculatedTotals();
};

window.renderQuotePreview = function(vehicle) {
  const servicesBody = document.getElementById('prev-services-body');
  const partsBody = document.getElementById('prev-parts-body');

  // Rellenar fecha y hora comprometida de entrega en vista previa
  const deliveryLabel = document.getElementById('prev-delivery-label');
  if (deliveryLabel) {
    if (vehicle.deliveryDate) {
      const dateObj = new Date(vehicle.deliveryDate + 'T00:00:00');
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('es-ES', options);
      const timeStr = vehicle.deliveryTime ? ` a las ${vehicle.deliveryTime} hs` : '';
      deliveryLabel.textContent = `${formattedDate}${timeStr}`;
    } else {
      deliveryLabel.textContent = 'â€”';
    }
  }
  
  const services = vehicle.quoteServices || [];
  const parts = vehicle.quoteParts || [];
  
  const elServCount = document.getElementById('prev-serv-count');
  if (elServCount) elServCount.textContent = `${services.length} ${services.length === 1 ? 'item' : 'Ã­tems'}`;
  
  const elPartsCount = document.getElementById('prev-parts-count');
  if (elPartsCount) elPartsCount.textContent = `${parts.length} ${parts.length === 1 ? 'item' : 'Ã­tems'}`;
  
  const formatVal = (val) => formatCurrency(val);

  // Servicios
  if (servicesBody) {
    if (services.length === 0) {
      servicesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 16px;">Sin servicios agregados.</td></tr>`;
    } else {
      const servicesSum = services.reduce((sum, item) => sum + item.value, 0);
      servicesBody.innerHTML = services.map(item => `
        <tr>
          <td style="font-family: var(--font-mono); color: var(--text-muted); padding: 12px 14px;">â€”</td>
          <td style="font-weight: 500; color: var(--text-primary); padding: 12px 14px;">${item.name}</td>
          <td style="color: var(--text-secondary); padding: 12px 14px;">1 servicio</td>
          <td style="text-align: right; color: var(--text-secondary); padding: 12px 14px;">${formatVal(item.value)}</td>
          <td style="text-align: right; font-weight: 600; color: var(--text-primary); padding: 12px 14px;">${formatVal(item.value)}</td>
        </tr>
      `).join('') + `
        <tr class="subtotal-row" style="background-color: transparent;">
          <td colspan="4" style="text-align: right; font-weight: 600; color: var(--text-secondary); padding: 16px 14px 8px;">Subtotal servicios</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary); padding: 16px 14px 8px;">${formatVal(servicesSum)}</td>
        </tr>
      `;
    }
  }

  // Repuestos
  if (partsBody) {
    if (parts.length === 0) {
      partsBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 16px;">Sin repuestos agregados.</td></tr>`;
    } else {
      const partsSum = parts.reduce((sum, item) => sum + item.value, 0);
      partsBody.innerHTML = parts.map(item => `
        <tr>
          <td style="font-family: var(--font-mono); color: var(--text-muted); padding: 12px 14px;">â€”</td>
          <td style="font-weight: 500; color: var(--text-primary); padding: 12px 14px;">${item.name}</td>
          <td style="color: var(--text-secondary); padding: 12px 14px;">1 unidad</td>
          <td style="text-align: right; color: var(--text-secondary); padding: 12px 14px;">${formatVal(item.value)}</td>
          <td style="text-align: right; font-weight: 600; color: var(--text-primary); padding: 12px 14px;">${formatVal(item.value)}</td>
        </tr>
      `).join('') + `
        <tr class="subtotal-row" style="background-color: transparent;">
          <td colspan="4" style="text-align: right; font-weight: 600; color: var(--text-secondary); padding: 16px 14px 8px;">Subtotal repuestos</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary); padding: 16px 14px 8px;">${formatVal(partsSum)}</td>
        </tr>
      `;
    }
  }

  // Resumen Final
  const elTotal = document.getElementById('prev-total-value');
  if (elTotal) elTotal.textContent = formatVal(vehicle.value);
  const taxLabel = document.getElementById('prev-tax-label');
  if (taxLabel) {
    if (vehicle.vatInclusive !== false) {
      taxLabel.textContent = "Precios con impuesto incluido.";
    } else {
      taxLabel.textContent = "Precios mÃ¡s IVA (19%).";
    }
  }
};

window.approveQuoteAndCreateWorkOrder = function() {
  if (!activeReceptionVehicleId) return;
  
  // Si hay un renglÃ³n inline de ediciÃ³n activo, guardarlo sÃ­ncronamente primero
  const activeInlineRow = document.querySelector('.inline-edit-item');
  if (activeInlineRow) {
    const nameInput = activeInlineRow.querySelector('#inline-item-name');
    const valueInput = activeInlineRow.querySelector('#inline-item-value');
    if (nameInput && valueInput) {
      const name = nameInput.value.trim();
      const val = parseFloat(valueInput.value) || 0;
      if (name) {
        // Determinar tipo
        const isService = activeInlineRow.closest('#quote-services-list') !== null;
        const type = isService ? 'service' : 'part';
        const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
        
        if (type === 'service') {
          const cleanServiceName = ensureServiceExists(name, val);
          activeQuoteServices.push({ name: cleanServiceName, value: val });
        } else {
          const formattedPartName = ensurePartExistsInCatalog(name, val, vehicle);
          activeQuoteParts.push({ name: formattedPartName, value: val });
        }
      }
    }
    activeInlineRow.remove();
  }
  
  const vehicleIndex = vehicles.findIndex(v => String(v.id) === String(activeReceptionVehicleId));
  if (vehicleIndex === -1) return;
  
  const vehicle = vehicles[vehicleIndex];

  // Sincronizar cotizaciÃ³n actual por si hubo adiciones
  vehicle.quoteServices = [...activeQuoteServices];
  vehicle.quoteParts = [...activeQuoteParts];
  
  // Obtener fecha y hora directamente de las cajas del panel de cotizaciÃ³n
  const deliveryDateVal = document.getElementById('quote-delivery-date')?.value || '';
  const deliveryTimeVal = document.getElementById('quote-delivery-time')?.value || '';
  
  if (!deliveryDateVal || !deliveryTimeVal) {
    setActiveTab('quote');
    alert('Por favor, ingresa primero la fecha y hora estimada de entrega en la cotización.');
    const dateInput = document.getElementById('quote-delivery-date');
    const timeInput = document.getElementById('quote-delivery-time');
    if (!deliveryDateVal && dateInput) dateInput.focus();
    else if (!deliveryTimeVal && timeInput) timeInput.focus();
    return;
  }
  
  // Guardar en el vehículo
  vehicle.deliveryDate = deliveryDateVal;
  vehicle.deliveryTime = deliveryTimeVal;
  
  // Aprobar la cotización (quoteCompleted = true) pero la comanda no se mueve a OT
  vehicle.quoteCompleted = true;

  // Sincronizar switch del footer si existe
  const quoteSwitch = document.getElementById('input-approve-quote-switch');
  const quoteSwitchLabel = document.getElementById('label-approve-quote-switch');
  if (quoteSwitch) {
    quoteSwitch.checked = true;
    const slider = quoteSwitch.nextElementSibling;
    if (slider) {
      slider.style.setProperty('background-color', 'var(--color-listo)', 'important');
    }
  }
  if (quoteSwitchLabel) {
    quoteSwitchLabel.textContent = 'Cotización aprobada';
    quoteSwitchLabel.style.color = 'var(--color-listo)';
  }
  
  // Agregar todos los servicios y repuestos como tareas de la OT automáticamente (para cuando pase a OT)
  const services = vehicle.quoteServices || [];
  const parts = vehicle.quoteParts || [];
  const combinedNames = [...services.map(s => s.name), ...parts.map(p => p.name)];
  
  vehicle.otTasks = combinedNames.map(name => ({ name, completed: false, observation: '' }));
  
  saveState();
  
  // Abrir la ficha técnica en la pestaña de Cotización (donde ya está)
  openDetailedReception(activeReceptionVehicleId);
  
  // Refrescar Kanban
  renderApp();
  
  alert('¡Cotización aprobada con éxito!');
};

// --- 16. DETALLE E INTERACTIVIDAD DE LA ORDEN DE TRABAJO EN TALLER (FOTO 2) ---

window.renderOTTab = function() {
  const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
  if (!vehicle) return;

  // Rellenar fecha y hora comprometida de entrega en OT (vista de solo lectura)
  const otDeliveryLabel = document.getElementById('ot-delivery-label');
  if (otDeliveryLabel) {
    if (vehicle.deliveryDate) {
      const dateObj = new Date(vehicle.deliveryDate + 'T00:00:00');
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('es-ES', options);
      const timeStr = vehicle.deliveryTime ? ` a las ${vehicle.deliveryTime} hs` : '';
      otDeliveryLabel.textContent = `${formattedDate}${timeStr}`;
    } else {
      otDeliveryLabel.textContent = 'â€”';
    }
  }
  
  // 1. Descripción del trabajo
  const descBox = document.getElementById('ot-job-description');
  if (descBox) {
    descBox.textContent = vehicle.services || 'Sin especificaciones detalladas.';
  }
  
  // 2. Tareas de la orden
  const tasksList = document.getElementById('ot-tasks-list');
  if (!tasksList) return;
  
  // Inicializar otTasks si no existían
  if (!vehicle.otTasks || vehicle.otTasks.length === 0) {
    const services = vehicle.quoteServices || [];
    const parts = vehicle.quoteParts || [];
    vehicle.otTasks = [
      ...services.map(s => ({ name: s.name, completed: false, observation: '', type: 'service' })),
      ...parts.map(p => ({ name: p.name, completed: false, observation: '', type: 'part' }))
    ];
  }

  // Asegurar que todas las tareas tengan la propiedad type
  vehicle.otTasks.forEach(task => {
    if (!task.type) {
      const isPart = (vehicle.quoteParts || []).some(p => p.name === task.name);
      task.type = isPart ? 'part' : 'service';
    }
  });
  
  const completedCount = vehicle.otTasks.filter(t => t.completed).length;
  const otTasksHeader = document.getElementById('ot-tasks-header');
  if (otTasksHeader) otTasksHeader.textContent = `Tareas ${completedCount}/${vehicle.otTasks.length} completadas`;
  
  const serviceTasks = vehicle.otTasks.filter(t => t.type === 'service');
  const partTasks = vehicle.otTasks.filter(t => t.type === 'part');

  // Renderizado dinámico de tareas con las mismas tablas compactas que Cotización
  let html = '';

  // A. Bloque de Tareas de Servicios
  const completedServices = serviceTasks.filter(t => t.completed).length;
  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: var(--card-bg-hover); border-radius: var(--radius-md); font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text-primary); margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>Servicios</span>
        <span style="font-weight: normal; font-size: 12px; color: var(--text-muted);">(${completedServices}/${serviceTasks.length})</span>
        <span style="background-color: rgba(22, 163, 74, 0.08); color: #16a34a; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-left: 4px; text-transform: uppercase;">Checklist</span>
      </div>
      <span>Estado</span>
    </div>
  `;

  if (serviceTasks.length > 0) {
    html += serviceTasks.map(task => {
      const globalIndex = vehicle.otTasks.findIndex(t => t === task);
      return `
        <div class="compact-quote-row" style="display: flex; flex-direction: column; padding: 10px 16px; border-bottom: 1.5px solid var(--border-color); min-height: 40px; box-sizing: border-box; transition: background-color 0.15s;" onmouseover="this.style.backgroundColor='var(--card-bg-hover)'" onmouseout="this.style.backgroundColor='transparent'">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <label class="checkbox-container" style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 0;">
              <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleOTTask(${globalIndex})">
              <span class="custom-checkbox"></span>
              <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
            </label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12.5px; color: ${task.completed ? '#16a34a' : 'var(--text-muted)'}; font-weight: 600;">
                ${task.completed ? 'Completada' : 'Pendiente'}
              </span>
              <button onclick="toggleOTTaskObs(${globalIndex})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Añadir Observación">
                <i data-lucide="message-square" style="width: 14px; height: 14px; ${task.observation ? 'color: #c2410c;' : ''}"></i>
              </button>
            </div>
          </div>
          <div class="ot-task-obs-box" id="ot-task-obs-box-${globalIndex}" style="display: ${task.observation ? 'block' : 'none'}; width: 100%; margin-top: 8px;">
            <textarea class="form-input ot-task-obs-textarea" id="ot-task-obs-text-${globalIndex}" rows="2" placeholder="Añadir nota técnica o detalle sobre el avance de esta tarea..." style="font-size: 11px; padding: 8px; resize: none; width: 100%; box-sizing: border-box; background-color: var(--card-bg-hover);" onblur="saveOTTaskObs(${globalIndex})">${task.observation || ''}</textarea>
          </div>
        </div>
      `;
    }).join('');
  } else {
    html += `<span style="font-size: 12px; color: var(--text-muted); font-style: italic; padding: 10px 16px; display: block;">No hay servicios en esta orden.</span>`;
  }

  // B. Bloque de Tareas de Repuestos
  const completedParts = partTasks.filter(t => t.completed).length;
  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: var(--card-bg-hover); border-radius: var(--radius-md); font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text-primary); margin-top: 24px; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>Repuestos e Insumos</span>
        <span style="font-weight: normal; font-size: 12px; color: var(--text-muted);">(${completedParts}/${partTasks.length})</span>
        <span style="background-color: rgba(22, 163, 74, 0.08); color: #16a34a; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-left: 4px; text-transform: uppercase;">Checklist</span>
      </div>
      <span>Estado</span>
    </div>
  `;

  if (partTasks.length > 0) {
    html += partTasks.map(task => {
      const globalIndex = vehicle.otTasks.findIndex(t => t === task);
      return `
        <div class="compact-quote-row" style="display: flex; flex-direction: column; padding: 10px 16px; border-bottom: 1.5px solid var(--border-color); min-height: 40px; box-sizing: border-box; transition: background-color 0.15s;" onmouseover="this.style.backgroundColor='var(--card-bg-hover)'" onmouseout="this.style.backgroundColor='transparent'">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <label class="checkbox-container" style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 0;">
              <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleOTTask(${globalIndex})">
              <span class="custom-checkbox"></span>
              <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name}</span>
            </label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12.5px; color: ${task.completed ? '#16a34a' : 'var(--text-muted)'}; font-weight: 600;">
                ${task.completed ? 'Completada' : 'Pendiente'}
              </span>
              <button onclick="toggleOTTaskObs(${globalIndex})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Añadir Observación">
                <i data-lucide="message-square" style="width: 14px; height: 14px; ${task.observation ? 'color: #c2410c;' : ''}"></i>
              </button>
            </div>
          </div>
          <div class="ot-task-obs-box" id="ot-task-obs-box-${globalIndex}" style="display: ${task.observation ? 'block' : 'none'}; width: 100%; margin-top: 8px;">
            <textarea class="form-input ot-task-obs-textarea" id="ot-task-obs-text-${globalIndex}" rows="2" placeholder="Añadir nota técnica o detalle sobre el avance de esta tarea..." style="font-size: 11px; padding: 8px; resize: none; width: 100%; box-sizing: border-box; background-color: var(--card-bg-hover);" onblur="saveOTTaskObs(${globalIndex})">${task.observation || ''}</textarea>
          </div>
        </div>
      `;
    }).join('');
  } else {
    html += `<span style="font-size: 12px; color: var(--text-muted); font-style: italic; padding: 10px 16px; display: block;">No hay repuestos en esta orden.</span>`;
  }

  tasksList.innerHTML = html;
  
  initLucide();

  // Cargar observaciones guardadas
  const obsField = document.getElementById('ot-observations');
  if (obsField) obsField.value = vehicle.otObservations || '';

  // Renderizar imÃ¡genes guardadas
  renderOTImages();

  // Actualizar badge de etapa
  const stageBadge = document.getElementById('ot-stage-badge');
  if (stageBadge) {
    const stageMap = {
      recepcion:  { label: 'En recepciÃ³n',  cls: 'stage-recepcion-badge' },
      en_proceso: { label: 'En proceso',     cls: 'stage-pending-badge'   },
      listo:      { label: 'Listo',          cls: 'stage-listo-badge'     },
      entregado:  { label: 'Entregado',      cls: 'stage-entregado-badge' },
    };
    const s = stageMap[vehicle.stage] || { label: vehicle.stage || 'En proceso', cls: 'stage-pending-badge' };
    stageBadge.textContent = s.label;
    stageBadge.className = s.cls;
    stageBadge.style.cssText = 'font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;';
  }
};


window.toggleOTTask = function(index) {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;
  
  vehicles[vehicleIndex].otTasks[index].completed = !vehicles[vehicleIndex].otTasks[index].completed;
  saveState();
  
  renderOTTab();
};

window.toggleOTTaskObs = function(index) {
  const box = document.getElementById(`ot-task-obs-box-${index}`);
  const arrow = document.getElementById(`ot-task-arrow-${index}`);
  if (box.style.display === 'none') {
    box.style.display = 'block';
    arrow.style.transform = 'rotate(180deg)';
    document.getElementById(`ot-task-obs-text-${index}`).focus();
  } else {
    box.style.display = 'none';
    arrow.style.transform = 'none';
  }
};

window.saveOTTaskObs = function(index) {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;
  
  const text = document.getElementById(`ot-task-obs-text-${index}`).value.trim();
  vehicles[vehicleIndex].otTasks[index].observation = text;
  saveState();
};

// â”€â”€ Aceptar y Actualizar OT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.saveOTAndUpdate = function() {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;

  // Guardar observaciones
  const obsField = document.getElementById('ot-observations');
  if (obsField) vehicles[vehicleIndex].otObservations = obsField.value.trim();

  saveState();
  renderApp();

  // Toast de confirmaciÃ³n
  const toast = document.createElement('div');
  toast.textContent = 'âœ“ Orden de trabajo actualizada';
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: #00b050; color: white; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,176,80,0.3);
    animation: slide-up 0.2s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

// â”€â”€ Observaciones generales de la OT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.saveOTObservations = function() {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;
  const val = document.getElementById('ot-observations')?.value ?? '';
  vehicles[vehicleIndex].otObservations = val;
  saveState();
};

// â”€â”€ ImÃ¡genes de la OT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.addOTImages = function(event) {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;

  const files = Array.from(event.target.files);
  if (!files.length) return;

  // Reset input so same file can be re-added if removed
  event.target.value = '';

  if (!vehicles[vehicleIndex].otImages) vehicles[vehicleIndex].otImages = [];

  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      vehicles[vehicleIndex].otImages.push({ src: e.target.result, name: file.name });
      loaded++;
      if (loaded === files.length) {
        saveState();
        renderOTImages();
      }
    };
    reader.readAsDataURL(file);
  });
};

window.removeOTImage = function(index) {
  if (!activeReceptionVehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => v.id === activeReceptionVehicleId);
  if (vehicleIndex === -1) return;
  vehicles[vehicleIndex].otImages.splice(index, 1);
  saveState();
  renderOTImages();
};

window.renderOTImages = function() {
  const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
  if (!vehicle) return;

  const grid = document.getElementById('ot-images-grid');
  const empty = document.getElementById('ot-images-empty');
  if (!grid || !empty) return;

  const images = vehicle.otImages || [];

  if (images.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = images.map((img, i) => `
    <div style="position: relative; width: 80px; height: 80px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0;">
      <img src="${img.src}" alt="${img.name}" title="${img.name}"
        style="width: 100%; height: 100%; object-fit: cover; display: block; cursor: pointer;"
        onclick="window.open('${img.src}', '_blank')">
      <button onclick="removeOTImage(${i})" title="Eliminar imagen"
        style="position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.65); border: none; color: white; font-size: 11px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">Ã—</button>
    </div>
  `).join('');
};

window.deleteActiveVehicleFromFicha = function() {
  if (!activeReceptionVehicleId) return;
  
  if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este registro de vehÃ­culo permanentemente?')) {
    vehicles = vehicles.filter(v => v.id !== activeReceptionVehicleId);
    saveState();
    exitDetailedReception();
    renderApp();
    alert('VehÃ­culo eliminado permanentemente.');
  }
};

/* 
========================================================================
   17. LOGICA COMPLEMENTARIA DE NUEVAS VISTAS (FOTO 1, 2, 3, 4)
========================================================================
*/

// --- ACORDEÃ“N DE LA BARRA LATERAL ---
window.toggleMenuCollapse = function(groupId) {
  const sublist = document.getElementById(groupId);
  if (!sublist) return;
  const header = sublist.previousElementSibling;
  
  if (sublist.classList.contains('expanded')) {
    sublist.classList.remove('expanded');
    if (header) header.classList.remove('expanded');
  } else {
    sublist.classList.add('expanded');
    if (header) header.classList.add('expanded');
  }
};

// --- 1. RENDERIZADOR DE REPORTES (SCREEN 1) ---
// --- 1. RENDERIZADOR DE REPORTES (SCREEN 1) ---
window.renderReportesView = function() {
  let filteredVehicles = [...vehicles];
  const periodSelect = document.getElementById('rep-period');
  const period = periodSelect ? periodSelect.value : 'Todos';
  const labelEl = document.getElementById('rep-period-label');

  const now = new Date();
  if (period === 'Este mes') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    filteredVehicles = vehicles.filter(v => (v.entryTime || 0) >= startOfMonth);
    if (labelEl) labelEl.textContent = `Desde ${new Date(startOfMonth).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — Hoy`;
  } else if (period === 'Este año') {
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    filteredVehicles = vehicles.filter(v => (v.entryTime || 0) >= startOfYear);
    if (labelEl) labelEl.textContent = `Desde 1 de ene. — Hoy`;
  } else {
    if (labelEl) labelEl.textContent = 'Datos Consolidados';
  }

  // A. Métricas Celestes en vivo (Tarjetas de Control)
  // Facturación Real
  const finishedVehicles = filteredVehicles.filter(v => v.delivered || v.stage === 'listo');
  const totalIncome = finishedVehicles.reduce((sum, v) => sum + (v.value || 0), 0);
  const finishedCount = finishedVehicles.length;

  document.getElementById('rep-income-val').textContent = formatCurrency(totalIncome);
  const incomeSubText = document.getElementById('rep-income-sub');
  if (incomeSubText) {
    incomeSubText.textContent = `${finishedCount} ${finishedCount === 1 ? 'OT finalizada' : 'OTs finalizadas'}`;
  }

  // Valor en Progreso
  const activeVehicles = filteredVehicles.filter(v => !v.delivered && v.stage !== 'listo');
  const totalPipeline = activeVehicles.reduce((sum, v) => sum + (v.value || 0), 0);
  const activeCount = activeVehicles.length;

  document.getElementById('rep-pipeline-val').textContent = formatCurrency(totalPipeline);
  const pipelineSubText = document.getElementById('rep-pipeline-sub');
  if (pipelineSubText) {
    pipelineSubText.textContent = `${activeCount} ${activeCount === 1 ? 'OT activa' : 'OTs activas'}`;
  }

  // Ticket Promedio
  const avgTicket = finishedCount > 0 ? totalIncome / finishedCount : 0;
  document.getElementById('rep-ticket-val').textContent = formatCurrency(avgTicket);

  // Tiempo Promedio de Reparación
  const deliveredWithTime = finishedVehicles.filter(v => v.deliveryTime && v.entryTime && v.deliveryTime > v.entryTime);
  let avgDays = 0;
  if (deliveredWithTime.length > 0) {
    const totalMs = deliveredWithTime.reduce((sum, v) => sum + (v.deliveryTime - v.entryTime), 0);
    avgDays = totalMs / (1000 * 60 * 60 * 24);
  } else {
    avgDays = finishedCount > 0 ? 1.8 : 0; // fallback simulado inicial razonable si no hay registrados en vivo
  }
  avgDays = Math.round(avgDays * 10) / 10;
  document.getElementById('rep-time-val').textContent = `${avgDays} ${avgDays === 1 ? 'día' : 'días'}`;

  // B. Marcas Populares (Distribución de Flota)
  const brandCounts = {};
  filteredVehicles.forEach(v => {
    if (!v.brand) return;
    const b = v.brand.trim();
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  });
  const sortedBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const maxBrandCount = sortedBrands.length > 0 ? sortedBrands[0][1] : 1;
  const brandsContainer = document.getElementById('rep-brands-container');
  if (brandsContainer) {
    if (sortedBrands.length === 0) {
      brandsContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-muted); font-style: italic;">Sin datos de marcas disponibles.</span>`;
    } else {
      brandsContainer.innerHTML = sortedBrands.map(([brand, count]) => {
        const pct = Math.round((count / maxBrandCount) * 100);
        return `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600;">
              <span style="color: var(--text-primary);">${brand}</span>
              <span style="color: var(--text-secondary);">${count} ${count === 1 ? 'auto' : 'autos'}</span>
            </div>
            <div style="height: 8px; width: 100%; background: var(--border-color); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: var(--color-accent); border-radius: 4px; transition: width 0.4s ease-out;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // C. Antigüedad de la Flota
  const totalWithYear = filteredVehicles.filter(v => v.year).length;
  let nuevosCount = 0;
  let medianosCount = 0;
  let antiguosCount = 0;
  filteredVehicles.forEach(v => {
    if (!v.year) return;
    const y = parseInt(v.year);
    if (y >= 2022) nuevosCount++;
    else if (y >= 2012) medianosCount++;
    else antiguosCount++;
  });

  let nuevosPct = 0, medianosPct = 0, antiguosPct = 0;
  if (totalWithYear > 0) {
    nuevosPct = Math.round((nuevosCount / totalWithYear) * 100);
    medianosPct = Math.round((medianosCount / totalWithYear) * 100);
    antiguosPct = 100 - nuevosPct - medianosPct;
    if (antiguosPct < 0) antiguosPct = 0;
  }

  const nuevosBar = document.getElementById('rep-age-nuevos-bar');
  const nuevosPctEl = document.getElementById('rep-age-nuevos-pct');
  if (nuevosBar && nuevosPctEl) {
    nuevosBar.style.width = `${nuevosPct}%`;
    nuevosPctEl.textContent = `${nuevosPct}% (${nuevosCount})`;
  }
  
  const medianosBar = document.getElementById('rep-age-medianos-bar');
  const medianosPctEl = document.getElementById('rep-age-medianos-pct');
  if (medianosBar && medianosPctEl) {
    medianosBar.style.width = `${medianosPct}%`;
    medianosPctEl.textContent = `${medianosPct}% (${medianosCount})`;
  }
  
  const antiguosBar = document.getElementById('rep-age-antiguos-bar');
  const antiguosPctEl = document.getElementById('rep-age-antiguos-pct');
  if (antiguosBar && antiguosPctEl) {
    antiguosBar.style.width = `${antiguosPct}%`;
    antiguosPctEl.textContent = `${antiguosPct}% (${antiguosCount})`;
  }

  // D. Servicios Más Demandados
  const serviceCounts = {};
  filteredVehicles.forEach(v => {
    const sList = Array.isArray(v.services) ? v.services : [];
    sList.forEach(sName => {
      if (!sName) return;
      const name = sName.trim();
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
    const qsList = Array.isArray(v.quoteServices) ? v.quoteServices : [];
    qsList.forEach(qs => {
      if (!qs || !qs.name) return;
      const name = qs.name.trim();
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
  });

  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const servicesContainer = document.getElementById('rep-services-container');
  if (servicesContainer) {
    if (sortedServices.length === 0) {
      servicesContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-muted); font-style: italic;">Sin servicios registrados.</span>`;
    } else {
      servicesContainer.innerHTML = sortedServices.map(([sName, count], idx) => {
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--card-bg);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 800; color: var(--color-accent); font-size: 13px; width: 16px;">${idx + 1}.</span>
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${sName}">${sName}</span>
            </div>
            <span class="stage-pending-badge badge-blue" style="font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${count} ${count === 1 ? 'vez' : 'veces'}</span>
          </div>
        `;
      }).join('');
    }
  }

  // E. Clientes Estrella (Ranking por volumen de facturación)
  const clientRevenue = {};
  const clientVisits = {};
  finishedVehicles.forEach(v => {
    if (!v.client) return;
    const cName = v.client.trim();
    clientRevenue[cName] = (clientRevenue[cName] || 0) + (v.value || 0);
    clientVisits[cName] = (clientVisits[cName] || 0) + 1;
  });

  const sortedClients = Object.entries(clientRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const clientsContainer = document.getElementById('rep-clients-container');
  if (clientsContainer) {
    if (sortedClients.length === 0) {
      clientsContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-muted); font-style: italic;">Sin facturación histórica en este período.</span>`;
    } else {
      clientsContainer.innerHTML = sortedClients.map(([cName, rev], idx) => {
        const visits = clientVisits[cName] || 0;
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--card-bg);">
            <div style="display: flex; align-items: center; gap: 10px;">
               <span style="font-weight: 800; color: #10b981; font-size: 13px; width: 16px;">${idx + 1}.</span>
               <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">${cName}</span>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 12.5px; font-weight: 700; color: #10b981;">${formatCurrency(rev)}</span>
              <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 500;">${visits} ${visits === 1 ? 'visita' : 'visitas'}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // F. Tasa de Fidelidad (Clientes Recurrentes vs. Nuevos)
  const allClientVisits = {};
  vehicles.forEach(v => {
    if (!v.client) return;
    const cName = v.client.trim();
    allClientVisits[cName] = (allClientVisits[cName] || 0) + 1;
  });

  let recurrentCount = 0;
  let newCount = 0;
  Object.values(allClientVisits).forEach(visits => {
    if (visits >= 2) recurrentCount++;
    else newCount++;
  });

  const totalClientsCount = recurrentCount + newCount;
  let recPct = 0;
  let newPct = 0;
  if (totalClientsCount > 0) {
    recPct = Math.round((recurrentCount / totalClientsCount) * 100);
    newPct = 100 - recPct;
  }

  const recBar = document.getElementById('rep-loyalty-rec-bar');
  const newBar = document.getElementById('rep-loyalty-new-bar');
  const recCountEl = document.getElementById('rep-loyalty-rec-count');
  const newCountEl = document.getElementById('rep-loyalty-new-count');

  if (recBar && newBar) {
    recBar.style.width = `${recPct}%`;
    recBar.textContent = recPct > 0 ? `${recPct}%` : '';
    newBar.style.width = `${newPct}%`;
    newBar.textContent = newPct > 0 ? `${newPct}%` : '';
  }
  if (recCountEl) recCountEl.textContent = `(${recurrentCount} ${recurrentCount === 1 ? 'cliente' : 'clientes'})`;
  if (newCountEl) newCountEl.textContent = `(${newCount} ${newCount === 1 ? 'cliente' : 'clientes'})`;
};

// --- 2. RENDERIZADOR DE VEHÃCULOS INGRESADOS (SCREEN 2) ---
window.renderVehiclesListTable = function() {
  const searchInput = document.getElementById('sidebar-search-input');
  const stageSelect = document.getElementById('ingresos-stage-select');
  const container = document.getElementById('ingresos-cards-container');
  if (!container) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterStage = stageSelect ? stageSelect.value : 'Todos';

  // Contadores Celestes
  const activeVehicles = vehicles.filter(v => !v.delivered);
  document.getElementById('badge-total-count').textContent = `Total: ${activeVehicles.length}`;
  document.getElementById('badge-quoted-count').textContent = `Con cotización: ${activeVehicles.filter(v => v.quoteCompleted).length}`;
  document.getElementById('badge-ot-count').textContent = `Con OT: ${activeVehicles.filter(v => v.stage === 'reparacion' || v.stage === 'listo').length}`;
  document.getElementById('badge-rep-count').textContent = `En reparación: ${activeVehicles.filter(v => v.stage === 'reparacion').length}`;
  document.getElementById('badge-done-count').textContent = `Finalizados: ${activeVehicles.filter(v => v.stage === 'listo').length}`;

  let list = [...activeVehicles];

  // Buscar coincidencia
  if (searchVal) {
    list = list.filter(v => {
      const isGolMock = v.id === 'mock-vehicle-gol-2026';
      const indexNum = isGolMock ? '2' : (v.id && v.id.length >= 2 ? v.id.substring(v.id.length - 2) : '01');
      const client = v.client ? v.client.toLowerCase() : '';
      const phone = v.clientPhone ? v.clientPhone.toLowerCase() : '';
      const plate = v.plate ? v.plate.toLowerCase() : '';
      const brand = v.brand ? v.brand.toLowerCase() : '';
      const model = v.model ? v.model.toLowerCase() : '';
      
      // Normalizar patentes para búsqueda insensible a espacios, guiones o mayúsculas
      const normPlate = plate.replace(/[^a-z0-9]/g, '');
      const normSearch = searchVal.replace(/[^a-z0-9]/g, '');
      
      return client.includes(searchVal) || 
             phone.includes(searchVal) || 
             plate.includes(searchVal) || 
             (normPlate && normSearch && normPlate.includes(normSearch)) ||
             brand.includes(searchVal) || 
             model.includes(searchVal) ||
             `#${indexNum}`.includes(searchVal);
    });
  }

  // Filtrar por Etapa
  if (filterStage !== 'Todos') {
    if (filterStage === 'Pendientes') {
      list = list.filter(v => v.stage === 'recepcion');
    } else if (filterStage === 'En proceso') {
      list = list.filter(v => v.stage === 'cotizacion' || v.stage === 'reparacion');
    } else if (filterStage === 'Finalizados') {
      list = list.filter(v => v.stage === 'listo');
    }
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; background: var(--card-bg); border: 1.5px dashed var(--border-color); border-radius: var(--radius-lg); gap: 16px;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: hsla(var(--color-accent-hsl), 0.1); color: var(--color-accent); display: flex; align-items: center; justify-content: center;">
          <i data-lucide="car" style="width: 32px; height: 32px;"></i>
        </div>
        <div>
          <h3 style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No hay vehículos en el taller</h3>
          <p style="font-size: 13px; color: var(--text-secondary); max-width: 300px; margin: 0 auto;">No se encontraron vehículos ingresados activos que coincidan con la búsqueda o filtro.</p>
        </div>
        <button class="btn-primary" style="background-color: var(--color-accent); color: white; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; padding: 10px 18px; margin-top: 8px;" onclick="openAddVehicleModal('recepcion')">
          <i data-lucide="plus" style="width: 14px;"></i> Nuevo Ingreso
        </button>
      </div>
    `;
    initLucide();
    return;
  }

  container.innerHTML = list.map(v => {
    const isGolMock = v.id === 'mock-vehicle-gol-2026';
    const indexNum = isGolMock ? '2' : v.id.substring(v.id.length - 2, v.id.length);

    let badgeClass = '';
    let stateName = '';
    if (v.stage === 'recepcion') {
      badgeClass = 'badge-blue';
      stateName = 'Trabajo por realizar';
    } else if (v.stage === 'cotizacion') {
      badgeClass = 'badge-violet';
      stateName = 'En cotización';
    } else if (v.stage === 'reparacion') {
      badgeClass = 'badge-red';
      stateName = 'En reparación';
    } else if (v.stage === 'listo') {
      badgeClass = 'badge-green';
      stateName = 'Listo';
    }

    const relTime = getRelativeSpanishTime(v.entryTime);
    const brandNormalized = v.brand ? v.brand.toLowerCase().trim().replace(/\s+/g, '-') : '';

    // Lista de marcas que se sabe que tienen el logo en formato PNG
    const pngBrands = [
      "brilliance", "buick", "cadillac", "changan", "chery", "chevrolet", "daewoo", 
      "datsun", "de-tomaso", "desoto", "dodge", "dongfeng", "fisker", "ford", 
      "gaz", "gmc", "great-wall", "haval", "hispano-suiza", "honda", "hongqi", 
      "jac", "karma", "lamborghini", "lancia", "leapmotor", "lexus", "ligier", 
      "lister", "lucid", "mg", "mahindra", "maserati", "maxus", "maybach", 
      "mercury", "mitsuoka", "morgan", "morris", "nio", "noble", "ora", 
      "oldsmobile", "omoda", "pagani", "perodua", "pininfarina", "plymouth", 
      "polaris", "polestar", "pontiac", "praga", "proton", "puma", "reliant", 
      "rimac", "rover", "ruf", "saab", "saleen", "saturn", "scg", "scion", 
      "seres", "smart", "ssangyong", "subaru", "tvr", "talbot", "tata", 
      "tatra", "uaz", "vauxhall", "venturi", "vinfast", "w-motors", "wartburg", 
      "westfield", "xpeng", "zaz", "zeekr", "zenvo", "zotye"
    ];
    const logoExt = pngBrands.includes(brandNormalized) ? 'png' : 'svg';
    const fallbackExt = logoExt === 'svg' ? 'png' : 'svg';

    return `
      <div class="reception-form-card" onclick="openDetailedReception('${v.id}')" style="padding: 20px; display: flex; flex-direction: column; gap: 14px; position: relative; border: 1.5px solid var(--border-color); background: var(--card-bg); transition: box-shadow var(--transition-normal), transform var(--transition-normal); border-radius: var(--radius-md); cursor: pointer; overflow: visible;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
        <!-- Fondo Decorativo de Logo de Marca -->
        ${(brandNormalized && localStorage.getItem('taller_logos_enabled') !== 'false') ? `
        <img src="brand-logos-main/${brandNormalized}-logo.${logoExt}" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='brand-logos-main/${brandNormalized}-logo.${fallbackExt}';this.className='brand-logo-img brand-logo-${fallbackExt}';}else{this.style.display='none';}" alt="${v.brand}" class="brand-logo-img brand-logo-${logoExt}" />
        ` : ''}

        <!-- Capa de Contenido Principal (Garantiza legibilidad y z-index controlado) -->
        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; height: 100%; width: 100%;">
          <!-- Fila de arriba (ID y Chapa Patente) -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: var(--font-display); font-weight: 800; color: var(--text-muted); font-size: 13px; letter-spacing: 0.5px;">#${indexNum}</span>
            <span class="license-plate" style="letter-spacing: 0.5px;">${v.plate}</span>
          </div>

          <!-- Datos del Vehículo -->
          <div style="margin-top: 4px;">
            <h3 style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0;">${v.brand} ${v.model}</h3>
            <span style="font-size: 12px; color: var(--text-secondary); display: block; margin-top: 4px;">Color: <strong>${v.color || '—'}</strong> | Año: <strong>${v.year || '—'}</strong></span>
          </div>

          <!-- Datos del Cliente (Iconografía de alta gama) -->
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 4px;">
            <span style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
              <i data-lucide="user" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
              <span style="color: var(--text-primary); font-weight: 600;">${v.client}</span>
            </span>
            <span style="display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 12px;">
              <i data-lucide="phone" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
              <span>${v.clientPhone || 'Sin teléfono'}</span>
            </span>
          </div>

          <!-- Fila de abajo (Estado, Fecha e Ingreso a Ficha) -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: auto; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <span class="stage-pending-badge ${badgeClass}" style="font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px; width: fit-content; text-transform: uppercase; letter-spacing: 0.3px;">${stateName}</span>
              <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                <span>Ingreso: ${relTime}</span>
              </span>
            </div>
            <button class="table-action-btn more-btn" onclick="event.stopPropagation(); openDetailedReception('${v.id}')" title="Ver Ficha Técnica" style="flex-shrink: 0; margin-bottom: 2px;">
              <i data-lucide="more-horizontal"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  initLucide();
};

function getRelativeSpanishTime(timestamp) {
  if (!timestamp) return 'hace un momento';
  const diffMs = Date.now() - timestamp;
  const totalSecs = Math.floor(diffMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    if (days === 1) return 'Ayer';
    return `hace ${days} dÃ­as`;
  }
  if (hours > 0) {
    if (hours === 1) return 'hace alrededor de 1 hora';
    return `hace alrededor de ${hours} horas`;
  }
  if (mins > 0) {
    if (mins === 1) return 'hace 1 minuto';
    return `hace ${mins} minutos`;
  }
  return 'hace unos segundos';
}

// --- 3. RENDERIZADOR DE COTIZACIONES (SCREEN 3) ---
window.renderCotizacionesTable = function() {
  const searchInput = document.getElementById('cotizaciones-search-input');
  const stageSelect = document.getElementById('cotizaciones-stage-select');
  const tbody = document.getElementById('cotizaciones-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterStage = stageSelect ? stageSelect.value : 'Todos';

  let list = vehicles.filter(v => v.quoteCompleted);

  if (searchVal) {
    list = list.filter(v => {
      const indexNum = v.id === 'mock-vehicle-gol-2026' ? '2' : v.id.substring(v.id.length - 2, v.id.length);
      return (v.client || '').toLowerCase().includes(searchVal) || 
             (v.clientPhone && v.clientPhone.includes(searchVal)) || 
             v.plate.toLowerCase().includes(searchVal) || 
             v.brand.toLowerCase().includes(searchVal) || 
             v.model.toLowerCase().includes(searchVal) ||
             `#${indexNum}`.includes(searchVal);
    });
  }

  if (filterStage !== 'Todos') {
    if (filterStage === 'Aprobadas') {
      list = list.filter(v => v.stage === 'reparacion' || v.stage === 'listo');
    } else if (filterStage === 'Pendientes') {
      list = list.filter(v => v.stage === 'cotizacion' || v.stage === 'recepcion');
    }
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No se encontraron cotizaciones.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(v => {
    const isGolMock = v.id === 'mock-vehicle-gol-2026';
    const indexNum = isGolMock ? '2' : v.id.substring(v.id.length - 2, v.id.length);

    const isApproved = (v.stage === 'reparacion' || v.stage === 'listo');
    const stateText = isApproved ? 'Aprobada' : 'Pendiente';
    const badgeClass = isApproved ? 'badge-green' : 'badge-gold';

    const actionsHtml = isApproved 
      ? `
        <button class="table-action-btn-text blue-outline" onclick="openQuoteModal('${v.id}')">
          <i data-lucide="file-text"></i> Generar Documento
        </button>
        <button class="table-action-btn red-delete" onclick="deleteVehicleFromTable('${v.id}')" title="Eliminar CotizaciÃ³n">
          <i data-lucide="trash-2"></i>
        </button>
      `
      : `
        <button class="table-action-btn-text green-outline" onclick="openDetailedReception('${v.id}')">
          <i data-lucide="car"></i> Ingresar vehÃ­culo
        </button>
        <button class="table-action-btn-text blue-outline" onclick="openDetailedQuoteView('${v.id}')">
          <i data-lucide="file-text"></i> Generar Documento
        </button>
        <button class="table-action-btn red-delete" onclick="deleteVehicleFromTable('${v.id}')" title="Eliminar CotizaciÃ³n">
          <i data-lucide="trash-2"></i>
        </button>
      `;

    return `
      <tr>
        <td>
          <label class="checkbox-container" style="margin-left: 8px;">
            <input type="checkbox">
            <span class="custom-checkbox"></span>
          </label>
        </td>
        <td style="font-weight: 700; color: var(--text-primary);">#${indexNum}</td>
        <td style="font-weight: 600; color: var(--text-primary);">${v.client}</td>
        <td style="font-family: var(--font-mono);">${v.clientPhone || 'Sin telÃ©fono'}</td>
        <td style="font-weight: 600;">${v.brand} ${v.model} <span style="color: var(--text-muted); font-size: 11px;">(${v.plate})</span></td>
        <td><span class="stage-pending-badge ${badgeClass}" style="font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px;">${stateText}</span></td>
        <td style="font-size: 12px; color: var(--text-secondary);">Ayer</td>
        <td style="font-weight: 700; color: var(--text-primary);">${formatCurrency(v.value)}</td>
        <td style="white-space: nowrap;">
          <div style="display: flex; gap: 6px; align-items: center;">
            ${actionsHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
};

window.deleteVehicleFromTable = function(vehicleId) {
  if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este registro de cotizaciÃ³n?')) {
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    saveState();
    renderApp();
    alert('Registro eliminado con Ã©xito.');
  }
};

// --- 4. RENDERIZADOR DE AGENDA Y CITAS (SCREEN 4) ---
let agendaCalendarDate = new Date(2026, 4, 24); // Mayo 2026

window.adjustAgendaMonth = function(offset) {
  agendaCalendarDate.setMonth(agendaCalendarDate.getMonth() + offset);
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
  renderAgendaCalendar();
  const calendarContainer = document.getElementById('calendar-view-container');
  if (calendarContainer && calendarContainer.style.display !== 'none') {
    renderCalendar();
  }
};

window.renderAgendaCalendar = function() {
  const year = agendaCalendarDate.getFullYear();
  const month = agendaCalendarDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const monthLabel = document.getElementById('agenda-calendar-month-label');
  if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

  const daysGrid = document.getElementById('agenda-calendar-days-grid');
  if (!daysGrid) return;
  daysGrid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  // Monday start adjustment
  let adjustedFirstDay = (firstDayIndex + 6) % 7;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  // Padding mes anterior
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const day = prevTotalDays - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateString = formatDateString(prevMonthDate);
    const cell = createAgendaDayCell(day, true, false, dateString);
    daysGrid.appendChild(cell);
  }

  // DÃ­as mes actual
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month, day);
    const dateString = formatDateString(currentDate);
    const isTodayDemo = (year === 2026 && month === 4 && day === 24); // Mayo 24
    const cell = createAgendaDayCell(day, false, isTodayDemo, dateString);
    daysGrid.appendChild(cell);
  }

  // Padding mes siguiente
  const totalCellsSoFar = adjustedFirstDay + totalDays;
  const nextMonthCells = 42 - totalCellsSoFar;
  for (let day = 1; day <= nextMonthCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const dateString = formatDateString(nextMonthDate);
    const cell = createAgendaDayCell(day, true, false, dateString);
    daysGrid.appendChild(cell);
  }

  renderProximasCitas();
  initLucide();
};

window.renderProximasCitas = function() {
  const container = document.getElementById('proximas-citas-list-container');
  const panelContainer = document.getElementById('panel-proximas-citas-list-container');
  const dashboardContainer = document.getElementById('dashboard-proximas-citas-list-container');
  if (!container && !panelContainer && !dashboardContainer) return;

  // Get active appointments and deliveries (vehicles not delivered yet)
  const activeCitas = vehicles.filter(v => !v.delivered && (v.stage === 'cita' || v.isCita || v.deliveryDate));
  const getEventDate = (v) => v.deliveryDate || v.entryDate;

  const renderToContainer = (target) => {
    if (!target) return;
    target.innerHTML = '';

    const isDashboard = target.id === 'dashboard-proximas-citas-list-container';

    if (isDashboard) {
      const addBtn = document.createElement('button');
      addBtn.className = 'add-card-btn';
      addBtn.style.cssText = 'width: 280px; flex-shrink: 0; padding: 12px; gap: 8px; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 82px; height: 100%;';
      addBtn.setAttribute('onclick', "switchView('calendario')");
      addBtn.innerHTML = `
        <div class="add-icon-pill" style="width: 28px; height: 28px; box-shadow: 0 2px 6px rgba(var(--color-accent-rgb), 0.25);">
          <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
        </div>
        <span style="font-size: 13px; font-weight: 700; color: var(--color-accent); font-family: var(--font-display);">Agendar cita</span>
        <span class="sub-text" style="font-size: 10px; color: var(--text-muted); font-weight: 500;">Click para ir al calendario</span>
      `;
      target.appendChild(addBtn);
    }

    // Build unified items list: vehicle events + reminders, sorted by date
    const vehicleItems = activeCitas.map(v => ({ type: 'vehicle', date: getEventDate(v), data: v }));
    const reminderItems = reminders.map(r => ({ type: 'reminder', date: r.date, data: r }));
    const allItems = [...vehicleItems, ...reminderItems].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (allItems.length === 0) {
      if (!isDashboard) {
        target.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin: auto 0; padding: 20px; width: 100%;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background-color: rgba(var(--color-accent-rgb),0.1); color: var(--color-accent); display: flex; align-items: center; justify-content: center;">
              <i data-lucide="calendar" style="width: 16px;"></i>
            </div>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-align: center;">No hay citas, entregas ni recordatorios prÃ³ximos</span>
          </div>
        `;
      }
      return;
    }

    allItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'next-cita-item';

      if (item.type === 'reminder') {
        // â”€â”€ REMINDER CARD â”€â”€
        const r = item.data;
        const cardWidth = isDashboard ? 'width: 280px; flex-shrink: 0;' : 'width: 100%;';
        card.style.cssText = `background-color: var(--card-bg); border: 1px solid rgba(139,92,246,0.25); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 0.2s ease; ${cardWidth} border-left: 4px solid #8b5cf6;`;

        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          card.style.borderTopColor = '#8b5cf6';
          card.style.borderRightColor = '#8b5cf6';
          card.style.borderBottomColor = '#8b5cf6';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'none';
          card.style.boxShadow = 'none';
          card.style.borderTopColor = 'rgba(139,92,246,0.25)';
          card.style.borderRightColor = 'rgba(139,92,246,0.25)';
          card.style.borderBottomColor = 'rgba(139,92,246,0.25)';
          // borderLeftColor stays #8b5cf6 â€” never reset
        });

        const dateObj = new Date(r.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 2px; max-width: 75%;">
              <span style="font-weight: 700; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">ðŸ”” ${r.title}</span>
              ${r.description ? `<span style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.description}</span>` : ''}
            </div>
            <span class="filter-badge badge-violet" style="font-size: 9px; padding: 2px 6px; border-radius: 12px; flex-shrink: 0;">Recordatorio</span>
          </div>
          <div style="display: flex; justify-content: flex-end; align-items: center; width: 100%; border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 4px;">
            <span style="font-size: 11px; font-weight: 700; color: #8b5cf6; display: flex; align-items: center; gap: 4px; background: rgba(139,92,246,0.08); padding: 2px 8px; border-radius: 6px;">
              <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${formattedDate}
            </span>
          </div>
        `;

        card.addEventListener('click', () => openReminderModal(r.date, r.id));

      } else {
        // â”€â”€ VEHICLE CARD â”€â”€
        const v = item.data;
        const cardWidth = isDashboard ? 'width: 280px; flex-shrink: 0;' : 'width: 100%;';

        // Use concrete hex values so they resolve correctly in all contexts (dashboard + calendar)
        let stageColor = '#3b82f6'; // Azul recepciÃ³n â€” matches badge-blue
        let stageName = 'RecepciÃ³n';
        let badgeClass = 'badge-blue';
        if (v.stage === 'cotizacion') {
          stageColor = '#8b5cf6'; stageName = 'CotizaciÃ³n'; badgeClass = 'badge-violet';
        } else if (v.stage === 'reparacion') {
          stageColor = '#ef4444'; stageName = 'ReparaciÃ³n'; badgeClass = 'badge-red';
        } else if (v.stage === 'listo') {
          stageColor = '#22c55e'; stageName = 'Listo'; badgeClass = 'badge-green';
        } else if (v.stage === 'cita') {
          stageColor = '#f59e0b'; stageName = 'Cita Agendada'; badgeClass = 'badge-gold';
        }

        // Border color embedded directly into cssText â€” avoids double-assignment bug
        card.style.cssText = `background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 0.2s ease; ${cardWidth} border-left: 4px solid ${stageColor};`;

        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          card.style.borderTopColor = stageColor;
          card.style.borderRightColor = stageColor;
          card.style.borderBottomColor = stageColor;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'none';
          card.style.boxShadow = 'none';
          card.style.borderTopColor = 'var(--border-color)';
          card.style.borderRightColor = 'var(--border-color)';
          card.style.borderBottomColor = 'var(--border-color)';
          // borderLeftColor stays as stageColor â€” never reset
        });

        const displayDate = v.deliveryDate || v.entryDate;
        const dateObj = new Date(displayDate + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const displayTime = v.deliveryDate ? v.deliveryTime : v.time;
        const titlePrefix = v.deliveryDate ? 'ðŸš— Entrega: ' : '';

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 2px; max-width: 70%;">
              <span style="font-weight: 700; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titlePrefix}${v.brand} ${v.model}</span>
              <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); font-family: var(--font-mono);">${v.plate || 'Sin Patente'}</span>
            </div>
            <span class="filter-badge ${badgeClass}" style="font-size: 9px; padding: 2px 6px; border-radius: 12px; flex-shrink: 0;">${stageName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 4px;">
            <span style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
              <i data-lucide="user" style="width: 12px; height: 12px; color: var(--text-muted);"></i> ${v.client}
            </span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; color: var(--color-accent); display: flex; align-items: center; gap: 4px; background: rgba(var(--color-accent-rgb),0.10); padding: 2px 8px; border-radius: 6px; white-space: nowrap;">
                <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${formattedDate}
              </span>
              ${displayTime ? `
              <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; background: var(--border-color); padding: 2px 8px; border-radius: 6px; white-space: nowrap;">
                <i data-lucide="clock" style="width: 12px; height: 12px; color: var(--text-muted);"></i> ${displayTime} hs
              </span>
              ` : ''}
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          if (v.stage === 'cita' || v.isCita) {
            openViewCitaModal(v.id);
          } else {
            openDetailedReception(v.id);
          }
        });
      }

      target.appendChild(card);
    });
  };

  renderToContainer(container);
  renderToContainer(panelContainer);
  renderToContainer(dashboardContainer);
  initLucide();
};

window.openCalendarOptions = function(dateString) {
  const optionsModal = document.getElementById('calendar-options-modal');
  if (!optionsModal) return;

  // Format date label beautifully
  const dateObj = new Date(dateString + 'T00:00:00');
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('es-ES', options);

  document.getElementById('options-modal-date-label').textContent = formattedDate;

  // Bind buttons
  document.getElementById('options-btn-create-cita').onclick = () => {
    closeModal('calendar-options-modal');
    openAddCitaModal(dateString);
  };

  document.getElementById('options-btn-recepcion').onclick = () => {
    closeModal('calendar-options-modal');
    openAddVehicleModal('recepcion');
    const dateInput = document.getElementById('form-date');
    if (dateInput) dateInput.value = dateString;
  };

  document.getElementById('options-btn-reminder').onclick = () => {
    closeModal('calendar-options-modal');
    openReminderModal(dateString);
  };

  optionsModal.classList.add('open');
};

window.openAddCitaModal = function(dateString, id = null) {
  const modal = document.getElementById('add-cita-modal');
  if (!modal) return;

  // Set modal title dynamically
  const modalTitle = document.querySelector('#add-cita-modal .modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = id ? '<i data-lucide="pencil"></i> Editar Cita' : '<i data-lucide="calendar-plus"></i> Agendar Cita';
    initLucide();
  }

  // Reset form fields
  document.getElementById('cita-form-id').value = id ? id : '';
  document.getElementById('cita-form-date').value = dateString;
  document.getElementById('cita-form-time').value = '10:00'; // Default time
  document.getElementById('cita-form-client-name').value = '';
  document.getElementById('cita-form-client-phone').value = '';
  document.getElementById('cita-form-plate').value = '';
  document.getElementById('cita-form-brand').value = '';
  document.getElementById('cita-form-model').value = '';
  document.getElementById('cita-form-desc').value = '';

  // Close dropdowns
  document.getElementById('cita-client-dropdown').style.display = 'none';
  document.getElementById('cita-vehicle-dropdown').style.display = 'none';

  if (id) {
    // Edit mode
    const cita = vehicles.find(v => String(v.id) === String(id));
    if (cita) {
      document.getElementById('cita-form-time').value = cita.time || '10:00';
      document.getElementById('cita-form-client-name').value = cita.client || '';
      document.getElementById('cita-form-client-phone').value = cita.clientPhone || '';
      document.getElementById('cita-form-plate').value = cita.plate || '';
      document.getElementById('cita-form-brand').value = cita.brand || '';
      document.getElementById('cita-form-model').value = cita.model || '';
      document.getElementById('cita-form-desc').value = cita.description || '';
    }
  }

  modal.classList.add('open');
};

window.openEditCitaModal = function(id) {
  const cita = vehicles.find(v => String(v.id) === String(id));
  if (!cita) return;

  closeModal('view-cita-modal');
  openAddCitaModal(cita.entryDate, cita.id);
};

window.filterCitaClientDropdown = function() {
  const input = document.getElementById('cita-form-client-name');
  const dropdown = document.getElementById('cita-client-dropdown');
  if (!input || !dropdown) return;

  const val = input.value.toLowerCase().trim();
  if (!val) {
    dropdown.style.display = 'none';
    return;
  }

  // Get unique clients from vehicles
  const uniqueClients = [];
  const seen = new Set();
  vehicles.forEach(v => {
    if (v.client && !seen.has(v.client.toLowerCase())) {
      seen.add(v.client.toLowerCase());
      uniqueClients.push({
        name: v.client,
        phone: v.clientPhone || ''
      });
    }
  });

  const filtered = uniqueClients.filter(c => c.name.toLowerCase().includes(val));

  if (filtered.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  dropdown.innerHTML = '';
  filtered.forEach(c => {
    const div = document.createElement('div');
    div.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); font-size: 13px; color: var(--text-primary); transition: background 0.2s;';
    div.innerHTML = `<strong>${c.name}</strong> <span style="font-size: 11px; color: var(--text-secondary); margin-left: 8px;">${c.phone}</span>`;
    div.addEventListener('mouseenter', () => div.style.backgroundColor = 'var(--card-bg-hover)');
    div.addEventListener('mouseleave', () => div.style.backgroundColor = 'transparent');
    div.onmousedown = () => {
      input.value = c.name;
      document.getElementById('cita-form-client-phone').value = c.phone;
      dropdown.style.display = 'none';
    };
    dropdown.appendChild(div);
  });

  dropdown.style.display = 'block';
};

window.openCitaClientDropdown = function() {
  filterCitaClientDropdown();
};

window.filterCitaVehicleDropdown = function() {
  const input = document.getElementById('cita-form-plate');
  const dropdown = document.getElementById('cita-vehicle-dropdown');
  if (!input || !dropdown) return;

  const val = input.value.toLowerCase().trim();
  if (!val) {
    dropdown.style.display = 'none';
    return;
  }

  // Get unique vehicles from vehicles array
  const uniqueVehicles = [];
  const seen = new Set();
  vehicles.forEach(v => {
    if (v.plate && !seen.has(v.plate.toLowerCase())) {
      seen.add(v.plate.toLowerCase());
      uniqueVehicles.push({
        plate: v.plate,
        brand: v.brand || '',
        model: v.model || ''
      });
    }
  });

  const filtered = uniqueVehicles.filter(veh => 
    veh.plate.toLowerCase().includes(val) || 
    veh.brand.toLowerCase().includes(val) || 
    veh.model.toLowerCase().includes(val)
  );

  if (filtered.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  dropdown.innerHTML = '';
  filtered.forEach(veh => {
    const div = document.createElement('div');
    div.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); font-size: 13px; color: var(--text-primary); transition: background 0.2s;';
    div.innerHTML = `<strong style="font-family: var(--font-mono);">${veh.plate}</strong> <span style="font-size: 11px; color: var(--text-secondary); margin-left: 8px;">${veh.brand} ${veh.model}</span>`;
    div.addEventListener('mouseenter', () => div.style.backgroundColor = 'var(--card-bg-hover)');
    div.addEventListener('mouseleave', () => div.style.backgroundColor = 'transparent');
    div.onmousedown = () => {
      input.value = veh.plate;
      document.getElementById('cita-form-brand').value = veh.brand;
      document.getElementById('cita-form-model').value = veh.model;
      dropdown.style.display = 'none';
    };
    dropdown.appendChild(div);
  });

  dropdown.style.display = 'block';
};

window.openCitaVehicleDropdown = function() {
  filterCitaVehicleDropdown();
};

window.handleCitaFormSubmit = function(event) {
  event.preventDefault();

  const idInput = document.getElementById('cita-form-id').value;
  const dateVal = document.getElementById('cita-form-date').value;
  const timeVal = document.getElementById('cita-form-time').value;
  const clientName = document.getElementById('cita-form-client-name').value;
  const clientPhone = document.getElementById('cita-form-client-phone').value;
  const plateVal = document.getElementById('cita-form-plate').value;
  const brandVal = document.getElementById('cita-form-brand').value;
  const modelVal = document.getElementById('cita-form-model').value;
  const descVal = document.getElementById('cita-form-desc').value;

  // Validate that AT LEAST one detail is present (brand/model, plate, or clientName)
  if (!clientName.trim() && !plateVal.trim() && !brandVal.trim() && !modelVal.trim() && !descVal.trim()) {
    alert('Por favor ingrese al menos algÃºn dato del cliente, vehÃ­culo o motivo para registrar la cita.');
    return;
  }

  // Register client in the global database if they don't exist
  if (clientName && clientName.trim() && clientName.trim() !== 'Sin Nombre') {
    const trimmedName = clientName.trim();
    let client = clients.find(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (!client) {
      client = {
        id: 'c-' + Date.now(),
        name: trimmedName,
        phone: clientPhone ? clientPhone.trim() : '',
        email: ''
      };
      clients.push(client);
      saveClients();
    } else {
      if (clientPhone && clientPhone.trim() && !client.phone) {
        client.phone = clientPhone.trim();
        saveClients();
      }
    }
  }

  if (idInput) {
    // Edit existing cita
    const cita = vehicles.find(v => String(v.id) === String(idInput));
    if (cita) {
      cita.entryDate = dateVal;
      cita.time = timeVal;
      cita.client = clientName ? clientName : 'Sin Nombre';
      cita.clientPhone = clientPhone;
      cita.plate = plateVal;
      cita.brand = brandVal ? brandVal : 'Cita';
      cita.model = modelVal ? modelVal : 'Pendiente';
      cita.description = descVal;
    }
  } else {
    // Create new cita
    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
    const newCita = {
      id: newId,
      stage: 'cita',
      isCita: true,
      entryDate: dateVal,
      time: timeVal,
      client: clientName ? clientName : 'Sin Nombre',
      clientPhone: clientPhone,
      clientEmail: '',
      plate: plateVal,
      brand: brandVal ? brandVal : 'Cita',
      model: modelVal ? modelVal : 'Pendiente',
      year: 'â€”',
      km: 'â€”',
      fuel: 'â€”',
      color: 'â€”',
      description: descVal,
      delivered: false,
      services: [],
      parts: []
    };
    vehicles.push(newCita);
  }

  saveState();
  closeModal('add-cita-modal');
  renderCalendar();
  renderAgendaCalendar();
  if (window.renderDashboard) renderDashboard();
};

window.openViewCitaModal = function(id) {
  const modal = document.getElementById('view-cita-modal');
  if (!modal) return;

  const cita = vehicles.find(v => String(v.id) === String(id));
  if (!cita) return;

  document.getElementById('view-cita-id').value = cita.id;
  
  // Format Date and Time
  const dateObj = new Date(cita.entryDate + 'T00:00:00');
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('es-ES', options);

  document.getElementById('view-cita-time-label').textContent = `${cita.time || '10:00'} hs`;
  document.getElementById('view-cita-date-label').textContent = formattedDate;

  document.getElementById('view-cita-client-name').textContent = cita.client || 'Sin Nombre';
  document.getElementById('view-cita-client-phone').textContent = cita.clientPhone || 'Sin TelÃ©fono';

  const brand = cita.brand && cita.brand !== 'Cita' ? cita.brand : '';
  const model = cita.model && cita.model !== 'Pendiente' ? cita.model : '';
  
  if (brand || model) {
    document.getElementById('view-cita-veh-brand-model').textContent = `${brand} ${model}`.trim();
  } else {
    document.getElementById('view-cita-veh-brand-model').textContent = 'Sin vehÃ­culo especificado';
  }

  document.getElementById('view-cita-veh-plate').textContent = cita.plate || 'SIN PATENTE';
  document.getElementById('view-cita-desc').textContent = cita.description || 'Sin notas adicionales';

  // Bind edit button
  const editBtn = document.getElementById('view-cita-edit-btn');
  if (editBtn) {
    editBtn.onclick = () => {
      openEditCitaModal(cita.id);
    };
  }

  // Bind convert button
  document.getElementById('view-cita-convert-btn').onclick = () => {
    closeModal('view-cita-modal');
    convertCitaToReception(cita.id);
  };

  // Bind delete button
  document.getElementById('view-cita-delete-btn').onclick = () => {
    if (confirm('Â¿EstÃ¡ seguro de que desea eliminar esta cita?')) {
      const idx = vehicles.findIndex(v => String(v.id) === String(cita.id));
      if (idx !== -1) {
        vehicles.splice(idx, 1);
        saveState();
      }
      closeModal('view-cita-modal');
      renderCalendar();
      renderAgendaCalendar();
      if (window.renderDashboard) renderDashboard();
    }
  };

  modal.classList.add('open');
};

window.convertCitaToReception = function(citaId) {
  const cita = vehicles.find(v => String(v.id) === String(citaId));
  if (!cita) return;

  // Open vehicle modal
  openAddVehicleModal('recepcion');

  // Fill in form values!
  if (cita.plate) {
    const pEl = document.getElementById('form-plate');
    if (pEl) pEl.value = cita.plate;
    
    const pCrEl = document.getElementById('form-plate-create');
    if (pCrEl) pCrEl.value = cita.plate;
    
    const pDispEl = document.getElementById('form-plate-display');
    if (pDispEl) pDispEl.textContent = cita.plate;
  }
  
  const bEl = document.getElementById('form-brand');
  if (bEl) bEl.value = cita.brand && cita.brand !== 'Cita' ? cita.brand : '';

  const mEl = document.getElementById('form-model');
  if (mEl) mEl.value = cita.model && cita.model !== 'Pendiente' ? cita.model : '';
  
  if (cita.client && cita.client !== 'Sin Nombre') {
    const csEl = document.getElementById('form-client-search');
    if (csEl) csEl.value = cita.client;
    
    const ncsEl = document.getElementById('form-nc-search');
    if (ncsEl) ncsEl.value = cita.client;
    
    const ncnEl = document.getElementById('form-nc-name');
    if (ncnEl) ncnEl.value = cita.client;
    
    const ncdEl = document.getElementById('form-nc-name-display');
    if (ncdEl) ncdEl.textContent = cita.client;
  }
  
  const phoneEl = document.getElementById('form-nc-phone');
  if (phoneEl) phoneEl.value = cita.clientPhone || '';

  const emailEl = document.getElementById('form-nc-email');
  if (emailEl) emailEl.value = '';

  const dateEl = document.getElementById('form-date');
  if (dateEl) dateEl.value = cita.entryDate;

  const descEl = document.getElementById('form-desc');
  if (descEl) descEl.value = cita.description || '';

  // Mark the vehicle ID as THIS cita's ID so that saving it updates this entry!
  const idEl = document.getElementById('form-vehicle-id');
  if (idEl) idEl.value = cita.id;
};

function createAgendaDayCell(dayNumber, isOtherMonth, isToday, dateString) {
  const cell = document.createElement('div');
  cell.className = 'agenda-day-cell';
  if (isOtherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('today');

  cell.setAttribute('data-date', dateString);

  const numSpan = document.createElement('span');
  numSpan.className = 'day-number';
  numSpan.textContent = String(dayNumber).padStart(2, '0');
  cell.appendChild(numSpan);

  const eventsDiv = document.createElement('div');
  eventsDiv.className = 'agenda-cell-events';

  // 1. Mostrar turnos/citas programadas para hoy (excluye recepciones activas sin fecha de entrega comprometida)
  const entryVehicles = vehicles.filter(v => v.entryDate === dateString && !v.delivered && (v.stage === 'cita' || v.isCita));
  entryVehicles.forEach(vehicle => {
    const eventTag = document.createElement('span');
    eventTag.className = `agenda-event-tag ${vehicle.stage}`;
    
    // For citas, display time in calendar
    const timePrefix = (vehicle.stage === 'cita' && vehicle.time) ? `${vehicle.time} - ` : '';
    eventTag.textContent = `${timePrefix}${vehicle.brand} ${vehicle.model}`;
    eventTag.title = `${vehicle.plate || 'Sin Patente'} - ${vehicle.brand} ${vehicle.model} (${vehicle.client})`;

    eventTag.addEventListener('click', (e) => {
      e.stopPropagation();
      if (vehicle.stage === 'cita' || vehicle.isCita) {
        openViewCitaModal(vehicle.id);
      } else {
        openDetailedReception(vehicle.id);
      }
    });

    eventsDiv.appendChild(eventTag);
  });

  // 2. Mostrar vehÃ­culos con fecha comprometida de entrega para hoy
  const deliveryVehicles = vehicles.filter(v => v.deliveryDate === dateString && !v.delivered);
  deliveryVehicles.forEach(vehicle => {
    const eventTag = document.createElement('span');
    eventTag.className = 'agenda-event-tag entrega';
    
    const timePrefix = vehicle.deliveryTime ? `${vehicle.deliveryTime} - ` : '';
    eventTag.textContent = `ðŸš— Entrega: ${timePrefix}${vehicle.brand} ${vehicle.model}`;
    eventTag.title = `Entrega Comprometida: ${vehicle.deliveryTime || ''} hs - ${vehicle.plate || 'Sin Patente'} - ${vehicle.brand} ${vehicle.model} (${vehicle.client})`;

    eventTag.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailedReception(vehicle.id);
    });

    eventsDiv.appendChild(eventTag);
  });

  // 3. Mostrar recordatorios para este dÃ­a
  const dayReminders = reminders.filter(r => r.date === dateString);
  dayReminders.forEach(reminder => {
    const reminderTag = document.createElement('span');
    reminderTag.className = 'agenda-event-tag reminder';
    reminderTag.style.cssText = 'background: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); cursor: pointer;';
    reminderTag.textContent = `ðŸ”” ${reminder.title}`;
    reminderTag.title = reminder.description ? `${reminder.title}: ${reminder.description}` : reminder.title;

    reminderTag.addEventListener('click', (e) => {
      e.stopPropagation();
      openReminderModal(dateString, reminder.id);
    });

    eventsDiv.appendChild(reminderTag);
  });

  cell.appendChild(eventsDiv);

  cell.addEventListener('click', () => {
    openCalendarOptions(dateString);
  });

  return cell;
}

/* 
========================================================================
   18. MOTORES DE RENDERIZADO ASÃNCRONOS Y LOGICA DE DEUDAS (Fase 2)
========================================================================
*/

// --- CONTROLADORES DE CARGA ASÃNCRONA ---
let teamLoading = false;
let teamLoaded = false;
let clientsLoading = false;
let clientsLoaded = false;

// --- 1. Ã“RDENES DE TRABAJO (OPERACIONES TÃ‰CNICAS) ---
window.renderOrdenesTrabajoView = function() {
  const searchInput = document.getElementById('ot-search-input');
  const sidebarSearchInput = document.getElementById('sidebar-search-input');
  const stageSelect = document.getElementById('ot-stage-select');
  const tbody = document.getElementById('ot-table-body');
  if (!tbody) return;

  let searchVal = '';
  if (searchInput && searchInput.value) {
    searchVal = searchInput.value.toLowerCase().trim();
  } else if (sidebarSearchInput && sidebarSearchInput.value) {
    searchVal = sidebarSearchInput.value.toLowerCase().trim();
  }
  
  const filterStage = stageSelect ? stageSelect.value : 'Todos';

  // 1. Filtrar vehÃ­culos que estÃ©n en fase ReparaciÃ³n o Listo (OTs Activas)
  let list = vehicles.filter(v => v.stage === 'reparacion' || v.stage === 'listo');

  // MÃ©tricas
  const totalOt = list.length;
  const pendingOt = list.filter(v => v.stage === 'reparacion' && (!v.otTasks || v.otTasks.every(t => !t.completed))).length;
  const doneOt = list.filter(v => v.stage === 'listo').length;
  const processOt = totalOt - pendingOt - doneOt;

  document.getElementById('ot-total-val').textContent = totalOt;
  document.getElementById('ot-pending-val').textContent = pendingOt;
  document.getElementById('ot-process-val').textContent = processOt;
  document.getElementById('ot-done-val').textContent = doneOt;

  // Filtrar por tÃ©rmino de bÃºsqueda
  if (searchVal) {
    list = list.filter(v => {
      const isGolMock = v.id === 'mock-vehicle-gol-2026';
      const indexNum = isGolMock ? '1' : (v.id && v.id.length >= 2 ? v.id.substring(v.id.length - 2) : '01');
      const desc = v.otTasks ? v.otTasks.filter(t => t && t.name).map(t => t.name.toLowerCase()).join(', ') : '';
      const client = v.client ? v.client.toLowerCase() : '';
      const phone = v.clientPhone ? v.clientPhone.toLowerCase() : '';
      const plate = v.plate ? v.plate.toLowerCase() : '';
      const brand = v.brand ? v.brand.toLowerCase() : '';
      const model = v.model ? v.model.toLowerCase() : '';
      
      // Normalizar patentes para bÃºsqueda insensible a espacios, guiones o mayÃºsculas
      const normPlate = plate.replace(/[^a-z0-9]/g, '');
      const normSearch = searchVal.replace(/[^a-z0-9]/g, '');
      
      return client.includes(searchVal) || 
             phone.includes(searchVal) || 
             plate.includes(searchVal) || 
             (normPlate && normSearch && normPlate.includes(normSearch)) ||
             brand.includes(searchVal) || 
             model.includes(searchVal) || 
             desc.includes(searchVal) || 
             (v.id && v.id.toLowerCase().includes(searchVal)) ||
             `#${indexNum}`.includes(searchVal);
    });
  }

  // Filtrar por Estado
  if (filterStage !== 'Todos') {
    if (filterStage === 'En Proceso') {
      list = list.filter(v => v.stage === 'reparacion');
    } else if (filterStage === 'Finalizadas') {
      list = list.filter(v => v.stage === 'listo');
    }
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No se encontraron Ã³rdenes de trabajo activas.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(v => {
    const descText = v.otTasks ? v.otTasks.map(t => t.name).join(', ') : 'Sin especificar';
    const isDone = v.stage === 'listo';
    const stateText = isDone ? 'Finalizada' : 'En Proceso';
    const badgeClass = isDone ? 'badge-green' : 'badge-red';

    const relTime = getRelativeSpanishTime(v.entryTime);

    return `
      <tr class="clickable-row" onclick="viewOTDetails('${v.id}')">
        <td style="font-weight: 700; color: var(--text-primary);">${v.id}</td>
        <td style="font-weight: 600; color: var(--text-primary);">${v.client}</td>
        <td style="font-family: var(--font-mono);">${v.clientPhone || 'Sin teléfono'}</td>
        <td style="font-weight: 600;">${v.brand} ${v.model} <span style="color: var(--text-muted); font-size: 11px;">(${v.plate})</span></td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${descText}</td>
        <td><span class="stage-pending-badge ${badgeClass}" style="font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px;">${stateText}</span></td>
        <td style="font-size: 12px; color: var(--text-secondary);">${relTime}</td>
        <td style="text-align: center;" onclick="event.stopPropagation();">
          <button class="table-action-btn more-btn" onclick="openOTActionsMenu(event, '${v.id}')" title="Acciones">
            <i data-lucide="more-horizontal"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
};

window.openOTActionsMenu = function(event, vehicleId) {
  event.stopPropagation();
  
  let menu = document.getElementById('ot-dropdown-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'ot-dropdown-menu';
    menu.className = 'dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.backgroundColor = 'var(--card-bg)';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.borderRadius = 'var(--radius-md)';
    menu.style.boxShadow = 'var(--shadow-md)';
    menu.style.zIndex = '1000';
    menu.style.width = '160px';
    document.body.appendChild(menu);
  }

  menu.innerHTML = `
    <button class="dropdown-item" onclick="viewOTDetails('${vehicleId}')">
      <i data-lucide="eye" style="width: 14px; color: var(--text-secondary);"></i> Ver detalles
    </button>
    <button class="dropdown-item" onclick="openDetailedReception('${vehicleId}', false)">
      <i data-lucide="pencil" style="width: 14px; color: var(--text-secondary);"></i> Editar Orden
    </button>
    <div style="border-top: 1px solid var(--border-color); margin: 4px 0;"></div>
    <button class="dropdown-item text-danger" onclick="deleteOTFromDB('${vehicleId}')" style="color: #ef4444;">
      <i data-lucide="trash-2" style="width: 14px; color: #ef4444;"></i> Eliminar
    </button>
  `;

  const rect = event.currentTarget.getBoundingClientRect();
  menu.style.top = `${window.scrollY + rect.bottom + 4}px`;
  menu.style.left = `${window.scrollX + rect.left - 130}px`;
  menu.classList.add('show');

  initLucide();

  const closeMenu = (e) => {
    if (!e.target.closest('#ot-dropdown-menu') && !e.target.closest('.table-action-btn')) {
      menu.classList.remove('show');
      document.removeEventListener('click', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
};

window.deleteOTFromDB = function(vehicleId) {
  const menu = document.getElementById('ot-dropdown-menu');
  if (menu) menu.classList.remove('show');
  
  if (confirm('¿Estás seguro de que deseas eliminar esta orden de trabajo?')) {
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    saveState();
    renderApp();
  }
};


// --- 2. SERVICIOS DEL CATÃLOGO (OPERACIONES TÃ‰CNICAS) ---
window.renderServiciosCatalogView = function() {
  const searchInput = document.getElementById('catalogo-servicios-search');
  const tbody = document.getElementById('servicios-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let list = [...servicesCatalog];

  if (searchVal) {
    list = list.filter(s => s.name.toLowerCase().includes(searchVal) || s.description.toLowerCase().includes(searchVal));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 32px;">No se encontraron servicios registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => {
    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-primary);">${s.name}</td>
        <td style="color: var(--text-secondary); font-size: 12.5px;">${s.description}</td>
        <td style="text-align: right; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(s.price)}</td>
        <td style="color: var(--text-muted); font-size: 12px;">${s.date}</td>
        <td style="text-align: center;">
          <button class="table-action-btn red-delete" onclick="deleteServiceFromCatalog('${s.id}')" title="Eliminar Servicio">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
};

window.openNewServiceModal = function() {
  document.getElementById('new-service-modal').classList.add('open');
  document.getElementById('ns-name').focus();
};

window.handleNewServiceSubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('ns-name').value.trim();
  const description = document.getElementById('ns-description').value.trim() || 'Sin descripciÃ³n';
  const price = parseFloat(document.getElementById('ns-price').value) || 0;

  const newService = {
    id: 's-' + Date.now(),
    name,
    description,
    price,
    date: new Date().toISOString().split('T')[0]
  };

  servicesCatalog.push(newService);
  saveServices();
  closeModal('new-service-modal');
  renderServiciosCatalogView();
  alert(`Servicio "${name}" agregado con Ã©xito al catÃ¡logo.`);
};

window.deleteServiceFromCatalog = function(serviceId) {
  if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este servicio del catÃ¡logo?')) {
    servicesCatalog = servicesCatalog.filter(s => s.id !== serviceId);
    saveServices();
    renderServiciosCatalogView();
  }
};

window.renderRepuestosCatalogView = function() {
  const searchInput = document.getElementById('catalogo-repuestos-search');
  const tbody = document.getElementById('repuestos-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let list = [...partsCatalog];

  if (searchVal) {
    list = list.filter(p => 
      p.name.toLowerCase().includes(searchVal) || 
      p.description.toLowerCase().includes(searchVal) ||
      (p.brand || '').toLowerCase().includes(searchVal) ||
      (p.model || '').toLowerCase().includes(searchVal) ||
      String(p.year || '').includes(searchVal)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 32px;">No se encontraron repuestos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-primary);">${p.name}</td>
        <td style="color: var(--text-secondary); font-size: 13px;">${p.brand || 'â€”'}</td>
        <td style="color: var(--text-secondary); font-size: 13px;">${p.model || 'â€”'}</td>
        <td style="text-align: center; color: var(--text-secondary); font-size: 13px;">${p.year || 'â€”'}</td>
        <td style="color: var(--text-secondary); font-size: 12.5px;">${p.description}</td>
        <td style="text-align: right; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(p.price)}</td>
        <td style="color: var(--text-muted); font-size: 12px;">${p.date}</td>
        <td style="text-align: center;">
          <button class="table-action-btn red-delete" onclick="deletePartFromCatalog('${p.id}')" title="Eliminar Repuesto">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
};

window.openNewPartModal = function() {
  document.getElementById('np-name').value = '';
  document.getElementById('np-description').value = '';
  document.getElementById('np-brand').value = '';
  document.getElementById('np-model').value = '';
  document.getElementById('np-year').value = '';
  document.getElementById('np-price').value = '';
  document.getElementById('new-part-modal').classList.add('open');
  document.getElementById('np-name').focus();
};

window.handleNewPartSubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('np-name').value.trim();
  const description = document.getElementById('np-description').value.trim() || 'Sin descripciÃ³n';
  const brand = document.getElementById('np-brand').value.trim() || 'Universal';
  const model = document.getElementById('np-model').value.trim() || 'Multimarca';
  const year = document.getElementById('np-year').value.trim() || 'â€”';
  const price = parseFloat(document.getElementById('np-price').value) || 0;

  const newPart = {
    id: 'p-' + Date.now(),
    name,
    description,
    brand,
    model,
    year,
    price,
    date: new Date().toISOString().split('T')[0]
  };

  partsCatalog.push(newPart);
  saveParts();
  populateDatalists(); // Actualizar autocompletador!
  closeModal('new-part-modal');
  renderRepuestosCatalogView();
  alert(`Repuesto "${name}" agregado con Ã©xito al catÃ¡logo.`);
};

window.deletePartFromCatalog = function(partId) {
  if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este repuesto del catÃ¡logo?')) {
    partsCatalog = partsCatalog.filter(p => p.id !== partId);
    saveParts();
    populateDatalists(); // Actualizar autocompletador!
    renderRepuestosCatalogView();
  }
};

// --- 3. GESTIÃ“N DE EQUIPO (GESTIÃ“N DE RECURSOS) ---
window.renderEquipoListaView = function() {
  const tbody = document.getElementById('equipo-table-body');
  if (!tbody) return;

  updateTeamMetrics();

  if (!teamLoaded && !teamLoading) {
    teamLoading = true;
    tbody.innerHTML = `<tr><td colspan="7"><div class="loader-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px; color: var(--text-secondary); width: 100%;"><div class="loading-spinner"></div><span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Cargando equipo...</span></div></td></tr>`;
    setTimeout(() => {
      teamLoading = false;
      teamLoaded = true;
      drawTeamTable();
    }, 600);
  } else if (teamLoaded) {
    drawTeamTable();
  }
};

function updateTeamMetrics() {
  const total = teamMembers.length;
  const admins = teamMembers.filter(t => t.role === 'Administrador').length;
  const sellers = teamMembers.filter(t => t.role === 'Vendedor').length;
  const mechanics = teamMembers.filter(t => t.role === 'MecÃ¡nico').length;
  const active = teamMembers.filter(t => t.active).length;

  document.getElementById('eq-total-val').textContent = total;
  document.getElementById('eq-admins-val').textContent = admins;
  document.getElementById('eq-sellers-val').textContent = sellers;
  document.getElementById('eq-mechanics-val').textContent = mechanics;
  document.getElementById('eq-active-val').textContent = active;
}

function drawTeamTable() {
  const searchInput = document.getElementById('eq-search-input');
  const roleSelect = document.getElementById('eq-role-select');
  const statusSelect = document.getElementById('eq-status-select');
  const tbody = document.getElementById('equipo-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterRole = roleSelect ? roleSelect.value : 'Todos los roles';
  const filterStatus = statusSelect ? statusSelect.value : 'Todos';

  let list = [...teamMembers];

  if (searchVal) {
    list = list.filter(t => t.name.toLowerCase().includes(searchVal) || 
                           t.phone.includes(searchVal) || 
                           t.email.toLowerCase().includes(searchVal) || 
                           t.specialty.toLowerCase().includes(searchVal));
  }

  if (filterRole !== 'Todos los roles') {
    list = list.filter(t => t.role === filterRole);
  }

  if (filterStatus !== 'Todos') {
    const isActive = filterStatus === 'Activo';
    list = list.filter(t => t.active === isActive);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No se encontraron miembros de equipo.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => {
    const statusText = t.active ? 'Activo' : 'Inactivo';
    const badgeClass = t.active ? 'badge-green' : 'badge-gray';

    return `
      <tr>
        <td>
          <label class="checkbox-container" style="margin-left: 8px;">
            <input type="checkbox">
            <span class="custom-checkbox"></span>
          </label>
        </td>
        <td style="font-weight: 700; color: var(--text-primary);">${t.name}</td>
        <td style="font-size: 12.5px; line-height: 1.3;">
          <strong style="color: var(--text-primary); font-family: var(--font-mono);">${t.phone}</strong><br>
          <span style="color: var(--text-muted); font-size: 11px;">${t.email}</span>
        </td>
        <td style="font-weight: 600;">
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="${t.role === 'MecÃ¡nico' ? 'wrench' : t.role === 'Administrador' ? 'shield' : 'shopping-cart'}" style="width: 13px; color: var(--text-secondary);"></i>
            ${t.role}
          </span>
        </td>
        <td style="color: var(--text-secondary); font-size: 12.5px;">${t.specialty || 'General'}</td>
        <td style="text-align: right; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${formatCurrency(t.salary)}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <span class="stage-pending-badge ${badgeClass}" style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${statusText}</span>
            <button class="table-action-btn red-delete" onclick="deleteTeamMember('${t.id}')" title="Eliminar Miembro">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
}

window.openNewTeamModal = function() {
  document.getElementById('new-team-modal').classList.add('open');
  document.getElementById('nt-name').focus();
};

window.handleNewTeamSubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('nt-name').value.trim();
  const phone = document.getElementById('nt-phone').value.trim();
  const email = document.getElementById('nt-email').value.trim() || 'sin-email@taller.com';
  const role = document.getElementById('nt-role').value;
  const specialty = document.getElementById('nt-specialty').value.trim() || 'General';
  const salary = parseFloat(document.getElementById('nt-salary').value) || 0;

  const newMember = {
    id: 't-' + Date.now(),
    name,
    phone,
    email,
    role,
    specialty,
    salary,
    active: true
  };

  teamMembers.push(newMember);
  saveTeam();
  closeModal('new-team-modal');
  
  teamLoaded = false; // Forzar loader para dar efecto dinámico
  renderEquipoListaView();
  alert(`Miembro "${name}" registrado exitosamente en el equipo.`);
};

window.deleteTeamMember = function(memberId) {
  if (confirm('¿Estás seguro de que deseas eliminar este miembro del equipo?')) {
    teamMembers = teamMembers.filter(t => t.id !== memberId);
    saveTeam();
    teamLoaded = false;
    renderEquipoListaView();
  }
};

// --- 4. BASE DE DATOS DE CLIENTES (GESTIÓN DE RECURSOS) ---

// Utility Toast Notifications
window.showToast = function(message, type = 'success') {
  const toast = document.createElement('div');
  toast.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><i data-lucide="${type === 'success' ? 'check' : 'alert-triangle'}" style="width:16px;height:16px;"></i> ${message}</span>`;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${type === 'success' ? '#00b050' : '#ef4444'}; color: white; font-weight: 700; font-size: 13px;
    padding: 12px 20px; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    animation: slide-up 0.2s ease;
    pointer-events: none;
    display: flex; align-items: center;
  `;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 2500);
};

window.openNewClientModal = function() {
  document.getElementById('nc-id').value = '';
  document.getElementById('nc-name').value = '';
  document.getElementById('nc-phone').value = '';
  document.getElementById('nc-email').value = '';
  document.getElementById('nc-cuit').value = '';
  document.getElementById('nc-iva').value = 'Consumidor Final';
  document.getElementById('nc-address').value = '';
  
  document.getElementById('new-client-modal-title').innerHTML = '<i data-lucide="user-plus" style="width:18px;vertical-align:middle;margin-right:6px;color:var(--color-accent);"></i> Agregar Nuevo Cliente';
  document.getElementById('new-client-submit-btn').textContent = 'Crear Cliente';
  
  document.getElementById('new-client-modal').classList.add('open');
  if (typeof initLucide === 'function') initLucide();
  document.getElementById('nc-name').focus();
};

window.openEditClientModal = function(clientId) {
  const client = clients.find(c => String(c.id) === String(clientId));
  if (!client) return;
  
  document.getElementById('nc-id').value = client.id;
  document.getElementById('nc-name').value = client.name || '';
  document.getElementById('nc-phone').value = client.phone || '';
  document.getElementById('nc-email').value = client.email || '';
  document.getElementById('nc-cuit').value = client.cuit || '';
  document.getElementById('nc-iva').value = client.ivaCondition || 'Consumidor Final';
  document.getElementById('nc-address').value = client.address || '';
  
  document.getElementById('new-client-modal-title').innerHTML = '<i data-lucide="pencil" style="width:18px;vertical-align:middle;margin-right:6px;color:#3b82f6;"></i> Editar Cliente';
  document.getElementById('new-client-submit-btn').textContent = 'Guardar Cambios';
  
  document.getElementById('new-client-modal').classList.add('open');
  if (typeof initLucide === 'function') initLucide();
  document.getElementById('nc-name').focus();
};

window.handleNewClientSubmit = function(e) {
  e.preventDefault();
  
  const idVal = document.getElementById('nc-id').value;
  const nameVal = document.getElementById('nc-name').value.trim();
  const phoneVal = document.getElementById('nc-phone').value.trim();
  const emailVal = document.getElementById('nc-email').value.trim();
  const cuitVal = document.getElementById('nc-cuit').value.trim() || '';
  const ivaVal = document.getElementById('nc-iva').value;
  const addressVal = document.getElementById('nc-address').value.trim() || '';
  
  if (!nameVal || !phoneVal) {
    showToast('Por favor complete los campos obligatorios.', 'error');
    return;
  }
  
  if (idVal) {
    // Edit mode
    const client = clients.find(c => String(c.id) === String(idVal));
    if (client) {
      client.name = nameVal;
      client.phone = phoneVal;
      client.email = emailVal;
      client.cuit = cuitVal;
      client.ivaCondition = ivaVal;
      client.address = addressVal;
      
      saveClients();
      showToast('Cliente actualizado con éxito.');
    }
  } else {
    // Create mode
    const newClient = {
      id: 'c-' + Date.now(),
      name: nameVal,
      phone: phoneVal,
      email: emailVal,
      cuit: cuitVal,
      ivaCondition: ivaVal,
      address: addressVal,
      createdAt: new Date().toISOString().split('T')[0]
    };
    clients.push(newClient);
    saveClients();
    showToast('Cliente creado con éxito.');
  }
  
  closeModal('new-client-modal');
  clientsLoaded = false;
  renderClientesListaView();
};

window.renderClientesListaView = function() {
  const tbody = document.getElementById('clientes-table-body');
  if (!tbody) return;

  updateClientsMetrics();

  if (!clientsLoaded && !clientsLoading) {
    clientsLoading = true;
    tbody.innerHTML = `<tr><td colspan="4"><div class="loader-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px; color: var(--text-secondary); width: 100%;"><div class="loading-spinner"></div><span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Cargando clientes...</span></div></td></tr>`;
    setTimeout(() => {
      clientsLoading = false;
      clientsLoaded = true;
      drawClientesTable();
    }, 600);
  } else if (clientsLoaded) {
    drawClientesTable();
  }
};

function updateClientsMetrics() {
  const total = clients.length;
  document.getElementById('cli-total-val').textContent = total;
  
  // Real active metrics: clients created in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newClients = clients.filter(c => {
    const rawDateStr = c.createdAt || '2026-05-23';
    const createdDate = rawDateStr.includes('T') ? new Date(rawDateStr) : new Date(rawDateStr + 'T12:00:00');
    return createdDate >= thirtyDaysAgo;
  }).length;
  
  document.getElementById('cli-new-val').textContent = newClients;
}

function drawClientesTable() {
  const searchInput = document.getElementById('cli-search-input');
  const filterSelect = document.getElementById('cli-filter-select');
  const tbody = document.getElementById('clientes-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterVal = filterSelect ? filterSelect.value : 'Todos los clientes';

  let list = [...clients];

  if (searchVal) {
    list = list.filter(c => c.name.toLowerCase().includes(searchVal) || 
                           c.phone.includes(searchVal) || 
                           c.email.toLowerCase().includes(searchVal));
  }

  // Filtros condicionales
  if (filterVal === 'Con saldo pendiente') {
    list = list.filter(c => {
      const clientDebts = vehicles.filter(v => (v.client || '').toLowerCase() === c.name.toLowerCase() && v.stage === 'reparacion').reduce((sum, v) => sum + v.value, 0);
      let realPending = clientDebts;
      if (c.name === 'Silva') realPending += 90000;
      if (c.name === 'Juan García') realPending += 45000;
      return realPending > 0;
    });
  } else if (filterVal === 'Sin vehículos activos') {
    list = list.filter(c => {
      const activeVehicles = vehicles.filter(v => (v.client || '').toLowerCase() === c.name.toLowerCase() && !v.delivered);
      return activeVehicles.length === 0;
    });
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No se encontraron clientes registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => {
    const clientVehicles = vehicles.filter(v => (v.client || '').toLowerCase() === c.name.toLowerCase());
    const vehText = clientVehicles.length > 0 
      ? clientVehicles.map(v => `${v.brand} ${v.model} (${v.plate})`).join(', ') 
      : 'Sin vehículos registrados';

    // Format Date real dynamic!
    const dateStr = c.createdAt || '2026-05-23';
    const dateObj = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <tr class="clickable-row" onclick="openClientDetailsModal('${c.id}')">
        <td style="font-weight: 700; color: var(--text-primary);">
          ${c.name}
          <div style="font-size: 11px; font-weight: normal; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <i data-lucide="car" style="width: 12px; color: var(--text-secondary);"></i> ${vehText}
          </div>
        </td>
        <td style="font-size: 12.5px; line-height: 1.3;">
          <strong style="color: var(--text-primary); font-family: var(--font-mono);">${c.phone}</strong><br>
          <span style="color: var(--text-muted); font-size: 11px;">${c.email}</span>
        </td>
        <td style="font-size: 12.5px; color: var(--text-secondary);">${formattedDate}</td>
        <td style="text-align: center;" onclick="event.stopPropagation()">
          <button class="table-action-btn more-btn" onclick="openClientActionsMenu(event, '${c.id}')" title="Acciones">
            <i data-lucide="more-horizontal"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
}

window.deleteClientFromDB = function(clientId) {
  if (confirm('¿Estás seguro de que deseas eliminar este cliente permanentemente?')) {
    clients = clients.filter(c => c.id !== clientId);
    saveClients();
    clientsLoaded = false;
    renderClientesListaView();
    showToast('Cliente eliminado con éxito.');
  }
};

window.openClientActionsMenu = function(event, clientId) {
  event.stopPropagation();
  
  let menu = document.getElementById('client-dropdown-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'client-dropdown-menu';
    menu.className = 'dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.backgroundColor = 'var(--card-bg)';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.borderRadius = 'var(--radius-md)';
    menu.style.boxShadow = 'var(--shadow-md)';
    menu.style.zIndex = '1000';
    menu.style.width = '160px';
    document.body.appendChild(menu);
  }

  menu.innerHTML = `
    <button class="dropdown-item" onclick="openClientDetailsModal('${clientId}')">
      <i data-lucide="eye" style="width: 14px; color: var(--text-secondary);"></i> Ver detalles
    </button>
    <button class="dropdown-item" id="btn-ws-sim">
      <i data-lucide="message-square" style="width: 14px; color: var(--text-secondary);"></i> Enviar WhatsApp
    </button>
    <button class="dropdown-item" onclick="openEditClientModal('${clientId}')">
      <i data-lucide="pencil" style="width: 14px; color: var(--text-secondary);"></i> Editar
    </button>
    <div style="border-top: 1px solid var(--border-color); margin: 4px 0;"></div>
    <button class="dropdown-item text-danger" onclick="deleteClientFromDB('${clientId}')" style="color: #ef4444;">
      <i data-lucide="trash-2" style="width: 14px; color: #ef4444;"></i> Eliminar
    </button>
  `;

  const client = clients.find(c => String(c.id) === String(clientId));
  if (client) {
    menu.querySelector('#btn-ws-sim').onclick = () => {
      menu.classList.remove('show');
      alert(`Abriendo chat integrado por WhatsApp con ${client.name} en ${client.phone}...`);
    };
  }

  const rect = event.currentTarget.getBoundingClientRect();
  menu.style.top = `${window.scrollY + rect.bottom + 4}px`;
  menu.style.left = `${window.scrollX + rect.left - 130}px`;
  menu.classList.add('show');

  initLucide();

  const closeMenu = (e) => {
    if (!e.target.closest('#client-dropdown-menu') && !e.target.closest('.table-action-btn')) {
      menu.classList.remove('show');
      document.removeEventListener('click', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
};

window.openClientDetailsModal = function(clientId) {
  try {
    const client = clients.find(c => String(c.id) === String(clientId));
    if (!client) {
      alert("Error: Cliente no encontrado con ID " + clientId);
      return;
    }

    const menu = document.getElementById('client-dropdown-menu');
    if (menu) menu.classList.remove('show');

  document.getElementById('cd-avatar').textContent = client.name ? client.name.charAt(0).toUpperCase() : 'C';
  document.getElementById('cd-name').textContent = client.name || 'Sin Nombre';
  
  const dateStr = client.createdAt || '2026-05-23';
  const dateObj = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('cd-since').textContent = `Cliente registrado el ${formattedDate}`;

  document.getElementById('cd-phone').textContent = client.phone || '—';
  document.getElementById('cd-email').textContent = client.email || '—';
  document.getElementById('cd-cuit').textContent = client.cuit || '—';
  document.getElementById('cd-iva').textContent = client.ivaCondition || 'Consumidor Final';
  document.getElementById('cd-address').textContent = client.address || '—';

    const clientVehicles = vehicles.filter(v => (v.client || '').toLowerCase() === (client.name || '').toLowerCase());
    const activeOTs = clientVehicles.filter(v => !v.delivered && v.stage !== 'listo');
    const completedOTs = clientVehicles.filter(v => v.delivered || v.stage === 'listo');

    let pendingDebt = activeOTs.reduce((sum, v) => sum + (v.value || 0), 0);
    let totalRevenue = completedOTs.reduce((sum, v) => sum + (v.value || 0), 0);

    if (client.name && client.name.trim() === 'Silva') {
      pendingDebt += 90000;
    } else if (client.name && client.name.trim() === 'Juan García') {
      pendingDebt += 45000;
      totalRevenue += 10000;
    }

  document.getElementById('cd-total-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('cd-total-debt').textContent = formatCurrency(pendingDebt);
  document.getElementById('cd-count-completed').textContent = completedOTs.length;
  document.getElementById('cd-count-active').textContent = activeOTs.length;

  document.getElementById('cd-edit-trigger-btn').onclick = () => {
    closeModal('client-details-modal');
    openEditClientModal(clientId);
  };

  const vehiclesContainer = document.getElementById('cd-vehicles-list');
  if (vehiclesContainer) {
    if (clientVehicles.length === 0) {
      vehiclesContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-muted); font-style: italic; padding: 10px 0;">Sin vehículos vinculados.</span>`;
    } else {
      // Deduplicar vehículos vinculados por patente para no mostrar tarjetas repetidas
      const uniqueClientVehiclesMap = {};
      clientVehicles.forEach(v => {
        const key = v.plate ? v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : v.id;
        const existing = uniqueClientVehiclesMap[key];
        if (!existing || (v.entryTime || 0) > (existing.entryTime || 0)) {
          uniqueClientVehiclesMap[key] = v;
        }
      });
      const uniqueClientVehicles = Object.values(uniqueClientVehiclesMap);

      vehiclesContainer.innerHTML = uniqueClientVehicles.map(v => {
        return `
          <div class="vehicle-link-card" onclick="closeModal('client-details-modal'); viewVehicleDetails('${v.id}');" title="Ver Ficha de Vehiculo">
            <div>
              <strong style="color: var(--text-primary); font-size: 13px;">${v.brand} ${v.model}</strong>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Color: ${v.color || '—'} | Motor: ${v.motor || '—'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: var(--font-mono); font-weight: 700; font-size: 11px; padding: 2px 6px; border: 1.5px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); background: var(--card-bg-hover); letter-spacing: 0.5px;">${v.plate}</span>
              <i data-lucide="eye" style="width: 13px; height: 13px; color: var(--text-muted); transition: color 0.2s;" class="veh-card-eye"></i>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  const historyTbody = document.getElementById('cd-history-tbody');
  if (historyTbody) {
    if (clientVehicles.length === 0) {
      historyTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 14px; font-size: 12.5px;">Sin visitas registradas.</td></tr>`;
    } else {
      historyTbody.innerHTML = clientVehicles.map(v => {
        let badgeClass = '';
        let statusText = '';
        if (v.stage === 'recepcion') { badgeClass = 'badge-blue'; statusText = 'Recepción'; }
        else if (v.stage === 'cotizacion') { badgeClass = 'badge-violet'; statusText = 'Cotización'; }
        else if (v.stage === 'reparacion') { badgeClass = 'badge-red'; statusText = 'Reparación'; }
        else if (v.stage === 'listo' || v.delivered) { badgeClass = 'badge-green'; statusText = v.delivered ? 'Entregado' : 'Listo'; }

        const dateObj = v.entryTime ? new Date(v.entryTime) : new Date('2026-05-23T12:00:00');
        const formattedEntry = dateObj.toLocaleDateString('es-AR');
        
        return `
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: var(--text-primary); cursor: pointer;" onclick="closeModal('client-details-modal'); viewVehicleDetails('${v.id}');">${v.plate}</td>
            <td style="padding: 8px 12px; color: var(--text-secondary);">${formattedEntry}</td>
            <td style="padding: 8px 12px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.notes || v.workDetails || '—'}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; font-family: var(--font-mono); color: var(--text-primary);">${formatCurrency(v.value || 0)}</td>
            <td style="padding: 8px 12px; text-align: center;">
              <span class="stage-pending-badge ${badgeClass}" style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${statusText}</span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

    document.getElementById('client-details-modal').classList.add('open');
    initLucide();
  } catch (err) {
    console.error("Error in openClientDetailsModal:", err);
    alert("Error crítico al abrir modal de detalles del cliente: " + err.message + "\n" + err.stack);
  }
};

window.renderCuentasCobrarView = function() {
  const searchInput = document.getElementById('cuentas-search-input');
  const tbody = document.getElementById('cuentas-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Salarios / saldos min/max
  const minInput = document.getElementById('cc-min-salary');
  const maxInput = document.getElementById('cc-max-salary');
  const minVal = minInput ? parseFloat(minInput.value) || 0 : 0;
  const maxVal = maxInput ? parseFloat(maxInput.value) || 9999999 : 9999999;

  // Generate accounts dynamically for all clients in database
  let accounts = clients.map(c => {
    const clientVehicles = vehicles.filter(v => (v.client || '').toLowerCase() === c.name.toLowerCase());
    const finishedOTs = clientVehicles.filter(v => v.stage === 'listo' || v.delivered);
    const activeOTs = clientVehicles.filter(v => v.stage === 'reparacion');

    let paid = finishedOTs.reduce((sum, v) => sum + (v.value || 0), 0);
    let pending = activeOTs.reduce((sum, v) => sum + (v.value || 0), 0);
    let debt = paid + pending;
    let pendingSales = activeOTs.length;
    let lastPay = paid > 0 ? 'Hoy' : 'N/A';
    let status = pending > 0 ? 'Pendiente' : (paid > 0 ? 'Pagada' : 'N/A');

    // Mantenemos la simulación para Silva y Juan García si sus valores coinciden con el estado inicial
    if (c.name === 'Silva') {
      debt += 90000;
      pending += 90000;
      pendingSales += 1;
      status = 'Pendiente';
    } else if (c.name === 'Juan García') {
      debt += 55000;
      paid += 10000;
      pending += 45000;
      lastPay = 'Ayer';
      status = 'Vencidas';
    }

    return {
      client: c.name,
      phone: c.phone,
      debt,
      paid,
      pending,
      pendingSales,
      lastPay,
      status
    };
  });

  // Filtrar cuentas para mostrar solo las que tienen historial, manteniendo Enzo, Silva y Juan García
  accounts = accounts.filter(a => a.debt > 0 || a.client === 'Enzo Da Silva' || a.client === 'Silva' || a.client === 'Juan García');

  // Métricas
  const totalDebt = accounts.reduce((sum, a) => sum + a.debt, 0);
  const totalPaid = accounts.reduce((sum, a) => sum + a.paid, 0);
  const totalPending = accounts.reduce((sum, a) => sum + a.pending, 0);
  const debtorsCount = accounts.filter(a => a.pending > 0).length;

  const elDebt = document.getElementById('cc-debt-val');
  if (elDebt) elDebt.textContent = formatCurrency(totalDebt);
  
  const elPaid = document.getElementById('cc-paid-val');
  if (elPaid) elPaid.textContent = formatCurrency(totalPaid);
  
  const elPending = document.getElementById('cc-pending-val');
  if (elPending) elPending.textContent = formatCurrency(totalPending);
  
  const elDebtors = document.getElementById('cc-debtors-val');
  if (elDebtors) elDebtors.textContent = `${debtorsCount} de ${accounts.length}`;

  // Búsqueda por cliente
  if (searchVal) {
    accounts = accounts.filter(a => a.client.toLowerCase().includes(searchVal) || a.phone.includes(searchVal));
  }

  // Filtrado por Píldoras
  if (activeCCFilter !== 'Todos') {
    if (activeCCFilter === 'Pendientes') {
      accounts = accounts.filter(a => a.status === 'Pendiente');
    } else if (activeCCFilter === 'Vencidas') {
      accounts = accounts.filter(a => a.status === 'Vencidas');
    } else if (activeCCFilter === 'Pagadas') {
      accounts = accounts.filter(a => a.status === 'Pagada');
    }
  }

  // Filtrado por saldo min/max
  accounts = accounts.filter(a => a.pending >= minVal && a.pending <= maxVal);

  // Actualizar título de la tabla
  const elTitle = document.getElementById('cc-table-title');
  if (elTitle) elTitle.textContent = `Cuentas (${accounts.length})`;

  if (accounts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No se encontraron estados de cuentas.</td></tr>`;
    return;
  }

  tbody.innerHTML = accounts.map(a => {
    let badgeClass = '';
    if (a.status === 'Pagada') {
      badgeClass = 'badge-green';
    } else if (a.status === 'Pendiente') {
      badgeClass = 'badge-gold';
    } else if (a.status === 'Vencidas') {
      badgeClass = 'badge-red';
    }

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-primary);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: rgba(var(--color-accent-rgb),0.15); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
              ${a.client.charAt(0)}
            </div>
            ${a.client}
          </div>
        </td>
        <td style="text-align: right; font-weight: 600; font-family: var(--font-mono); color: var(--text-primary);">${formatCurrency(a.debt)}</td>
        <td style="text-align: right; font-family: var(--font-mono); color: var(--color-listo);">${formatCurrency(a.paid)}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-mono); color: ${a.pending > 0 ? '#b91c1c' : 'var(--text-secondary)'};">${formatCurrency(a.pending)}</td>
        <td style="text-align: center; font-weight: 600; color: var(--text-primary);">${a.pendingSales}</td>
        <td style="color: var(--text-secondary); font-size: 12px;">${a.lastPay}</td>
        <td><span class="stage-pending-badge ${badgeClass}" style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${a.status}</span></td>
        <td style="text-align: center;">
          <button class="table-action-btn blue-add" onclick="alert('Abriendo ficha técnica consolidada de facturación para ${a.client}.')" title="Ver Detalles">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
};

// --- 6. VEHÃCULOS (GESTIÃ“N DE RECURSOS) ---
window.renderVehiculosView = function() {
  const searchInput = document.getElementById('veh-search-input');
  const brandSelect = document.getElementById('veh-brand-select');
  const filterSelect = document.getElementById('veh-filter-select');
  const tbody = document.getElementById('veh-table-body');
  if (!tbody) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterBrand = brandSelect ? brandSelect.value : 'Todas las marcas';
  const filterAge = filterSelect ? filterSelect.value : 'Todos';

  // Populate brand selection dropdown dynamically if options are empty
  if (brandSelect && brandSelect.options.length <= 1) {
    const uniqueBrands = [...new Set(vehicles.map(v => v.brand))].filter(Boolean);
    uniqueBrands.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      brandSelect.appendChild(opt);
    });
  }

  // Deduplicar la flota por patente para mostrar un único registro por vehículo físico (el más reciente)
  const uniqueVehiclesMap = {};
  vehicles.forEach(v => {
    const key = v.plate ? v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : v.id;
    const existing = uniqueVehiclesMap[key];
    if (!existing || (v.entryTime || 0) > (existing.entryTime || 0)) {
      uniqueVehiclesMap[key] = v;
    }
  });
  let list = Object.values(uniqueVehiclesMap);

  // Calculo de MÃ©tricas
  const totalVeh = list.length;
  
  // VehÃ­culos recientes (Ãºltimos 3 aÃ±os, >= 2024)
  const recentVeh = list.filter(v => parseInt(v.year) >= 2024).length;
  
  // Marcas Populares
  let popularBrand = 'Ninguna';
  let popularCount = 0;
  if (list.length > 0) {
    const brandCounts = {};
    list.forEach(v => {
      brandCounts[v.brand] = (brandCounts[v.brand] || 0) + 1;
    });
    let maxBrand = '';
    let maxCount = 0;
    for (const b in brandCounts) {
      if (brandCounts[b] > maxCount) {
        maxCount = brandCounts[b];
        maxBrand = b;
      }
    }
    popularBrand = maxBrand || 'Ninguna';
    popularCount = maxCount;
  }

  // Promedio de aÃ±os
  let avgYear = 0;
  if (list.length > 0) {
    const totalYears = list.reduce((sum, v) => sum + (parseInt(v.year) || 0), 0);
    avgYear = Math.round(totalYears / list.length);
  }

  document.getElementById('veh-total-val').textContent = totalVeh;
  document.getElementById('veh-recent-val').textContent = recentVeh;
  // E.g. "1 Volkswagen"
  document.getElementById('veh-brand-val').textContent = popularCount > 0 ? `${popularCount} ${popularBrand}` : '0';
  document.getElementById('veh-year-val').textContent = avgYear > 0 ? avgYear : 'N/A';

  // Filtrado por buscador
  if (searchVal) {
    list = list.filter(v => 
      v.plate.toLowerCase().includes(searchVal) || 
      v.brand.toLowerCase().includes(searchVal) || 
      v.model.toLowerCase().includes(searchVal) || 
      (v.client || '').toLowerCase().includes(searchVal)
    );
  }

  // Filtrado por marca
  if (filterBrand !== 'Todas las marcas') {
    list = list.filter(v => v.brand === filterBrand);
  }

  // Filtrado por antigÃ¼edad
  if (filterAge !== 'Todos') {
    if (filterAge === 'Nuevos (>= 2024)') {
      list = list.filter(v => (parseInt(v.year) || 0) >= 2024);
    } else if (filterAge === 'Antiguos (< 2024)') {
      list = list.filter(v => (parseInt(v.year) || 0) < 2024);
    }
  }
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No se encontraron vehiculos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(v => {
    const isNew = (parseInt(v.year) || 0) >= 2024;
    const ageTag = isNew ? '<span style="color: var(--color-accent); font-size: 11.5px; font-weight: normal; margin-left: 4px;">(Nuevo)</span>' : '<span style="color: var(--text-muted); font-size: 11.5px; font-weight: normal; margin-left: 4px;">(Antiguo)</span>';
    
    return `
      <tr class="clickable-row" onclick="viewVehicleDetails('${v.id}')">
        <td style="font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">${v.plate}</td>
        <td style="font-weight: 600; color: var(--text-primary);">${v.brand} ${v.model}</td>
        <td style="font-weight: 600; color: var(--text-primary);">${v.year} ${ageTag}</td>
        <td style="font-weight: 600; color: var(--text-primary);">${v.client}</td>
        <td style="text-align: right; padding-right: 24px; position: relative;" onclick="event.stopPropagation()">
          <button class="table-action-btn more-btn" onclick="openVehicleActionsMenu(event, '${v.id}')" title="Acciones">
            <i data-lucide="more-horizontal"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
  initLucide();
};

window.openVehicleActionsMenu = function(event, vehicleId) {
  event.stopPropagation();
  
  let menu = document.getElementById('vehicle-dropdown-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'vehicle-dropdown-menu';
    menu.className = 'dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.backgroundColor = 'var(--card-bg)';
    menu.style.border = '1px solid var(--border-color)';
    menu.style.borderRadius = 'var(--radius-md)';
    menu.style.boxShadow = 'var(--shadow-md)';
    menu.style.zIndex = '1000';
    menu.style.width = '160px';
    document.body.appendChild(menu);
  }

  menu.innerHTML = `
    <button class="dropdown-item" onclick="viewVehicleDetails('${vehicleId}')">
      <i data-lucide="eye" style="width: 14px; color: var(--text-secondary);"></i> Ver detalles
    </button>
    <button class="dropdown-item" onclick="openEditVehicleModal('${vehicleId}')">
      <i data-lucide="pencil" style="width: 14px; color: var(--text-secondary);"></i> Editar
    </button>
    <div style="border-top: 1px solid var(--border-color); margin: 4px 0;"></div>
    <button class="dropdown-item text-danger" onclick="deleteVehicleFromDB('${vehicleId}')" style="color: #ef4444;">
      <i data-lucide="trash-2" style="width: 14px; color: #ef4444;"></i> Eliminar
    </button>
  `;

  // Position it near the button click
  const rect = event.currentTarget.getBoundingClientRect();
  menu.style.top = `${window.scrollY + rect.bottom + 4}px`;
  menu.style.left = `${window.scrollX + rect.left - 130}px`;
  menu.classList.add('show');

  initLucide();

  // Close dropdown on click outside
  const closeMenu = (e) => {
    if (!e.target.closest('#vehicle-dropdown-menu') && !e.target.closest('.table-action-btn')) {
      menu.classList.remove('show');
      document.removeEventListener('click', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
};

window.viewOTDetails = function(vehicleId) {
  const dropdown = document.getElementById('ot-dropdown-menu');
  if (dropdown) dropdown.classList.remove('show');
  
  const v = vehicles.find(veh => String(veh.id) === String(vehicleId));
  if (!v) return;

  // 1. Cabecera e Identificación
  const isGolMock = v.id === 'mock-vehicle-gol-2026';
  const indexNum = isGolMock ? '1' : v.id.substring(v.id.length - 2, v.id.length);
  document.getElementById('otd-title').textContent = `Orden de Trabajo #${indexNum}`;

  // 2. Estado de la OT (Badge Colorido)
  let badgeClass = 'badge-blue';
  let statusText = 'Recepción';
  if (v.stage === 'recepcion') { badgeClass = 'badge-blue'; statusText = 'Recepción'; }
  else if (v.stage === 'cotizacion') { badgeClass = 'badge-violet'; statusText = 'Cotización'; }
  else if (v.stage === 'reparacion') { badgeClass = 'badge-red'; statusText = 'En Reparación'; }
  else if (v.stage === 'listo') { badgeClass = 'badge-green'; statusText = 'Listo'; }
  else if (v.delivered || v.stage === 'delivered') { badgeClass = 'badge-green'; statusText = 'Entregado'; }
  
  const badgeEl = document.getElementById('otd-stage-badge');
  if (badgeEl) {
    badgeEl.className = `stage-pending-badge ${badgeClass}`;
    badgeEl.textContent = statusText;
  }

  // 3. Fechas y Estadía
  const entryDateStr = v.entryDate || '2026-05-23';
  const relTime = getRelativeSpanishTime(v.entryTime);
  document.getElementById('otd-subtitle').textContent = `Ingreso: ${entryDateStr} | Estadía: ${relTime}`;

  // 4. Datos del Propietario (Salto Interactivo)
  const clientObj = clients.find(c => c.name.trim().toLowerCase() === (v.client || '').trim().toLowerCase());
  document.getElementById('otd-client-name').textContent = v.client || '—';
  document.getElementById('otd-client-phone').innerHTML = `<i data-lucide="phone" style="width: 12px; height: 12px; color: var(--text-muted);"></i> ${v.clientPhone || 'Sin teléfono'}`;
  document.getElementById('otd-client-email').innerHTML = `<i data-lucide="mail" style="width: 12px; height: 12px; color: var(--text-muted);"></i> ${v.clientEmail || 'Sin email'}`;
  
  const clientBtn = document.getElementById('otd-client-trigger-btn');
  if (clientBtn) {
    if (clientObj) {
      clientBtn.style.display = 'flex';
      clientBtn.onclick = () => {
        closeModal('ot-details-modal');
        openClientDetailsModal(clientObj.id);
      };
    } else {
      clientBtn.style.display = 'none';
    }
  }

  // 5. Datos del Vehículo (Salto Interactivo)
  document.getElementById('otd-vehicle-title').textContent = `${v.brand || 'Vehículo'} ${v.model || ''}`;
  document.getElementById('otd-vehicle-plate').textContent = v.plate || '—';
  document.getElementById('otd-vehicle-specs').textContent = `Año: ${v.year || '—'} | Motor: ${v.motor || '—'} | Color: ${v.color || '—'}`;
  
  const vehicleBtn = document.getElementById('otd-vehicle-trigger-btn');
  if (vehicleBtn) {
    vehicleBtn.onclick = () => {
      closeModal('ot-details-modal');
      viewVehicleDetails(v.id);
    };
  }

  // 6. Condiciones e Ingreso (Kilometraje, Combustible, Estética)
  document.getElementById('otd-mileage').textContent = v.kilometers ? `${parseInt(v.kilometers).toLocaleString('es-ES')} km` : '—';
  
  // Combustible Gauge
  let fuelPct = 50;
  let fuelColor = '#3b82f6';
  const fuelLower = (v.fuelLevel || '1/2').toLowerCase();
  if (fuelLower.includes('vac') || fuelLower.includes('0')) { fuelPct = 5; fuelColor = '#ef4444'; }
  else if (fuelLower.includes('reser')) { fuelPct = 12; fuelColor = '#ef4444'; }
  else if (fuelLower.includes('1/4')) { fuelPct = 25; fuelColor = '#f97316'; }
  else if (fuelLower.includes('1/2')) { fuelPct = 50; fuelColor = '#3b82f6'; }
  else if (fuelLower.includes('3/4')) { fuelPct = 75; fuelColor = '#10b981'; }
  else if (fuelLower.includes('llen') || fuelLower.includes('1/1') || fuelLower.includes('full')) { fuelPct = 100; fuelColor = '#10b981'; }
  
  document.getElementById('otd-fuel-label').textContent = v.fuelLevel || '1/2';
  const fuelBar = document.getElementById('otd-fuel-bar');
  if (fuelBar) {
    fuelBar.style.width = `${fuelPct}%`;
    fuelBar.style.backgroundColor = fuelColor;
  }
  const fuelIcon = document.getElementById('otd-fuel-icon');
  if (fuelIcon) {
    fuelIcon.style.color = fuelColor;
  }

  // Estética
  const aestheticText = document.getElementById('otd-aesthetic-text');
  const aestheticWrapper = document.getElementById('otd-aesthetic-notes-wrapper');
  const aestheticNotes = document.getElementById('otd-aesthetic-notes');
  if (aestheticText) {
    if (v.detailsNotes && v.detailsNotes.trim()) {
      aestheticText.innerHTML = `<span style="color: #eab308; display: flex; align-items: center; gap: 4px;"><i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i> Con detalles</span>`;
      if (aestheticNotes) aestheticNotes.textContent = v.detailsNotes;
      if (aestheticWrapper) aestheticWrapper.style.display = 'block';
    } else {
      aestheticText.innerHTML = `<span style="color: #10b981; display: flex; align-items: center; gap: 4px;"><i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Sin detalles</span>`;
      if (aestheticWrapper) aestheticWrapper.style.display = 'none';
    }
  }

  // 7. Diagnósticos y Comentarios
  document.getElementById('otd-ingreso-notes').textContent = v.services || 'Sin detalles registrados en el ingreso.';
  document.getElementById('otd-quote-description').textContent = v.quoteNotes || 'Sin descripción técnica registrada en la cotización.';
  document.getElementById('otd-observations-notes').textContent = v.otObservations || 'Sin comentarios u observaciones adicionales en la OT.';

  // 8. checklist de Tareas (Qué se arregló)
  const tasksContainer = document.getElementById('otd-tasks-list');
  if (tasksContainer) {
    if (!v.otTasks || v.otTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; background: var(--card-bg); border: 1.5px dashed var(--border-color); border-radius: var(--radius-sm); text-align: center; gap: 6px; height: 100%;">
          <i data-lucide="check-square" style="width: 24px; height: 24px; color: var(--text-muted);"></i>
          <span style="font-size: 12.5px; color: var(--text-muted); font-weight: 500;">No hay tareas en el checklist técnico de esta orden.</span>
        </div>
      `;
    } else {
      tasksContainer.innerHTML = v.otTasks.map(task => {
        const icon = task.completed ? 'check-circle' : 'circle';
        const iconColor = task.completed ? '#10b981' : 'var(--text-muted)';
        const textDecoration = task.completed ? 'line-through' : 'none';
        const textColor = task.completed ? 'var(--text-muted)' : 'var(--text-primary)';
        const obsText = task.observation ? `<div style="font-size: 11.5px; color: var(--text-secondary); font-style: italic; margin-left: 24px; margin-top: 2px;">Nota técnica: ${task.observation}</div>` : '';
        
        return `
          <div style="background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="${icon}" style="width: 15px; height: 15px; color: ${iconColor}; flex-shrink: 0;"></i>
              <span style="text-decoration: ${textDecoration}; color: ${textColor}; font-size: 12.5px; font-weight: 600;">${task.name}</span>
            </div>
            ${obsText}
          </div>
        `;
      }).join('');
    }
  }

  // 9. Desglose de Precios y Cotización
  const quoteTbody = document.getElementById('otd-quote-tbody');
  const quoteServices = v.quoteServices || [];
  const quoteParts = v.quoteParts || [];
  
  let subtotalServices = quoteServices.reduce((sum, item) => sum + (item.value || 0), 0);
  let subtotalParts = quoteParts.reduce((sum, item) => sum + (item.value || 0), 0);
  let subtotal = subtotalServices + subtotalParts;

  if (quoteTbody) {
    if (quoteServices.length === 0 && quoteParts.length === 0) {
      quoteTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 16px;">Sin conceptos facturables cargados.</td></tr>`;
    } else {
      let rowsHtml = '';
      quoteServices.forEach(item => {
        rowsHtml += `
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: var(--text-primary);">${item.name}</td>
            <td style="padding: 8px 12px; text-align: center;"><span class="stage-pending-badge badge-blue" style="font-size: 9px; padding: 2px 6px; font-weight: 800; border-radius: 4px;">Servicio</span></td>
            <td style="padding: 8px 12px; text-align: right; font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${formatCurrency(item.value || 0)}</td>
          </tr>
        `;
      });
      quoteParts.forEach(item => {
        rowsHtml += `
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: var(--text-primary);">${item.name}</td>
            <td style="padding: 8px 12px; text-align: center;"><span class="stage-pending-badge badge-violet" style="font-size: 9px; padding: 2px 6px; font-weight: 800; border-radius: 4px;">Repuesto</span></td>
            <td style="padding: 8px 12px; text-align: right; font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${formatCurrency(item.value || 0)}</td>
          </tr>
        `;
      });
      quoteTbody.innerHTML = rowsHtml;
    }
  }

  // Totales
  const discountPct = v.discountPercent || 0;
  const discountVal = subtotal * (discountPct / 100);
  const subtotalWithDiscount = subtotal - discountVal;
  
  let vatVal = 0;
  let finalTotal = subtotalWithDiscount;
  if (v.vatInclusive !== false) {
    vatVal = subtotalWithDiscount * 0.21;
    finalTotal = subtotalWithDiscount + vatVal;
  }
  
  document.getElementById('otd-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('otd-discount').textContent = `-${formatCurrency(discountVal)} (${discountPct}%)`;
  document.getElementById('otd-vat').textContent = formatCurrency(vatVal);
  document.getElementById('otd-total').textContent = formatCurrency(v.value || finalTotal);

  // 10. Archivos Adjuntos / Galería de la OT
  const imgGrid = document.getElementById('otd-images-grid');
  const imgEmpty = document.getElementById('otd-images-empty');
  const otImages = v.otImages || [];
  
  if (imgGrid && imgEmpty) {
    if (otImages.length === 0) {
      imgGrid.style.display = 'none';
      imgEmpty.style.display = 'flex';
    } else {
      imgGrid.style.display = 'flex';
      imgEmpty.style.display = 'none';
      imgGrid.innerHTML = otImages.map((img, i) => `
        <div style="position: relative; width: 80px; height: 80px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background: var(--card-bg-hover);" title="${img.name}">
          <img src="${img.src}" alt="${img.name}"
            style="width: 100%; height: 100%; object-fit: cover; display: block; cursor: pointer; transition: transform 0.2s;"
            class="ot-visual-thumbnail"
            onclick="window.open('${img.src}', '_blank')">
        </div>
      `).join('');
    }
  }

  // 11. Datos de Entrega y Liquidación
  const delSection = document.getElementById('otd-delivery-section');
  if (delSection) {
    if (v.delivered || v.stage === 'entregado') {
      delSection.style.display = 'block';
      
      // Fecha
      let formattedDelDate = '—';
      if (v.deliveryDate) {
        try {
          const dObj = new Date(v.deliveryDate);
          if (!isNaN(dObj)) {
            formattedDelDate = dObj.toLocaleString('es-AR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) + ' hs';
          } else {
            formattedDelDate = v.deliveryDate;
          }
        } catch (err) {
          formattedDelDate = v.deliveryDate;
        }
      }
      document.getElementById('otd-delivery-date').textContent = formattedDelDate;
      
      // Quién retira
      let receiverText = 'Cliente titular';
      if (v.deliveryReceiverType === 'tercero') {
        receiverText = `Tercero: ${v.deliveryThirdName || '—'} (DNI: ${v.deliveryThirdDni || '—'})`;
      }
      document.getElementById('otd-delivery-receiver').textContent = receiverText;
      
      // Liquidación / Pago
      let paymentText = v.deliveryPaymentStatus || 'Totalmente Pagado';
      if (v.deliveryPaymentStatus === 'Pago Parcial') {
        const partialAmt = v.deliveryPartialAmount || 0;
        const balance = Math.max(0, finalTotal - partialAmt);
        paymentText = `Pago Parcial: ${formatCurrency(partialAmt)} (Restante: ${formatCurrency(balance)}) [${v.deliveryPaymentMethod || 'Efectivo'}]`;
      } else {
        paymentText = `${paymentText} [${v.deliveryPaymentMethod || 'Efectivo'}]`;
      }
      document.getElementById('otd-delivery-payment').textContent = paymentText;
      
      // Observaciones de entrega
      const delNotesWrapper = document.getElementById('otd-delivery-notes-wrapper');
      const delNotes = document.getElementById('otd-delivery-notes');
      if (delNotesWrapper && delNotes) {
        if (v.deliveryNotes && v.deliveryNotes.trim()) {
          delNotes.textContent = v.deliveryNotes;
          delNotesWrapper.style.display = 'block';
        } else {
          delNotesWrapper.style.display = 'none';
        }
      }
    } else {
      delSection.style.display = 'none';
    }
  }

  // Abrir Modal
  document.getElementById('ot-details-modal').classList.add('open');
  initLucide();
};

window.viewVehicleDetails = function(vehicleId) {
  const menu = document.getElementById('vehicle-dropdown-menu');
  if (menu) menu.classList.remove('show');
  
  const v = vehicles.find(veh => String(veh.id) === String(vehicleId));
  if (!v) return;

  // Determinar color de avatar según color de auto
  const colorStr = v.color ? v.color.toLowerCase() : '';
  let colorHex = 'var(--color-accent)'; // default brand orange
  if (colorStr.includes('blanc') || colorStr.includes('white')) colorHex = '#999';
  else if (colorStr.includes('negr') || colorStr.includes('black')) colorHex = '#111';
  else if (colorStr.includes('roj') || colorStr.includes('red')) colorHex = '#ef4444';
  else if (colorStr.includes('azul') || colorStr.includes('blue')) colorHex = '#3b82f6';
  else if (colorStr.includes('gris') || colorStr.includes('gray')) colorHex = '#6b7280';
  else if (colorStr.includes('plata') || colorStr.includes('silver')) colorHex = '#9ca3af';

  // Cargar logo de marca decorativo como Badge en el avatar circular
  const brandNormalized = v.brand ? v.brand.toLowerCase().trim().replace(/\s+/g, '-') : '';
  const avatarEl = document.getElementById('vd-avatar');
  const logosEnabled = localStorage.getItem('taller_logos_enabled') !== 'false';
  
  if (avatarEl) {
    if (brandNormalized && logosEnabled) {
      const pngBrands = [
        "brilliance", "buick", "cadillac", "changan", "chery", "chevrolet", "daewoo", 
        "datsun", "de-tomaso", "desoto", "dodge", "dongfeng", "fisker", "ford", 
        "gaz", "gmc", "great-wall", "haval", "hispano-suiza", "honda", "hongqi", 
        "jac", "karma", "lamborghini", "lancia", "leapmotor", "lexus", "ligier", 
        "lister", "lucid", "mg", "mahindra", "maserati", "maxus", "maybach", 
        "mercury", "mitsuoka", "morgan", "morris", "nio", "noble", "ora", 
        "oldsmobile", "omoda", "pagani", "perodua", "pininfarina", "plymouth", 
        "polaris", "polestar", "pontiac", "praga", "proton", "puma", "reliant", 
        "rimac", "rover", "ruf", "saab", "saleen", "saturn", "scg", "scion", 
        "seres", "smart", "ssangyong", "subaru", "tvr", "talbot", "tata", 
        "tatra", "uaz", "vauxhall", "venturi", "vinfast", "w-motors", "wartburg", 
        "westfield", "xpeng", "zaz", "zeekr", "zenvo", "zotye"
      ];
      const logoExt = pngBrands.includes(brandNormalized) ? 'png' : 'svg';
      const fallbackExt = logoExt === 'svg' ? 'png' : 'svg';

      avatarEl.innerHTML = `<img id="vd-avatar-logo" src="brand-logos-main/${brandNormalized}-logo.${logoExt}" alt="${v.brand}" class="brand-badge-logo brand-badge-logo-${logoExt}" />`;
      
      const imgEl = document.getElementById('vd-avatar-logo');
      if (imgEl) {
        imgEl.onerror = function() {
          if (!this.dataset.retry) {
            this.dataset.retry = '1';
            this.src = `brand-logos-main/${brandNormalized}-logo.${fallbackExt}`;
            this.className = `brand-badge-logo brand-badge-logo-${fallbackExt}`;
          } else {
            // Fallback al auto naranja si falla
            avatarEl.innerHTML = `<i data-lucide="car" style="width: 24px; height: 24px; color: ${colorHex};"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
        };
      }
    } else {
      avatarEl.innerHTML = `<i data-lucide="car" style="width: 24px; height: 24px; color: ${colorHex};"></i>`;
    }
  }
  document.getElementById('vd-title').textContent = `${v.brand || 'Vehiculo'} ${v.model || ''}`;
  document.getElementById('vd-plate-badge').textContent = v.plate || 'SIN PLACA';
  document.getElementById('vd-subtitle').textContent = `Año: ${v.year || '—'} | Color: ${v.color || '—'}`;

  // Especificaciones
  document.getElementById('vd-plate').textContent = v.plate || '—';
  document.getElementById('vd-brand-model').textContent = `${v.brand || '—'} ${v.model || '—'}`;
  document.getElementById('vd-year').textContent = v.year || '—';
  document.getElementById('vd-color').textContent = v.color || '—';
  document.getElementById('vd-motor').textContent = v.motor || '—';
  document.getElementById('vd-mileage').textContent = v.kilometers ? `${parseInt(v.kilometers).toLocaleString('es-ES')} km` : '—';
  document.getElementById('vd-vin').textContent = v.vin || '—';

  // Propietario
  const clientObj = clients.find(c => c.name.trim().toLowerCase() === (v.client || '').trim().toLowerCase());
  if (clientObj) {
    document.getElementById('vd-owner-name').textContent = clientObj.name;
    document.getElementById('vd-owner-contact').textContent = `Tel: ${clientObj.phone || '—'} | Email: ${clientObj.email || '—'}`;
    
    // Configurar salto interactivo a la Ficha de Cliente
    document.getElementById('vd-owner-trigger-btn').onclick = () => {
      closeModal('vehicle-details-modal');
      openClientDetailsModal(clientObj.id);
    };
    document.getElementById('vd-owner-trigger-btn').style.display = 'flex';
  } else {
    document.getElementById('vd-owner-name').textContent = v.client || '—';
    document.getElementById('vd-owner-contact').textContent = `Tel: ${v.clientPhone || '—'} | Email: ${v.clientEmail || '—'}`;
    document.getElementById('vd-owner-trigger-btn').style.display = 'none';
  }

  // Calculos dinamicos financieros sobre este auto especifico
  const autoJobs = vehicles.filter(veh => veh.plate.replace(/\s+/g, '').toUpperCase() === v.plate.replace(/\s+/g, '').toUpperCase());
  const completedJobs = autoJobs.filter(veh => veh.delivered || veh.stage === 'listo');
  const activeJobs = autoJobs.filter(veh => !veh.delivered && veh.stage !== 'listo');

  const totalInvertido = completedJobs.reduce((sum, veh) => sum + (veh.value || 0), 0);
  const repPendientes = activeJobs.reduce((sum, veh) => sum + (veh.value || 0), 0);

  document.getElementById('vd-total-revenue').textContent = formatCurrency(totalInvertido);
  document.getElementById('vd-total-debt').textContent = formatCurrency(repPendientes);
  document.getElementById('vd-count-visits').textContent = autoJobs.length;

  // Llenar tabla de OTs historicas de este vehiculo
  const historyTbody = document.getElementById('vd-history-tbody');
  if (historyTbody) {
    if (autoJobs.length === 0) {
      historyTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 14px; font-size: 12.5px;">Sin visitas registradas.</td></tr>`;
    } else {
      historyTbody.innerHTML = autoJobs.map(veh => {
        let badgeClass = '';
        let statusText = '';
        if (veh.stage === 'recepcion') { badgeClass = 'badge-blue'; statusText = 'Recepción'; }
        else if (veh.stage === 'cotizacion') { badgeClass = 'badge-violet'; statusText = 'Cotización'; }
        else if (veh.stage === 'reparacion') { badgeClass = 'badge-red'; statusText = 'Reparación'; }
        else if (veh.stage === 'listo' || veh.delivered) { badgeClass = 'badge-green'; statusText = veh.delivered ? 'Entregado' : 'Listo'; }

        const dateObj = veh.entryTime ? new Date(veh.entryTime) : new Date('2026-05-23T12:00:00');
        const formattedEntry = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        return `
          <tr class="clickable-row" onclick="closeModal('vehicle-details-modal'); viewOTDetails('${veh.id}');" title="Ver detalles de esta OT">
            <td style="padding: 8px 12px; font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--text-primary);">${veh.id.startsWith('mock') ? 'OT-MOCK' : 'OT-' + veh.id.substring(veh.id.length - 6).toUpperCase()}</td>
            <td style="padding: 8px 12px; font-size: 12px; color: var(--text-secondary);">${formattedEntry}</td>
            <td style="padding: 8px 12px; font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;" title="${veh.otJobDescription || '—'}">${veh.otJobDescription || '—'}</td>
            <td style="padding: 8px 12px; font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--text-primary); text-align: right;">${formatCurrency(veh.value || 0)}</td>
            <td style="padding: 8px 12px; text-align: center;">
              <span class="stage-pending-badge ${badgeClass}" style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${statusText}</span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Otros propietarios asociados
  const otherOwnersSection = document.getElementById('vd-other-owners-section');
  const otherOwnersList = document.getElementById('vd-other-owners-list');
  const ownerHistory = (v.ownerHistory || []).filter(o => o.name !== v.client);
  if (ownerHistory.length > 0 && otherOwnersSection && otherOwnersList) {
    otherOwnersSection.style.display = 'flex';
    otherOwnersList.innerHTML = ownerHistory.map(o => {
      const pastClient = clients.find(c => c.name.trim().toLowerCase() === (o.name || '').trim().toLowerCase());
      const clickable = pastClient ? `onclick="closeModal('vehicle-details-modal'); openClientDetailsModal('${pastClient.id}');"` : '';
      return `
        <div ${clickable} style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--card-bg); font-size: 12.5px; font-weight: 600; color: var(--text-primary); ${pastClient ? 'cursor: pointer;' : ''} transition: background 0.15s;" ${pastClient ? 'onmouseover="this.style.background=\'var(--card-bg-hover)\'"' : ''} ${pastClient ? 'onmouseout="this.style.background=\'var(--card-bg)\'"' : ''}>
          <i data-lucide="user" style="width: 13px; height: 13px; color: var(--text-muted); flex-shrink:0;"></i>
          <span>${o.name}</span>
          ${pastClient ? '<i data-lucide="external-link" style="width: 11px; height: 11px; color: var(--text-muted); margin-left: auto;"></i>' : ''}
        </div>
      `;
    }).join('');
  } else if (otherOwnersSection) {
    otherOwnersSection.style.display = 'none';
  }

  // Trigger para Editar Vehiculo
  document.getElementById('vd-edit-trigger-btn').onclick = () => {
    closeModal('vehicle-details-modal');
    openEditVehicleModal(v.id);
  };

  // Store active vehicle id for menu actions
  window._vdActiveVehicleId = v.id;

  document.getElementById('vehicle-details-modal').classList.add('open');
  initLucide();
};

// Toggle del menú ... de la ficha de vehículo
window.toggleVehicleMenu = function() {
  const menu = document.getElementById('vd-dropdown-menu');
  if (!menu) return;
  menu.classList.toggle('show');
  // Cerrar al hacer click fuera
  const close = (e) => {
    if (!e.target.closest('#vd-dropdown-menu') && !e.target.closest('#vd-menu-btn')) {
      menu.classList.remove('show');
      document.removeEventListener('click', close);
    }
  };
  if (menu.classList.contains('show')) {
    setTimeout(() => document.addEventListener('click', close), 0);
  }
};

// Eliminar vehículo desde la ficha del vehículo
window.deleteCurrentVehicleFromModal = function() {
  const vehicleId = window._vdActiveVehicleId;
  if (!vehicleId) return;
  document.getElementById('vd-dropdown-menu')?.classList.remove('show');
  if (confirm('¿Estás seguro de que deseas eliminar este vehículo de la flota? Esta acción no se puede deshacer.')) {
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    saveState();
    closeModal('vehicle-details-modal');
    renderApp();
  }
};

// Abrir modal de cambio de propietario
window.openChangeOwnerModal = function() {
  const vehicleId = window._vdActiveVehicleId;
  if (!vehicleId) return;
  document.getElementById('vd-dropdown-menu')?.classList.remove('show');
  const v = vehicles.find(veh => String(veh.id) === String(vehicleId));
  if (!v) return;

  document.getElementById('co-vehicle-label').textContent = `${v.brand || ''} ${v.model || ''} – ${v.plate || ''}`;
  document.getElementById('co-client-search').value = '';
  document.getElementById('co-client-preview').style.display = 'none';

  // Poblar datalist con todos los clientes
  const datalist = document.getElementById('co-clients-list');
  if (datalist) {
    datalist.innerHTML = clients.map(c => `<option value="${c.name}">${c.phone || ''}</option>`).join('');
  }

  document.getElementById('change-owner-modal').classList.add('open');
  initLucide();
  setTimeout(() => document.getElementById('co-client-search').focus(), 100);
};

// Filtrar y previsualizar cliente en cambio de propietario
window.filterChangeOwnerClients = function() {
  const val = document.getElementById('co-client-search').value.trim();
  const matched = clients.find(c => c.name.toLowerCase() === val.toLowerCase());
  const preview = document.getElementById('co-client-preview');
  if (matched) {
    document.getElementById('co-client-name').textContent = matched.name;
    document.getElementById('co-client-contact').textContent = `Tel: ${matched.phone || '—'} | Email: ${matched.email || '—'}`;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
};

// Confirmar cambio de propietario
window.confirmChangeOwner = function() {
  const vehicleId = window._vdActiveVehicleId;
  if (!vehicleId) return;
  const vehicleIndex = vehicles.findIndex(v => String(v.id) === String(vehicleId));
  if (vehicleIndex === -1) return;

  const newClientName = document.getElementById('co-client-search').value.trim();
  const newClient = clients.find(c => c.name.toLowerCase() === newClientName.toLowerCase());
  if (!newClient) {
    alert('Por favor selecciona un cliente válido de la lista.');
    return;
  }

  const currentOwnerName = vehicles[vehicleIndex].client;
  // Registrar propietario anterior en historial si no está ya
  if (!vehicles[vehicleIndex].ownerHistory) vehicles[vehicleIndex].ownerHistory = [];
  if (currentOwnerName && !vehicles[vehicleIndex].ownerHistory.find(o => o.name === currentOwnerName)) {
    vehicles[vehicleIndex].ownerHistory.push({ name: currentOwnerName });
  }

  // Asignar nuevo propietario
  vehicles[vehicleIndex].client = newClient.name;
  vehicles[vehicleIndex].clientPhone = newClient.phone || '';
  vehicles[vehicleIndex].clientEmail = newClient.email || '';
  vehicles[vehicleIndex].clientCuit = newClient.cuit || '';
  vehicles[vehicleIndex].clientIva = newClient.ivaCondition || 'Consumidor Final';
  vehicles[vehicleIndex].clientAddress = newClient.address || '';

  saveState();
  closeModal('change-owner-modal');
  // Refrescar ficha de vehículo
  viewVehicleDetails(vehicleId);
  renderApp();
};

window.openEditVehicleModal = function(vehicleId) {
  const menu = document.getElementById('vehicle-dropdown-menu');
  if (menu) menu.classList.remove('show');
  
  const v = vehicles.find(veh => String(veh.id) === String(vehicleId));
  if (!v) return;

  // Fill vehicle modal form
  document.getElementById('form-vehicle-id').value = v.id;
  document.getElementById('form-plate').value = v.plate;
  document.getElementById('form-brand').value = v.brand || '';
  document.getElementById('form-model').value = v.model || '';
  document.getElementById('form-year').value = v.year || '';
  document.getElementById('form-color').value = v.color || '';
  document.getElementById('form-motor').value = v.motor || '';
  document.getElementById('form-mileage').value = v.kilometers || '';
  document.getElementById('form-vin').value = v.vin || '';
  
  // Set owner details
  document.getElementById('form-client-search').value = v.client || '';
  document.getElementById('form-client-select').value = v.client || '';

  const clientObj = clients.find(c => c.name.trim().toLowerCase() === (v.client || '').trim().toLowerCase());
  if (clientObj) {
    document.getElementById('form-nc-phone').value = clientObj.phone || '';
    document.getElementById('form-nc-email').value = clientObj.email || '';
    document.getElementById('form-client-cuit').value = clientObj.cuit || '';
    document.getElementById('form-client-iva').value = clientObj.ivaCondition || 'Consumidor Final';
    document.getElementById('form-client-address').value = clientObj.address || '';
  } else {
    document.getElementById('form-nc-phone').value = v.clientPhone || '';
    document.getElementById('form-nc-email').value = v.clientEmail || '';
    document.getElementById('form-client-cuit').value = v.clientCuit || '';
    document.getElementById('form-client-iva').value = v.clientIva || 'Consumidor Final';
    document.getElementById('form-client-address').value = v.clientAddress || '';
  }

  // Open modal
  document.getElementById('vehicle-modal').classList.add('open');
};

window.deleteVehicleFromDB = function(vehicleId) {
  const menu = document.getElementById('vehicle-dropdown-menu');
  if (menu) menu.classList.remove('show');

  if (confirm('Â¿EstÃ¡s seguro de que deseas eliminar este vehÃ­culo de la flota?')) {
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    saveState();
    renderApp();
  }
};



window.populateDatalists = function() {
  const suggestions = document.getElementById('services-suggestions');
  if (suggestions) {
    suggestions.innerHTML = servicesCatalog.map(s => `<option value="${s.name}"></option>`).join('');
  }

  const quoteSuggestions = document.getElementById('quote-services-suggestions');
  if (quoteSuggestions) {
    quoteSuggestions.innerHTML = servicesCatalog.map(s => `<option value="${s.name}">${formatCurrency(s.price)}</option>`).join('');
  }

  const quotePartsSuggestions = document.getElementById('quote-parts-suggestions');
  if (quotePartsSuggestions) {
    quotePartsSuggestions.innerHTML = partsCatalog.map(p => {
      const compat = [];
      if (p.brand && p.brand !== 'Universal') compat.push(p.brand);
      if (p.model && p.model !== 'Multimarca') compat.push(p.model);
      if (p.year && p.year !== 'â€”') compat.push(p.year);
      const suffix = compat.length > 0 ? ` [${compat.join(' ')}]` : '';
      return `<option value="${p.name}${suffix}">${formatCurrency(p.price)}</option>`;
    }).join('');
  }
};

window.editQuoteServicePrice = function(index) {
  const currentVal = activeQuoteServices[index].value;
  const newValStr = prompt(`Ingrese el nuevo precio para el servicio "${activeQuoteServices[index].name}":`, currentVal);
  if (newValStr === null) return; // cancelado
  const newVal = parseFloat(newValStr);
  if (isNaN(newVal) || newVal < 0) {
    alert('Precio invÃ¡lido.');
    return;
  }
  activeQuoteServices[index].value = newVal;
  renderQuoteTab();
  updateCalculatedTotals();
};

window.editQuotePartPrice = function(index) {
  const currentVal = activeQuoteParts[index].value;
  const newValStr = prompt(`Ingrese el nuevo precio para el repuesto "${activeQuoteParts[index].name}":`, currentVal);
  if (newValStr === null) return; // cancelado
  const newVal = parseFloat(newValStr);
  if (isNaN(newVal) || newVal < 0) {
    alert('Precio invÃ¡lido.');
    return;
  }
  activeQuoteParts[index].value = newVal;
  renderQuoteTab();
  updateCalculatedTotals();
};

window.applyDetailedModalReadOnlyState = function() {
  const isReadOnly = !!window.isDetailedViewReadOnly;
  
  // 1. Disable/enable all input, select, and textarea fields
  const inputs = document.querySelectorAll('#reception-panel-view input, #reception-panel-view select, #reception-panel-view textarea');
  inputs.forEach(input => {
    input.disabled = isReadOnly;
  });
  
  // 2. Hide or disable specific action buttons and editable areas
  const actions = [
    '.btn-recepcionar-confirm', // BotÃ³n Recepcionar
    '.approve-ot-btn',           // BotÃ³n Aprobar y crear OT
    '.add-card-btn',            // Botones de agregar
    '#prev-edit-btn',           // BotÃ³n Editar cotizaciÃ³n
    '.service-remove-btn',      // BotÃ³n remover de cotizaciÃ³n
    '.add-quote-item-btn',      // BotÃ³n agregar Ã­tem de cotizaciÃ³n
    '.parts-add-btn',           // BotÃ³n agregar repuestos
    '.circle-nav-btn',          // Botones redondos de acciones adicionales
    '.history-btn',             // Botones de historial, comentar, foto, PDF
    '.table-action-btn'         // Botones de acciones en tablas internas
  ];
  
  actions.forEach(selector => {
    const elements = document.querySelectorAll('#reception-panel-view ' + selector);
    elements.forEach(el => {
      // Don't modify the back/exit chevron buttons in the header
      if (el.closest('.reception-header-left')) return;
      
      el.style.pointerEvents = isReadOnly ? 'none' : '';
      el.style.opacity = isReadOnly ? '0.4' : '';
      
      // Completely hide main action sub-bars/buttons to avoid confusion
      if (selector === '.btn-recepcionar-confirm' || selector === '.approve-ot-btn') {
        if (isReadOnly) {
          el.style.setProperty('display', 'none', 'important');
        } else {
          // Do not touch el.style.display when not read-only.
          // This allows window.setActiveTab to control the display of footer buttons dynamically.
        }
      }
    });
  });

  // 3. Disable click events and cursors inside the lists of quote items
  const quoteLists = document.querySelectorAll('.quote-services-list, .quote-parts-list');
  quoteLists.forEach(list => {
    list.style.pointerEvents = isReadOnly ? 'none' : '';
    list.style.cursor = isReadOnly ? 'default' : 'pointer';
  });
};

// ========================================================================
//   20. SISTEMA DE PALETA DE BÃšSQUEDA GLOBAL / COMMAND PALETTE
// ========================================================================

window.openGlobalSearch = function() {
  const modal = document.getElementById('global-search-modal');
  const input = document.getElementById('palette-search-input');
  if (!modal || !input) return;

  modal.classList.add('open');
  input.value = '';
  input.focus();
  
  // Renderizar las sugerencias por defecto
  window.handlePaletteSearch();
};

window.closeGlobalSearch = function() {
  const modal = document.getElementById('global-search-modal');
  if (modal) modal.classList.remove('open');
};

window.closeGlobalSearchModal = function(e) {
  if (e.target.id === 'global-search-modal') {
    closeGlobalSearch();
  }
};

// NavegaciÃ³n por teclado dentro de la paleta
(function() {
  let selectedIndex = -1;

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('palette-search-input');
    if (!input) return;

    input.addEventListener('keydown', function(e) {
      const resultsContainer = document.getElementById('palette-results-container');
      if (!resultsContainer) return;

      const items = resultsContainer.querySelectorAll('.palette-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          items[selectedIndex].click();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeGlobalSearch();
      }
    });
  });

  function updateSelection(items) {
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  // Resetear el Ã­ndice de selecciÃ³n cuando cambia la bÃºsqueda
  window.resetPaletteSelectionIndex = function() {
    selectedIndex = -1;
  };
})();

// BÃºsqueda en vivo y renderizado de resultados agrupados
window.handlePaletteSearch = function() {
  const input = document.getElementById('palette-search-input');
  const container = document.getElementById('palette-results-container');
  if (!input || !container) return;

  const query = input.value.toLowerCase().trim();
  resetPaletteSelectionIndex();

  if (!query) {
    // Renderizar accesos rÃ¡pidos / Sugerencias si el buscador estÃ¡ vacÃ­o
    container.innerHTML = `
      <div class="palette-group-title">Sugerencias y Accesos RÃ¡pidos</div>
      <div class="palette-item" onclick="executePaletteAction('view-tablero')">
        <div class="palette-item-left">
          <i data-lucide="layout-grid" class="palette-item-icon"></i>
          <div class="palette-item-details">
            <span class="palette-item-title">Ver Tablero Kanban</span>
            <span class="palette-item-subtitle">Panel principal operativo de flujo de trabajo</span>
          </div>
        </div>
        <span class="palette-item-action">Ir a vista</span>
      </div>
      <div class="palette-item" onclick="executePaletteAction('new-vehicle')">
        <div class="palette-item-left">
          <i data-lucide="plus-circle" class="palette-item-icon"></i>
          <div class="palette-item-details">
            <span class="palette-item-title">Ingresar nuevo vehÃ­culo</span>
            <span class="palette-item-subtitle">Abre el modal de recepciÃ³n y registro</span>
          </div>
        </div>
        <span class="palette-item-action">Abrir</span>
      </div>
      <div class="palette-item" onclick="executePaletteAction('view-agenda')">
        <div class="palette-item-left">
          <i data-lucide="calendar" class="palette-item-icon"></i>
          <div class="palette-item-details">
            <span class="palette-item-title">Ver Agenda</span>
            <span class="palette-item-subtitle">Calendario interactivo y turnos</span>
          </div>
        </div>
        <span class="palette-item-action">Ir a vista</span>
      </div>
      <div class="palette-item" onclick="executePaletteAction('view-stats')">
        <div class="palette-item-left">
          <i data-lucide="bar-chart-3" class="palette-item-icon"></i>
          <div class="palette-item-details">
            <span class="palette-item-title">Ver EstadÃ­sticas</span>
            <span class="palette-item-subtitle">MÃ©tricas, ingresos y anÃ¡lisis tÃ©cnico</span>
          </div>
        </div>
        <span class="palette-item-action">Ir a vista</span>
      </div>
      <div class="palette-item" onclick="executePaletteAction('view-services')">
        <div class="palette-item-left">
          <i data-lucide="wrench" class="palette-item-icon"></i>
          <div class="palette-item-details">
            <span class="palette-item-title">Ver CatÃ¡logo de Servicios</span>
            <span class="palette-item-subtitle">Administra los servicios predefinidos</span>
          </div>
        </div>
        <span class="palette-item-action">Ir a vista</span>
      </div>
    `;
    initLucide();
    return;
  }

  // Filtrar vehÃ­culos, clientes y catÃ¡logos
  const matchedVehicles = vehicles.filter(v => {
    const isGol = v.id === 'mock-vehicle-gol-2026';
    const indexNum = isGol ? '2' : (v.id && v.id.length >= 2 ? v.id.substring(v.id.length - 2) : '01');
    return (v.plate && v.plate.toLowerCase().includes(query)) ||
           (v.brand && v.brand.toLowerCase().includes(query)) ||
           (v.model && v.model.toLowerCase().includes(query)) ||
           (v.client && v.client.toLowerCase().includes(query)) ||
           `#${indexNum}`.includes(query);
  });

  const matchedClients = clients.filter(c => 
    (c.name && c.name.toLowerCase().includes(query)) ||
    (c.phone && c.phone.toLowerCase().includes(query)) ||
    (c.email && c.email.toLowerCase().includes(query))
  );

  const matchedServices = servicesCatalog.filter(s => 
    (s.name && s.name.toLowerCase().includes(query)) ||
    (s.description && s.description.toLowerCase().includes(query))
  );

  const matchedParts = partsCatalog.filter(p => 
    (p.name && p.name.toLowerCase().includes(query)) ||
    (p.description && p.description.toLowerCase().includes(query))
  );

  const totalResults = matchedVehicles.length + matchedClients.length + matchedServices.length + matchedParts.length;

  if (totalResults === 0) {
    container.innerHTML = `
      <div class="palette-empty-state">
        <i data-lucide="help-circle"></i>
        <span>No se encontraron resultados para "${input.value}"</span>
      </div>
    `;
    initLucide();
    return;
  }

  let html = '';

  // Renderizar VehÃ­culos Encontrados
  if (matchedVehicles.length > 0) {
    html += `<div class="palette-group-title">VehÃ­culos / Ingresos</div>`;
    matchedVehicles.forEach(v => {
      const isGol = v.id === 'mock-vehicle-gol-2026';
      const indexNum = isGol ? '2' : (v.id && v.id.length >= 2 ? v.id.substring(v.id.length - 2) : '01');
      
      let stageText = 'RecepciÃ³n';
      let badgeClass = 'badge-blue';
      if (v.stage === 'cotizacion') {
        stageText = 'En CotizaciÃ³n';
        badgeClass = 'badge-violet';
      } else if (v.stage === 'reparacion') {
        stageText = 'En ReparaciÃ³n';
        badgeClass = 'badge-red';
      } else if (v.stage === 'listo') {
        stageText = 'Listo';
        badgeClass = 'badge-green';
      }

      html += `
        <div class="palette-item" onclick="executePaletteAction('open-vehicle', '${v.id}')">
          <div class="palette-item-left">
            <i data-lucide="car" class="palette-item-icon"></i>
            <div class="palette-item-details">
              <span class="palette-item-title">${v.brand} ${v.model} <span style="font-family: var(--font-mono); color: var(--text-muted); font-size: 11px;">(${v.plate})</span></span>
              <span class="palette-item-subtitle">Cliente: ${v.client} | Ingreso #${indexNum}</span>
            </div>
          </div>
          <div class="palette-item-right">
            <span class="stage-pending-badge ${badgeClass}" style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${stageText}</span>
            <span class="palette-item-action">Ver ficha</span>
          </div>
        </div>
      `;
    });
  }

  // Renderizar Clientes Encontrados
  if (matchedClients.length > 0) {
    html += `<div class="palette-group-title">Clientes</div>`;
    matchedClients.forEach(c => {
      html += `
        <div class="palette-item" onclick="executePaletteAction('open-client', '${c.name}')">
          <div class="palette-item-left">
            <i data-lucide="user" class="palette-item-icon"></i>
            <div class="palette-item-details">
              <span class="palette-item-title">${c.name}</span>
              <span class="palette-item-subtitle">Tel: ${c.phone || 'N/A'} | Correo: ${c.email || 'N/A'}</span>
            </div>
          </div>
          <span class="palette-item-action">Ver en Clientes</span>
        </div>
      `;
    });
  }

  // Renderizar Servicios del CatÃ¡logo Encontrados
  if (matchedServices.length > 0) {
    html += `<div class="palette-group-title">Servicios del CatÃ¡logo</div>`;
    matchedServices.forEach(s => {
      html += `
        <div class="palette-item" onclick="executePaletteAction('open-service', '${s.name}')">
          <div class="palette-item-left">
            <i data-lucide="wrench" class="palette-item-icon"></i>
            <div class="palette-item-details">
              <span class="palette-item-title">${s.name}</span>
              <span class="palette-item-subtitle">${s.description || 'Sin descripciÃ³n'}</span>
            </div>
          </div>
          <span class="palette-item-action">Ver en CatÃ¡logo</span>
        </div>
      `;
    });
  }

  // Renderizar Repuestos del CatÃ¡logo Encontrados
  if (matchedParts.length > 0) {
    html += `<div class="palette-group-title">Repuestos del CatÃ¡logo</div>`;
    matchedParts.forEach(p => {
      html += `
        <div class="palette-item" onclick="executePaletteAction('open-part', '${p.name}')">
          <div class="palette-item-left">
            <i data-lucide="package" class="palette-item-icon"></i>
            <div class="palette-item-details">
              <span class="palette-item-title">${p.name}</span>
              <span class="palette-item-subtitle">${p.description || 'Sin descripciÃ³n'}</span>
            </div>
          </div>
          <span class="palette-item-action">Ver en CatÃ¡logo</span>
        </div>
      `;
    });
  }

  container.innerHTML = html;
  initLucide();
};

// Acciones al seleccionar un Ã­tem de la paleta
window.executePaletteAction = function(action, param) {
  closeGlobalSearch();

  if (action === 'view-tablero') {
    switchView('tablero');
  } else if (action === 'new-vehicle') {
    openAddVehicleModal('recepcion');
  } else if (action === 'view-agenda') {
    switchView('agenda');
  } else if (action === 'view-stats') {
    switchView('reportes');
  } else if (action === 'view-services') {
    switchView('servicios-catalogo');
  } else if (action === 'open-vehicle') {
    // Abrir ficha detallada del vehÃ­culo
    openDetailedReception(param);
  } else if (action === 'open-client') {
    // Cambiar a vista de clientes y filtrar por cliente
    switchView('clientes-lista');
    const input = document.getElementById('cli-search-input');
    if (input) {
      input.value = param;
      renderClientesListaView();
    }
  } else if (action === 'open-service') {
    // Cambiar a catÃ¡logo de servicios y filtrar por nombre
    switchView('servicios-catalogo');
    const input = document.getElementById('catalogo-servicios-search');
    if (input) {
      input.value = param;
      renderServiciosCatalogView();
    }
  } else if (action === 'open-part') {
    // Cambiar a catÃ¡logo de repuestos y filtrar por nombre
    switchView('repuestos-catalogo');
    const input = document.getElementById('catalogo-repuestos-search');
    if (input) {
      input.value = param;
      renderRepuestosCatalogView();
    }
  }
};

// --- Dropdown de Acciones Adicionales en la Cabecera de la Ficha ---
window.toggleHeaderDropdown = function(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('ficha-more-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
};

document.addEventListener('click', function() {
  const dropdown = document.getElementById('ficha-more-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
  }
});

// --- NavegaciÃ³n profunda al Historial de Ã“rdenes de Trabajo por Patente ---
window.viewWorkOrderHistoryOfActiveVehicle = function() {
  if (!activeReceptionVehicleId) return;
  const vehicle = vehicles.find(v => String(v.id) === String(activeReceptionVehicleId));
  if (!vehicle) return;

  const plate = vehicle.plate || '';
  
  // 1. Cerrar ficha detallada
  exitDetailedReception();
  
  // 2. Rellenar la barra de bÃºsqueda local de OTs con la patente
  const otSearchInput = document.getElementById('ot-search-input');
  if (otSearchInput) {
    otSearchInput.value = plate;
  }
  
  // Limpiar buscador general para evitar interferencias
  const sidebarSearchInput = document.getElementById('sidebar-search-input');
  if (sidebarSearchInput) {
    sidebarSearchInput.value = '';
  }

  // 3. Cambiar a secciÃ³n "Ordenes de trabajo"
  switchView('ordenes-trabajo');
};

// --- Control del Dropdown de Factura ---
window.toggleInvoiceDropdown = function(event) {
  event.stopPropagation();
  const menu = document.getElementById('invoice-dropdown-menu');
  if (!menu) return;
  const isOpen = menu.style.display === 'block';
  // Cerrar todos los dropdowns abiertos
  document.querySelectorAll('.invoice-dropdown-menu').forEach(m => m.style.display = 'none');
  if (!isOpen) {
    menu.style.display = 'block';
    // Cerrar al hacer clic fuera
    const closeHandler = function(e) {
      if (!menu.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 50);
  }
};

// --- Motor de Facturación ARCA (ex-AFIP) ---
window.downloadTaxInvoicePDF = function(invoiceType, event, returnBlob = false) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('invoice-dropdown-menu');
  if (menu) menu.style.display = 'none';

  const id = activeReceptionVehicleId;
  if (!id) { alert('No hay ningún vehículo activo para generar la factura.'); return; }
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) { alert('Vehículo no encontrado.'); return; }

  let services = [...(activeQuoteServices.length > 0 ? activeQuoteServices : (vehicle.quoteServices || []))];
  let parts    = [...(activeQuoteParts.length > 0   ? activeQuoteParts   : (vehicle.quoteParts    || []))];
  if (services.length === 0 && parts.length === 0) {
    alert('La cotización está vacía. Agregue servicios o repuestos antes de generar la factura.');
    return;
  }

  const ws = workshopConfig;
  const wsName   = ws.name    || 'Mi Taller Mecánico';
  const wsAddr   = ws.address || 'Sin dirección';
  const wsPhone  = ws.phone1  || '';
  const wsIibb   = ws.iibb    || '';
  const wsPV     = String(ws.pv || '0005').padStart(4, '0');

  // Helper para generar placeholders en rojo
  const makePh = (desc) => `<span class="ph-red" style="color:#dc2626;font-weight:700">placeholder - ${desc}</span>`;

  // Datos del taller que deben venir de ARCA (PLACEHOLDERs si no están configurados)
  const wsCuitRaw = ws.cuit || '';
  const wsCuitDisplay  = (wsCuitRaw && wsCuitRaw !== '30-12345678-9') ? wsCuitRaw : makePh('cuit del emisor');
  const wsInicioRaw    = ws.inicioAct || '';
  let   wsInicioDisplay = makePh('fecha de inicio de actividades');
  try { if (wsInicioRaw) { const p = wsInicioRaw.split('-'); wsInicioDisplay = `${p[2]}/${p[1]}/${p[0]}`; } } catch(_){}
  
  // Condición IVA del emisor: Factura C es Monotributista. Factura A y B son Responsable Inscripto (o placeholder)
  const wsIvaRaw = ws.ivaCondition || '';
  const wsIvaDisplay = (invoiceType === 'C') ? 'Monotributista' : (wsIvaRaw || makePh('condicion frente al iva del emisor'));

  // Datos del Cliente (PLACEHOLDERs si tienen valores por defecto o mocks)
  const clientNameRaw = (vehicle.client || '').trim();
  const clientName    = (clientNameRaw && clientNameRaw !== 'Enzo Da Silva' && clientNameRaw !== 'Consumidor Final') ? clientNameRaw : makePh('nombre del cliente');
  
  const clientCuitRaw = (vehicle.clientCuit || '').trim();
  const clientCuit    = (clientCuitRaw && clientCuitRaw !== '99-99999999-9') ? clientCuitRaw : makePh('documento del cliente');
  
  const clientAddrRaw = (vehicle.clientAddress || '').trim();
  const clientAddr    = (clientAddrRaw && clientAddrRaw !== 'Sin Dirección') ? clientAddrRaw : makePh('domicilio del cliente');

  const clientIvaRaw  = (vehicle.clientIva || '').trim();
  // Para Factura A, 'Consumidor Final' es inconsistente -> placeholder
  const clientIva     = (invoiceType === 'A')
    ? ((clientIvaRaw && clientIvaRaw !== 'Consumidor Final') ? clientIvaRaw : makePh('condicion frente al iva del cliente'))
    : (clientIvaRaw || 'Consumidor Final');

  // Número de comprobante (real en producción vendrá de ARCA)
  const matchResult = typeof vehicle.id === 'string' ? vehicle.id.match(/\d+/) : null;
  const invoiceSeq  = matchResult ? parseInt(matchResult[0]) : (vehicles.indexOf(vehicle) + 1);
  const wsCuitClean = wsCuitRaw.replace(/\D/g, '').slice(0, 10) || '30000000000';
  const compNum     = makePh('numero de comprobante');
  const pvDisplay   = makePh('punto de venta');

  const typeCode  = invoiceType === 'A' ? '01' : invoiceType === 'B' ? '06' : '11';
  const typeLabel = invoiceType === 'A' ? 'FACTURA A' : invoiceType === 'B' ? 'FACTURA B' : 'FACTURA C';
  const isTypeA   = invoiceType === 'A';

  const now      = new Date();
  const emitDate = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const discPercent = parseFloat((document.getElementById('calc-discount') || {}).value) || vehicle.discountPercent || 0;
  const rawSubtotal = [...services, ...parts].reduce((s, i) => s + i.value, 0);
  const discountVal = rawSubtotal * (discPercent / 100);
  const net         = rawSubtotal - discountVal;
  const ivaAmount   = isTypeA ? Math.round(net * 0.21) : 0;
  const totalFinal  = isTypeA ? Math.round(net + ivaAmount) : Math.round(net);

  // CAE: siempre PLACEHOLDER hasta integrar ARCA
  const cae    = makePh('cae');
  const caeVto = makePh('fecha de vencimiento del cae');

  // Código de barras: placeholder visual
  const invoiceNum   = String(invoiceSeq).padStart(8, '0');
  const barcodeRaw   = makePh('codigo de barras fiscal');

  // QR: PLACEHOLDER-QR-AFIP (vendrá de ARCA en producción)
  const qrPlaceholder = true;

  let inicioFmt = wsInicioDisplay;

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);

  let rowsHtml = '';
  let idx = 1;
  const cols = isTypeA ? 6 : 5;
  const buildRow = (item) => `<tr class="item-row">
    <td>${idx++}</td><td>${item.name}</td>
    <td style="text-align:right">1</td>
    <td style="text-align:right">${fmt(item.value)}</td>
    ${isTypeA ? `<td style="text-align:right">21%</td>` : ''}
    <td style="text-align:right">${fmt(item.value)}</td>
  </tr>`;

  if (services.length > 0) {
    rowsHtml += `<tr class="cat-row"><td colspan="${cols}"><b>Servicios</b></td></tr>`;
    services.forEach(i => { rowsHtml += buildRow(i); });
  }
  if (parts.length > 0) {
    rowsHtml += `<tr class="cat-row"><td colspan="${cols}"><b>Repuestos y Materiales</b></td></tr>`;
    parts.forEach(i => { rowsHtml += buildRow(i); });
  }

  let totalsHtml = '';
  if (discPercent > 0) {
    totalsHtml += `<div class="tot-row"><span>Subtotal Bruto:</span><span>${fmt(rawSubtotal)}</span></div><div class="tot-row"><span>Descuento (${discPercent}%):</span><span>-${fmt(rawSubtotal - net)}</span></div>`;
  }
  if (isTypeA) {
    totalsHtml += `<div class="tot-row"><span>Neto Gravado (21%):</span><span>${fmt(net)}</span></div><div class="tot-row"><span>IVA (21%):</span><span>${fmt(ivaAmount)}</span></div>`;
  } else {
    if (discPercent === 0) totalsHtml += `<div class="tot-row"><span>Subtotal:</span><span>${fmt(rawSubtotal)}</span></div>`;
    totalsHtml += `<div class="tot-row" style="font-size:9px;color:#555"><span>IVA incluido en los precios</span></div>`;
  }
  totalsHtml += `<div class="tot-main"><span>TOTAL:</span><span>${fmt(totalFinal)}</span></div>`;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px';
  container.style.height = '1px';
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';

  container.innerHTML = `
    <style>
      .envelope, .envelope *{box-sizing:border-box !important;margin:0 !important;padding:0 !important}
      .envelope{border:2.5px solid #000 !important;border-radius:4px !important;padding:10px !important;font-family:'Inter',sans-serif !important;font-size:10px !important;color:#000 !important;background:#fff !important}
      .envelope table { background-color: #fff !important; color: #000 !important; }
      .envelope td, .envelope th { background-color: #fff !important; color: #000 !important; border-color: #000 !important; }
      .inv-header{display:grid !important;grid-template-columns:1fr 80px 1fr !important;border-bottom:2px solid #000 !important}
      .inv-left{padding:10px 12px !important}
      .inv-right{padding:10px 12px !important;border-left:2px solid #000 !important;text-align:right !important}
      .inv-center{display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;border-left:2px solid #000 !important;border-right:2px solid #000 !important;padding:6px 4px !important;text-align:center !important}
      .inv-letter{font-size:44px !important;font-weight:900 !important;line-height:1 !important;color:#000 !important;border:2px solid #000 !important;width:58px !important;height:58px !important;display:flex !important;align-items:center !important;justify-content:center !important;border-radius:2px !important}
      .inv-code{font-size:9px !important;font-weight:700 !important;color:#000 !important;margin-top:3px !important}
      .inv-center-label{font-size:7px !important;color:#000 !important;margin-top:2px !important}
      .ws-logo{font-size:16px !important;font-weight:800 !important;color:#000 !important;margin-bottom:3px !important}
      .ws-detail{font-size:9px !important;color:#000 !important;line-height:1.6 !important}
      .ws-bold{font-weight:700 !important;color:#000 !important}
      .inv-title{font-size:13px !important;font-weight:800 !important;color:#000 !important;text-transform:uppercase !important;margin-bottom:6px !important;letter-spacing:.5px !important}
      .inv-detail{font-size:9px !important;color:#000 !important;margin-bottom:2px !important}
      .inv-num{font-size:11px !important;font-weight:700 !important;color:#000 !important}
      .receptor-section{border-bottom:1.5px solid #000 !important;padding:8px 12px !important;display:grid !important;grid-template-columns:1fr 1fr 1fr !important;gap:8px !important}
      .rec-field{display:flex !important;flex-direction:column !important}
      .rec-label{font-size:8px !important;font-weight:700 !important;color:#555 !important;text-transform:uppercase !important;margin-bottom:1px !important}
      .rec-value{font-size:10px !important;font-weight:600 !important;color:#000 !important}
      .items-section{padding:0 12px !important}
      table{width:100% !important;border-collapse:collapse !important;margin-bottom:0 !important}
      thead th{background:#000 !important;color:#fff !important;font-size:8.5px !important;font-weight:700 !important;padding:5px 7px !important;text-align:left !important}
      thead th:not(:first-child):not(:nth-child(2)){text-align:right !important}
      .cat-row td{background:#f0f0f0 !important;color:#000 !important;font-size:8.5px !important;padding:4px 7px !important;border-bottom:1px solid #000 !important}
      .item-row td{padding:4.5px 7px !important;font-size:9px !important;border-bottom:1px solid #f0f0f0 !important;color:#000 !important;vertical-align:middle !important}
      .totals-wrapper{display:flex !important;justify-content:flex-end !important;padding:0 12px 10px !important;border-bottom:1.5px solid #000 !important}
      .totals-box{min-width:260px !important;border:1px solid #000 !important;border-radius:4px !important;overflow:hidden !important}
      .tot-row{display:flex !important;justify-content:space-between !important;padding:4px 10px !important;font-size:9px !important;background:#fafafa !important;border-bottom:1px solid #f0f0f0 !important}
      .tot-main{display:flex !important;justify-content:space-between !important;padding:7px 10px !important;font-size:13px !important;font-weight:800 !important;color:#fff !important;background:#000 !important}
      .cae-footer{padding:10px 12px !important;display:flex !important;align-items:flex-start !important;justify-content:space-between !important;gap:16px !important}
      .cae-info{flex:1 !important}
      .cae-label{font-size:8px !important;font-weight:700 !important;color:#555 !important;text-transform:uppercase !important;margin-bottom:2px !important}
      .cae-value{font-size:10px !important;font-weight:700 !important;color:#000 !important}
      .cae-vto{font-size:9px !important;color:#555 !important;margin-top:2px !important}
      .barcode-strip{font-family:monospace !important;font-size:6.5px !important;letter-spacing:1.5px !important;color:#000 !important;word-break:break-all !important;max-width:200px !important;border:1px solid #000 !important;padding:3px 5px !important;border-radius:3px !important;background:#fafafa !important;margin-top:4px !important}
      .qr-block{display:flex !important;flex-direction:column !important;align-items:center !important;gap:3px !important}
      .qr-ph{width:80px !important;height:80px !important;border:1.5px dashed #dc2626 !important;border-radius:3px !important;display:flex !important;align-items:center !important;justify-content:center !important;font-size:7.5px !important;font-weight:700 !important;color:#dc2626 !important;text-align:center !important;padding:6px !important;background:#fff5f5 !important}
      .qr-caption{font-size:7px !important;color:#555 !important;text-align:center !important}
      .stamp-footer{text-align:center !important;border-top:1px dashed #000 !important;padding-top:6px !important;margin-top:2px !important;font-size:7.5px !important;color:#888 !important}
    </style>
    <div class="envelope">
      <div class="inv-header">
        <div class="inv-left">
          <div class="ws-logo">${wsName}</div>
          <div class="ws-detail">
            <span class="ws-bold">Direcci\u00f3n:</span> ${wsAddr}<br>
            ${wsPhone ? '<span class="ws-bold">Tel.:</span> ' + wsPhone + '<br>' : ''}
            <span class="ws-bold">Condici\u00f3n frente al IVA:</span> ${wsIvaDisplay}<br>
            ${wsIibb ? '<span class="ws-bold">IIBB:</span> ' + wsIibb + '<br>' : ''}
            <span class="ws-bold">CUIT:</span> ${wsCuitDisplay}<br>
            <span class="ws-bold">Inicio de Actividades:</span> ${inicioFmt}
          </div>
        </div>
        <div class="inv-center">
          <div class="inv-letter">${invoiceType}</div>
          <div class="inv-code">Cod. ${typeCode}</div>
          ${isTypeA ? '' : '<div class="inv-center-label">DOC. NO APTO<br>CR\u00c9DITO FISCAL</div>'}
        </div>
        <div class="inv-right">
          <div class="inv-title">${typeLabel}</div>
          <div class="inv-detail"><span class="ws-bold">N\u00b0 Comprobante:</span></div>
          <div class="inv-num">${compNum}</div>
          <br>
          <div class="inv-detail"><span class="ws-bold">Fecha de Emisi\u00f3n:</span> ${emitDate}</div>
          <br>
          <div class="inv-detail" style="font-size:8px;color:#000">Veh\u00edculo: ${vehicle.plate} \u00b7 ${vehicle.brand||''} ${vehicle.model||''} ${vehicle.year||''}</div>
          ${vehicle.motor ? '<div class="inv-detail" style="font-size:8px;color:#000">Motor: ' + vehicle.motor + '</div>' : ''}
        </div>
      </div>
      <div class="receptor-section">
        <div class="rec-field">
          <span class="rec-label">Apellido y Nombre / Raz\u00f3n Social</span>
          <span class="rec-value">${clientName}</span>
        </div>
        <div class="rec-field">
          <span class="rec-label">Domicilio</span>
          <span class="rec-value">${clientAddr}</span>
        </div>
        <div class="rec-field">
          <span class="rec-label">CUIT / DNI</span>
          <span class="rec-value">${clientCuit}</span>
          <span class="rec-label" style="margin-top:4px">Cond. IVA</span>
          <span class="rec-value">${clientIva}</span>
        </div>
      </div>
      <div class="items-section">
        <table>
          <thead>
            <tr>
              <th style="width:26px">#</th>
              <th>Descripci\u00f3n</th>
              <th style="width:40px;text-align:right">Cant.</th>
              <th style="width:90px;text-align:right">P. Unit.${isTypeA ? ' (Neto)' : ''}</th>
              ${isTypeA ? '<th style="width:55px;text-align:right">Al\u00edc. IVA</th>' : ''}
              <th style="width:90px;text-align:right">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
      <div class="totals-wrapper">
        <div class="totals-box">
          ${totalsHtml}
        </div>
      </div>
      <div class="cae-footer">
        <div class="cae-info">
          <div class="cae-label">C\u00f3digo de Autorizaci\u00f3n Electr\u00f3nico (CAE)</div>
          <div class="cae-value">N\u00b0: ${cae}</div>
          <div class="cae-vto">Fecha Vto. CAE: ${caeVto}</div>
          <div class="barcode-strip">${barcodeRaw}</div>
          <div style="font-size:7.5px;color:#888;margin-top:6px">Comprobante generado para <b>${wsName}</b> \u00b7 Punto de Venta: ${pvDisplay}</div>
        </div>
        <div class="qr-block">
          <div class="qr-ph">placeholder - qr de afip</div>
          <div class="qr-caption">afip.gob.ar/fe/qr</div>
        </div>
      </div>
      <div class="stamp-footer">Factura generada con Gesti\u00f3n de Taller Appli-Car &nbsp;\u00b7&nbsp; ${typeLabel} &nbsp;\u00b7&nbsp; Comprobante N\u00b0 ${compNum}</div>
    </div>
  `;

  document.body.appendChild(container);

  const opt = {
    margin:       [8, 10, 8, 10],
    filename:     `Factura_${invoiceType}_${invoiceNum}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const targetElement = container.querySelector('.envelope');
  const worker = html2pdf().set(opt).from(targetElement);
  if (returnBlob) {
    return worker.outputPdf('blob').then(blob => {
      container.remove();
      return blob;
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      container.remove();
      throw err;
    });
  } else {
    worker.save().then(() => {
      container.remove();
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      container.remove();
    });
  }
};// --- GeneraciÃ³n de CotizaciÃ³n en PDF de Alta Fidelidad ---

window.downloadQuotePDF = function(vehicleId, returnBlob = false) {
  if (typeof loadWorkshopConfig === 'function') {
    loadWorkshopConfig();
  }
  const logoWide = localStorage.getItem('taller_logo_wide');
  const logoSquare = localStorage.getItem('taller_logo_square');

  const id = vehicleId || activeReceptionVehicleId;
  if (!id) {
    alert('No hay ningÃºn vehÃ­culo activo para generar el presupuesto.');
    return;
  }
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) {
    alert('VehÃ­culo no encontrado.');
    return;
  }

  // Obtener Ã­tems activos
  let services = [];
  let parts = [];
  if (String(activeReceptionVehicleId) === String(vehicle.id)) {
    services = [...activeQuoteServices];
    parts = [...activeQuoteParts];
  } else {
    services = [...(vehicle.quoteServices || [])];
    parts = [...(vehicle.quoteParts || [])];
  }

  if (services.length === 0 && parts.length === 0) {
    alert('La cotizaciÃ³n estÃ¡ vacÃ­a. Agregue servicios o repuestos antes de descargar.');
    return;
  }

  // Obtener nÃºmero de presupuesto correlativo robusto y libre de crashes
  const isGolMock = vehicle.id === 'mock-vehicle-gol-2026';
  const matchResult = typeof vehicle.id === 'string' ? vehicle.id.match(/\d+/) : null;
  const baseNum = isGolMock ? 5 : (matchResult ? parseInt(matchResult[0]) : (vehicles.indexOf(vehicle) + 1));
  const budgetNum = String(99 + baseNum).padStart(8, '0');

  // Formatear fecha robustamente
  let formattedDate = '';
  try {
    const entryDateStr = vehicle.entryDate || new Date().toISOString().split('T')[0];
    const partsDate = entryDateStr.split('T')[0].replace(/\//g, '-').split('-');
    if (partsDate.length === 3) {
      if (partsDate[0].length === 4) {
        formattedDate = `${partsDate[2]}-${partsDate[1]}-${partsDate[0]}`;
      } else {
        formattedDate = `${partsDate[0]}-${partsDate[1]}-${partsDate[2]}`;
      }
    } else {
      formattedDate = entryDateStr;
    }
  } catch (e) {
    formattedDate = new Date().toLocaleDateString('es-ES');
  }

  // Calcular totales
  const servSum = services.reduce((s, item) => s + item.value, 0);
  const partsSum = parts.reduce((s, item) => s + item.value, 0);
  const subtotal = servSum + partsSum;

  let discPercent = 0;
  let vatInclusive = true;
  if (String(activeReceptionVehicleId) === String(vehicle.id)) {
    discPercent = parseFloat(document.getElementById('calc-discount').value) || 0;
    vatInclusive = document.getElementById('calc-vat-inclusive').checked;
  } else {
    discPercent = vehicle.discountPercent || 0;
    vatInclusive = vehicle.vatInclusive !== false;
  }

  const discountVal = subtotal * (discPercent / 100);
  const net = subtotal - discountVal;
  const total = vatInclusive ? net : net * 1.19;

  // Renderizar filas de la tabla principal
  let globalIndex = 1;
  let rowsHtml = '';

  if (services.length > 0) {
    rowsHtml += `
      <tr class="category-row">
        <td colspan="5"><span class="category-title">Servicios</span></td>
      </tr>
    `;
    services.forEach(item => {
      rowsHtml += `
        <tr class="item-row">
          <td>${globalIndex++}</td>
          <td>${item.name}</td>
          <td>1</td>
          <td>${formatCurrency(item.value)}</td>
          <td>${formatCurrency(item.value)}</td>
        </tr>
      `;
    });
  }

  if (parts.length > 0) {
    rowsHtml += `
      <tr class="category-row">
        <td colspan="5"><span class="category-title">Repuestos</span></td>
      </tr>
    `;
    parts.forEach(item => {
      rowsHtml += `
        <tr class="item-row">
          <td>${globalIndex++}</td>
          <td>${item.name}</td>
          <td>1</td>
          <td>${formatCurrency(item.value)}</td>
          <td>${formatCurrency(item.value)}</td>
        </tr>
      `;
    });
  }

  // Preparar fragmentos HTML condicionales de totales
  let discountHtml = '';
  if (discPercent > 0) {
    discountHtml = `
      <div class="total-sub-row">
        <span class="total-sub-label">Descuento (${discPercent}%):</span>
        <span class="total-sub-val">- ${formatCurrency(discountVal)}</span>
      </div>
    `;
  }

  let netHtml = '';
  if (!vatInclusive) {
    netHtml = `
      <div class="total-sub-row">
        <span class="total-sub-label">Neto:</span>
        <span class="total-sub-val">${formatCurrency(net)}</span>
      </div>
      <div class="total-sub-row">
        <span class="total-sub-label">IVA (19%):</span>
        <span class="total-sub-val">${formatCurrency(Math.round(net * 0.19))}</span>
      </div>
    `;
  }

  // Crear contenedor temporal oculto
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px';
  container.style.height = '1px';
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';

  container.innerHTML = `
    <div class="pdf-container" style="--color-accent: ${localStorage.getItem('taller_accent_color') || '#ff6b00'}; padding: 10px 15px; background: #ffffff;">
      <style>
        .pdf-container { font-family: 'Inter', sans-serif !important; color: #1e293b !important; margin: 0 !important; padding: 10px 15px !important; font-size: 10px !important; line-height: 1.3 !important; background-color: #ffffff !important; }
        .pdf-container table { background-color: #ffffff !important; color: #1e293b !important; }
        .pdf-container td { background-color: #ffffff !important; color: #1e293b !important; border-color: #f1f5f9 !important; }
        .header-table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 6px !important; }
        .header-table td { background-color: transparent !important; }
        .header-title { text-align: center !important; font-size: 13px !important; font-weight: 800 !important; color: #475569 !important; text-transform: uppercase !important; margin: 0 !important; }
        .header-date { text-align: right !important; font-size: 10px !important; color: #64748b !important; font-weight: 500 !important; }
        .workshop-card { border: 1px solid #e2e8f0 !important; border-left: 4px solid var(--color-accent) !important; border-radius: 6px !important; padding: 8px 14px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 10px !important; background-color: #ffffff !important; }
        .workshop-logo-area { display: flex !important; align-items: center !important; gap: 10px !important; }
        .workshop-logo-area img { height: 38px !important; width: auto !important; max-width: 160px !important; object-fit: contain !important; }
        .workshop-logo-area .brand-name { font-size: 15px !important; font-weight: 800 !important; color: var(--color-accent) !important; }
        .workshop-info-area { text-align: right !important; }
        .workshop-name { font-size: 13px !important; font-weight: 800 !important; text-transform: uppercase !important; color: #1e293b !important; }
        .workshop-detail { font-size: 9px !important; color: #64748b !important; }
        .info-section { display: flex !important; gap: 10px !important; margin-bottom: 10px !important; }
        .info-block { flex: 1 !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; overflow: hidden !important; background-color: #ffffff !important; }
        .info-block-header { background-color: #fff7ed !important; color: var(--color-accent) !important; font-size: 9px !important; font-weight: 800 !important; padding: 5px 8px !important; border-bottom: 1px solid #e2e8f0 !important; }
        .info-table { width: 100% !important; border-collapse: collapse !important; }
        .info-table td { padding: 4px 8px !important; font-size: 9px !important; border-bottom: 1px solid #f1f5f9 !important; background-color: #ffffff !important; color: #1e293b !important; }
        .info-label { color: #64748b !important; font-weight: 600 !important; width: 35% !important; }
        .plate-pill { border: 1px solid var(--color-accent) !important; background-color: #fff7ed !important; padding: 1px 6px !important; border-radius: 4px !important; font-weight: 700 !important; color: var(--color-accent) !important; font-size: 9px !important; display: inline-block !important; }
        .items-table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 10px !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; overflow: hidden !important; background-color: #ffffff !important; }
        .items-table th { background-color: var(--color-accent) !important; color: #ffffff !important; font-size: 9px !important; padding: 6px 8px !important; text-align: left !important; border: none !important; }
        .items-table th:nth-child(3), .items-table th:nth-child(4), .items-table th:nth-child(5) { text-align: right !important; }
        .category-row td { background-color: #fff7ed !important; padding: 5px 8px !important; font-size: 9px !important; font-weight: 700 !important; color: var(--color-accent) !important; border-bottom: 1px solid #e2e8f0 !important; }
        .item-row td { padding: 5px 8px !important; font-size: 9px !important; color: #334155 !important; border-bottom: 1px solid #f1f5f9 !important; background-color: #ffffff !important; }
        .item-row td:nth-child(3), .item-row td:nth-child(4), .item-row td:nth-child(5) { text-align: right !important; }
        .totals-wrapper { display: flex !important; justify-content: flex-end !important; margin-bottom: 15px !important; }
        .totals-box { width: 240px !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; overflow: hidden !important; background-color: #ffffff !important; }
        .total-sub-row { display: flex !important; justify-content: space-between !important; padding: 5px 10px !important; font-size: 9px !important; background-color: #f8fafc !important; }
        .total-main-row { display: flex !important; justify-content: space-between !important; padding: 6px 10px !important; font-size: 10px !important; font-weight: 700 !important; color: #ffffff !important; background-color: var(--color-accent) !important; }
      </style>
      <table class="header-table">
        <tr>
          <td style="width: 25%;"></td>
          <td style="width: 50%;"><h1 class="header-title">Presupuesto NÂ° ${budgetNum}</h1></td>
          <td style="width: 25%;" class="header-date">Fecha: ${formattedDate}</td>
        </tr>
      </table>
      
      <div class="workshop-card">
        <div class="workshop-logo-area">
          ${logoWide ? `
            <img src="${logoWide}" style="height: 38px; width: auto; max-width: 160px; object-fit: contain;">
          ` : (logoSquare ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${logoSquare}" style="height: 32px; width: 32px; object-fit: contain;">
              <div class="brand-name" style="font-size: 15px; font-weight: 800; color: var(--color-accent); font-family: 'Inter', sans-serif; text-transform: uppercase;">${workshopConfig.name || 'Appli-Car'}</div>
            </div>
          ` : `
            <div style="display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; font-weight: 800; font-size: 16px; color: #1e293b;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, var(--color-accent) 0%, #2a2a2a 100%); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: white;">${(workshopConfig.name || 'Appli-Car').charAt(0).toUpperCase()}</div>
              <span style="letter-spacing: -0.5px; background: linear-gradient(to right, #1e293b 60%, #475569 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${workshopConfig.name || 'appli-car'}</span>
            </div>
          `)}
        </div>
        <div class="workshop-info-area">
          <div class="workshop-name">${workshopConfig.name || 'â€”'}</div>
          <div class="workshop-detail">Tel: ${workshopConfig.phone1 || 'â€”'}${workshopConfig.phone2 ? ' / ' + workshopConfig.phone2 : ''}</div>
          <div class="workshop-detail">${workshopConfig.address || 'â€”'}</div>
          <div class="workshop-detail">RUT: ${workshopConfig.rut || 'â€”'}</div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <div class="info-block-header">CLIENTE</div>
          <table class="info-table">
            <tr><td class="info-label">Nombre</td><td>${vehicle.client || 'â€”'}</td></tr>
            <tr><td class="info-label">TelÃ©fono</td><td>${vehicle.clientPhone || 'â€”'}</td></tr>
            <tr><td class="info-label">Email</td><td>${vehicle.clientEmail || 'â€”'}</td></tr>
          </table>
        </div>
        <div class="info-block">
          <div class="info-block-header">VEHÃ CULO</div>
          <table class="info-table">
            <tr><td class="info-label">Marca / Modelo</td><td>${vehicle.brand || 'â€”'} ${vehicle.model || 'â€”'}</td></tr>
            <tr><td class="info-label">AÃ±o / Color</td><td>${vehicle.year || 'â€”'} / ${vehicle.color || 'â€”'}</td></tr>
            <tr><td class="info-label">Motor</td><td>${vehicle.motor || 'â€”'}</td></tr>
            <tr><td class="info-label">Patente</td><td><span class="plate-pill">${vehicle.plate || 'â€”'}</span></td></tr>
          </table>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%;">NÂ°</th>
            <th style="width: 52%;">DescripciÃ³n</th>
            <th style="width: 10%;">Cant.</th>
            <th style="width: 15%;">Precio Unit.</th>
            <th style="width: 15%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="totals-wrapper">
        <div class="totals-box">
          <div class="total-sub-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          ${discountHtml}
          ${netHtml}
          <div class="total-main-row">
            <span>Total (IVA Incluido):</span>
            <span>${formatCurrency(Math.round(total))}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8;">
        <span>Presupuesto generado con Gestión de Taller ${workshopConfig.name || 'Appli-Car'}</span>
        <span>Página 1 de 1</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const opt = {
    margin:       [8, 10, 8, 10],
    filename:     `Presupuesto_${budgetNum}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 }
  };

  const targetElement = container.querySelector('.pdf-container');
  const worker = html2pdf().set(opt).from(targetElement);
  if (returnBlob) {
    return worker.outputPdf('blob').then(blob => {
      container.remove();
      return blob;
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      container.remove();
      throw err;
    });
  } else {
    worker.save().then(() => {
      container.remove();
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      container.remove();
    });
  }
};

// ============================================================
// REGISTRO DE MARCAS, MODELOS Y MOTORES EN CONFIGURACIÃ“N
// ============================================================

window.renderVehicleRegistryPanel = function() {
  const searchEl = document.getElementById('registry-search-input');
  const searchVal = searchEl ? searchEl.value.toLowerCase().trim() : '';

  const brandsList = document.getElementById('registry-brands-list');
  const modelsList = document.getElementById('registry-models-list');
  const enginesList = document.getElementById('registry-engines-list');

  if (!brandsList || !modelsList || !enginesList) return;

  // Filter registry items by search query
  const filteredBrands = vehicleRegistry.brands.filter(b => b.toLowerCase().includes(searchVal));
  const filteredModels = vehicleRegistry.models.filter(m => {
    const mName = typeof m === 'object' ? m.name : m;
    const mBrand = typeof m === 'object' ? (m.brand || '') : '';
    return mName.toLowerCase().includes(searchVal) || mBrand.toLowerCase().includes(searchVal);
  });
  const filteredEngines = vehicleRegistry.engines.filter(e => {
    const eName = typeof e === 'object' ? e.name : e;
    const eModel = typeof e === 'object' ? (e.model || '') : '';
    const eBrand = typeof e === 'object' ? (e.brand || '') : '';
    return eName.toLowerCase().includes(searchVal) || eModel.toLowerCase().includes(searchVal) || eBrand.toLowerCase().includes(searchVal);
  });

  const createItemHtml = (type, val) => {
    const text = typeof val === 'object' ? val.name : val;
    let extra = '';
    if (typeof val === 'object') {
      if (type === 'models' && val.brand) {
        extra = `<span style="font-size:10px; color:var(--text-muted); margin-left: 4px;">(${val.brand})</span>`;
      } else if (type === 'engines' && val.model) {
        extra = `<span style="font-size:10px; color:var(--text-muted); margin-left: 4px;">(${val.model}${val.brand ? ' - ' + val.brand : ''})</span>`;
      }
    }
    const valEscaped = (typeof val === 'object' ? val.name : val).replace(/'/g, "\\'");
    return `
    <div class="registry-item" style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      margin-bottom: 4px;
      background-color: var(--card-bg-hover);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 12px;
      color: var(--text-primary);
      transition: all var(--transition-fast);
      gap: 8px;
    " onmouseover="this.style.borderColor='var(--text-secondary)';" onmouseout="this.style.borderColor='var(--border-color)';">
      <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 20px);" title="${text}">${text}${extra}</span>
      <button onclick="deleteRegistryItem('${type}', '${valEscaped}')" style="
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color var(--transition-fast);
      " onmouseover="this.style.color='#ef4444';" onmouseout="this.style.color='var(--text-muted)';">
        <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
      </button>
    </div>`;
  };

  brandsList.innerHTML = filteredBrands.length > 0 
    ? filteredBrands.map(b => createItemHtml('brands', b)).join('')
    : '<span style="font-size:11px; color:var(--text-muted); font-style:italic; padding: 4px 0; display:block;">Sin marcas</span>';

  modelsList.innerHTML = filteredModels.length > 0 
    ? filteredModels.map(m => createItemHtml('models', m)).join('')
    : '<span style="font-size:11px; color:var(--text-muted); font-style:italic; padding: 4px 0; display:block;">Sin modelos</span>';

  enginesList.innerHTML = filteredEngines.length > 0 
    ? filteredEngines.map(e => createItemHtml('engines', e)).join('')
    : '<span style="font-size:11px; color:var(--text-muted); font-style:italic; padding: 4px 0; display:block;">Sin motores</span>';

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.deleteRegistryItem = function(type, val) {
  if (confirm(`¿Estás seguro de que deseas eliminar "${val}" del registro de ${type === 'brands' ? 'marcas' : type === 'models' ? 'modelos' : 'motores'}?`)) {
    vehicleRegistry[type] = vehicleRegistry[type].filter(item => {
      if (typeof item === 'object') {
        return item.name !== val;
      }
      return item !== val;
    });
    saveVehicleRegistry();
    populateAutocompleteDatalists();
    renderVehicleRegistryPanel();
  }
};

// --- 18. RELOJ Y FECHA REALTIME MINIMALISTA ---
function startRealtimeClock() {
  const clockEl = document.getElementById('header-realtime-clock');
  const dateEl = document.getElementById('header-realtime-date');
  if (!clockEl || !dateEl) return;

  function update() {
    const now = new Date();
    
    // Formato de hora: hh:mm:ss
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}:${secs}`;
    
    // Formato de fecha: Lunes, 29 de Mayo de 2026
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let dateStr = now.toLocaleDateString('es-ES', options);
    
    // Asegurarse de capitalizar el día de la semana
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    dateEl.textContent = dateStr;
  }
  
  update();
  setInterval(update, 1000);
}

// Iniciar inmediatamente
startRealtimeClock();

// --- 19. EXPANDIR / COLAPSAR MENU LATERAL ---
window.toggleSidebarCollapse = function() {
  const sidebar = document.getElementById('main-sidebar');
  if (!sidebar) return;
  
  sidebar.classList.toggle('collapsed');
  
  // Persistir estado en localStorage para conveniencia del usuario
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem('sidebar_collapsed', isCollapsed);
  
  // Sincronizar logotipos inmediatamente al cambiar el estado del menú lateral
  if (typeof initLogos === 'function') initLogos();
};

// Cargar estado inicial del sidebar
(function initSidebarState() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar && localStorage.getItem('sidebar_collapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }
})();

// --- INTEGRACIÓN DE BÚSQUEDA EN MERCADO LIBRE ---
window.searchInMercadoLibreFromInline = function() {
  const partNameInput = document.getElementById('inline-item-name');
  if (!partNameInput) return;
  const partName = partNameInput.value.trim();
  
  const row = partNameInput.closest('.inline-edit-item');
  if (row) {
    row.dataset.searchingMeli = 'true';
  }
  
  if (!partName) {
    alert('Por favor, escribe el nombre del repuesto antes de buscar.');
    partNameInput.focus();
    return;
  }

  // Obtener datos del vehículo activo
  let brand = '';
  let model = '';
  let year = '';
  
  if (typeof activeReceptionVehicleId !== 'undefined' && activeReceptionVehicleId) {
    const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
    if (vehicle) {
      brand = vehicle.brand || '';
      model = vehicle.model || '';
      year = vehicle.year || '';
    }
  }

  // Generar consulta de búsqueda: Nombre repuesto + marca + auto + año
  const searchQuery = [partName, brand, model, year].filter(Boolean).join(' ');
  
  // Abrir búsqueda de Mercado Libre en una nueva pestaña (para integrarse con el nuevo sistema de extensión)
  window.open(`https://listado.mercadolibre.com.ar/${encodeURIComponent(searchQuery)}`, '_blank');
};

window.openMeliSearchModal = function(initialQuery = '') {
  const modal = document.getElementById('meli-search-modal');
  const input = document.getElementById('meli-query-input');
  const tokenInput = document.getElementById('meli-token-input');
  
  if (modal && input) {
    input.value = initialQuery;
    
    // Cargar token guardado en el input para comodidad del usuario
    if (tokenInput) {
      tokenInput.value = localStorage.getItem('meli_access_token') || '';
    }

    modal.style.display = 'flex';
    // Forzar reflow para animación
    modal.offsetHeight;
    modal.classList.add('open');
    
    performMeliSearch();
  }
};

window.closeMeliSearchModal = function() {
  const modal = document.getElementById('meli-search-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      if (!modal.classList.contains('open')) {
        modal.style.display = 'none';
      }
    }, 300);
  }
};

window.saveMeliToken = function() {
  const tokenInput = document.getElementById('meli-token-input');
  if (tokenInput) {
    const token = tokenInput.value.trim();
    if (token) {
      localStorage.setItem('meli_access_token', token);
      alert('¡Access Token guardado con éxito! Se utilizará para consultar la API en tiempo real.');
      performMeliSearch();
    } else {
      localStorage.removeItem('meli_access_token');
      alert('Token eliminado. El buscador operará ahora en modo simulación de alta fidelidad.');
      performMeliSearch();
    }
  }
};

window.performMeliSearch = function() {
  const queryInput = document.getElementById('meli-query-input');
  if (!queryInput) return;
  const query = queryInput.value.trim();
  
  if (!query) {
    alert('Por favor, ingresa un texto para buscar.');
    queryInput.focus();
    return;
  }

  const resultsList = document.getElementById('meli-results-list');
  const loadingDiv = document.getElementById('meli-loading');
  const noResultsDiv = document.getElementById('meli-no-results');
  const errorStateDiv = document.getElementById('meli-error-state');

  if (!resultsList || !loadingDiv || !noResultsDiv || !errorStateDiv) return;

  resultsList.innerHTML = '';
  noResultsDiv.style.display = 'none';
  errorStateDiv.style.display = 'none';
  loadingDiv.style.display = 'flex';

  const token = localStorage.getItem('meli_access_token');

  // Si no hay token guardado, ir directamente a simulación local premium para evitar el error de la API
  if (!token) {
    console.log('No token found in localStorage, falling back to mock results');
    setTimeout(() => {
      renderMeliMockResults(query);
    }, 500);
    return;
  }

  // Consultar a través de nuestro proxy local para evitar problemas de CORS del navegador, enviando el token de usuario
  const url = `/api/meli-search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(token)}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al buscar en Mercado Libre (CORS Proxy HTTP ' + response.status + ')');
      }
      return response.json();
    })
    .then(data => {
      loadingDiv.style.display = 'none';
      
      const items = data.results || [];
      if (items.length === 0) {
        noResultsDiv.style.display = 'flex';
        return;
      }

      renderMeliResultsList(items, false);
    })
    .catch(error => {
      loadingDiv.style.display = 'none';
      resultsList.innerHTML = '';
      
      // Limpiar token corrupto o inválido del almacenamiento local para que no bloquee búsquedas futuras
      localStorage.removeItem('meli_access_token');
      
      // Fallback a simulación local premium si falla el servidor local (ej. si abren index.html directamente sin el backend)
      console.warn('Proxy search failed, falling back to mock results:', error);
      setTimeout(() => {
        renderMeliMockResults(query);
      }, 500);
    });
};

window.renderMeliMockResults = function(query) {
  const resultsList = document.getElementById('meli-results-list');
  const loadingDiv = document.getElementById('meli-loading');
  if (!resultsList || !loadingDiv) return;

  loadingDiv.style.display = 'none';

  // Marcas realistas de repuestos automotrices
  const brands = ['Bosch', 'Raybestos', 'Cobreq', 'Fras-le', 'Magneti Marelli', 'ZF Sachs', 'SKF', 'Monroe', 'Fram', 'Valeo'];
  const mockPrices = [18400, 22900, 16200, 29500, 34100, 42800, 12500, 21300, 19700, 31200];
  
  // Fotos premium de repuestos y mecánica
  const mockImages = [
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=250'
  ];

  let items = [];
  for (let i = 0; i < 10; i++) {
    const brandName = brands[i % brands.length];
    const price = mockPrices[i % mockPrices.length] + Math.floor(Math.random() * 2500);
    const title = `${query} ${brandName} Premium`;
    const image = mockImages[i % mockImages.length];
    const permalink = `https://listado.mercadolibre.com.ar/${encodeURIComponent(title)}`;

    items.push({
      title: title,
      price: price,
      thumbnail: image,
      permalink: permalink
    });
  }

  renderMeliResultsList(items, true);
};

window.renderMeliResultsList = function(items, isMock = false) {
  const resultsList = document.getElementById('meli-results-list');
  if (!resultsList) return;

  resultsList.innerHTML = items.map(item => {
    let imageUrl = item.thumbnail || '';
    if (imageUrl.startsWith('http:')) {
      imageUrl = imageUrl.replace('http:', 'https:');
    }
    
    // Optimizar calidad si es URL de Mercado Libre
    if (!imageUrl.includes('unsplash.com')) {
      imageUrl = imageUrl.replace('-I.jpg', '-O.jpg');
    }

    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(item.price);

    const safeTitle = item.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');

    return `
      <div class="meli-product-card" style="background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; justify-content: space-between; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)';">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background-color: white; border-radius: var(--radius-sm); overflow: hidden; padding: 4px;">
            <img src="${imageUrl}" alt="${safeTitle}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </div>
          <span style="font-size: 10px; font-weight: 700; color: #3483fa; background-color: rgba(52,131,250,0.08); padding: 2px 6px; border-radius: 4px; align-self: flex-start;">
            ${isMock ? 'Simulación offline' : 'Mercado Libre'}
          </span>
          <h4 style="font-size: 12px; font-weight: 600; line-height: 1.4; color: var(--text-primary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 35px;" title="${safeTitle}">${item.title}</h4>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          <span style="font-size: 15px; font-weight: 800; color: var(--text-primary);">${formattedPrice}</span>
          <div style="display: flex; gap: 6px; width: 100%;">
            <button type="button" onclick="applyMeliPriceToInline(${item.price}, '${safeTitle}')" style="flex: 1; background-color: #00a650; color: white; border: none; border-radius: 4px; padding: 6px 0; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.15s;" onmouseover="this.style.backgroundColor='#008f43'" onmouseout="this.style.backgroundColor='#00a650'">
              <i data-lucide="check" style="width: 12px; height: 12px;"></i> Usar
            </button>
            <button type="button" onclick="window.open('${item.permalink}', '_blank')" style="flex: 1; background-color: var(--card-bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 6px 0; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.15s;" onmouseover="this.style.backgroundColor='var(--border-color)'" onmouseout="this.style.backgroundColor='var(--card-bg-hover)'">
              <i data-lucide="external-link" style="width: 12px; height: 12px;"></i> Ver
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  initLucide();
};

window.openSearchDirectlyInMeliWeb = function() {
  const queryInput = document.getElementById('meli-query-input');
  if (!queryInput) return;
  const query = queryInput.value.trim();
  if (query) {
    window.open(`https://listado.mercadolibre.com.ar/${encodeURIComponent(query)}`, '_blank');
  }
};

window.applyMeliPriceToInline = function(price, title) {
  const nameInput = document.getElementById('inline-item-name');
  const valueInput = document.getElementById('inline-item-value');
  
  if (nameInput) {
    nameInput.value = title;
  }
  if (valueInput) {
    valueInput.value = Math.round(price);
  }
  
  closeMeliSearchModal();
  alert('Se aplicó el precio y nombre del repuesto desde Mercado Libre.');
};

// ============================================================================
//   INTEGRACIÓN CON LA EXTENSIÓN CHROME DE MERCADO LIBRE
// ============================================================================

// Componente visual de notificación (Toast Premium)
window.showPremiumToast = function(partData, addedToQuote = false, vehicleName = '') {
  // Asegurar que exista un contenedor para los toasts
  let container = document.getElementById('autotech-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'autotech-toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 99999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Crear el elemento del toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    width: 330px;
    background: rgba(24, 24, 27, 0.95);
    border: 1.5px solid ${addedToQuote ? '#10b981' : 'var(--color-accent)'};
    border-radius: 12px;
    padding: 14px;
    display: flex;
    gap: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    transform: translateY(40px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
    font-family: 'Inter', -apple-system, sans-serif;
    box-sizing: border-box;
  `;

  // Imagen con fallback
  const imgUrl = partData.image || 'logo2.png';
  
  // Formatear precio a ARS
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(partData.price);

  const titleHtml = `<h4 style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Inter', sans-serif;" title="${partData.title}">${partData.title}</h4>`;
  const priceHtml = `<span style="font-size: 14px; font-weight: 800; color: var(--color-accent); margin-top: 4px; display: block; font-family: 'Outfit', sans-serif;">${formattedPrice}</span>`;
  
  let badgeText = '';
  let badgeColor = '';
  if (addedToQuote) {
    badgeText = `Añadido a cotización: ${vehicleName}`;
    badgeColor = '#34d399';
  } else {
    badgeText = 'Añadido al catálogo general';
    badgeColor = 'var(--color-accent)';
  }

  const badgeHtml = `<span style="font-size: 9.5px; font-weight: 700; background-color: rgba(${addedToQuote ? '16, 185, 129' : '241, 132, 22'}, 0.12); color: ${badgeColor}; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px; display: inline-block; margin-bottom: 6px; font-family: 'Inter', sans-serif;">${badgeText}</span>`;

  toast.innerHTML = `
    <div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: white; border: 1px solid #3f3f46; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 2px; box-sizing: border-box;">
      <img src="${imgUrl}" onerror="this.src='logo2.png'" style="max-width: 100%; max-height: 100%; object-fit: contain;">
    </div>
    <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center;">
      ${badgeHtml}
      ${titleHtml}
      ${priceHtml}
    </div>
    <button style="align-self: flex-start; color: #a1a1aa; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#a1a1aa'" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Forzar reflow para animación
  toast.offsetHeight;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  // Sutil vibración si el hardware lo soporta
  try {
    if ('vibrate' in navigator) navigator.vibrate(80);
  } catch (e) {}

  // Auto-eliminación tras 5 segundos
  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 5000);
};

// Componente visual de advertencia (Warning Toast)
window.showWarningToast = function(partData) {
  let container = document.getElementById('autotech-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'autotech-toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 99999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    width: 330px;
    background: rgba(24, 24, 27, 0.95);
    border: 1.5px solid #ef4444; /* color rojo de advertencia */
    border-radius: 12px;
    padding: 14px;
    display: flex;
    gap: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    transform: translateY(40px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
    font-family: 'Inter', -apple-system, sans-serif;
    box-sizing: border-box;
  `;

  const imgUrl = partData.image || 'logo2.png';
  const titleHtml = `<h4 style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Inter', sans-serif;" title="${partData.title}">${partData.title}</h4>`;
  const badgeHtml = `<span style="font-size: 9.5px; font-weight: 700; background-color: rgba(239, 68, 68, 0.12); color: #f87171; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px; display: inline-block; margin-bottom: 6px; font-family: 'Inter', sans-serif;">No Agregado</span>`;
  const messageHtml = `<span style="font-size: 11.5px; color: #a1a1aa; margin-top: 4px; display: block; line-height: 1.4; font-family: 'Inter', sans-serif;">Abre la pestaña de <b>"Cotización"</b> de un vehículo para poder añadir este repuesto.</span>`;

  toast.innerHTML = `
    <div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: white; border: 1px solid #3f3f46; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 2px; box-sizing: border-box;">
      <img src="${imgUrl}" onerror="this.src='logo2.png'" style="max-width: 100%; max-height: 100%; object-fit: contain;">
    </div>
    <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center;">
      ${badgeHtml}
      ${titleHtml}
      ${messageHtml}
    </div>
    <button style="align-self: flex-start; color: #a1a1aa; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#a1a1aa'" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  toast.offsetHeight;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  try {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]); // Vibración de advertencia
  } catch (e) {}

  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 6000);
};

// Controlador receptor del repuesto
window.handleAddPartFromExtension = function(partData) {
  console.log('Procesando repuesto de la extensión:', partData);
  
  if (!partData || !partData.title) return;

  const title = partData.title.trim();
  const price = Math.round(partData.price) || 0;
  
  // Comprobar si la pestaña "Cotización" está abierta y activa en el modal detallado visible
  const overlay = document.getElementById('reception-panel-view');
  const isQuoteTabOpen = typeof activeReceptionVehicleId !== 'undefined' && 
                         activeReceptionVehicleId && 
                         overlay && 
                         overlay.classList.contains('open') && 
                         document.getElementById('tab-quote-btn') && 
                         document.getElementById('tab-quote-btn').classList.contains('active');

  if (isQuoteTabOpen) {
    const vehicle = vehicles.find(v => v.id === activeReceptionVehicleId);
    if (vehicle) {
      // 1. Formatear y verificar en el catálogo general con compatibilidades
      const formattedPartName = ensurePartExistsInCatalog(title, price, vehicle);
      
      // 2. Agregar a la lista activa de cotización
      activeQuoteParts.push({ name: formattedPartName, value: price });
      
      // 3. Persistir en la base de datos de vehículos
      vehicle.quoteParts = [...activeQuoteParts];
      saveState();
      
      // 4. Actualizar interfaz y cálculos
      renderQuoteTab();
      updateCalculatedTotals();
      
      // 5. Notificación flotante premium de éxito
      const vehicleName = `${vehicle.brand} ${vehicle.model}`;
      showPremiumToast(partData, true, vehicleName);
      return;
    }
  }

  // Si no está abierta la pestaña de Cotización, rechazar la adición y mostrar advertencia
  showWarningToast(partData);
};

// Escuchador global de postMessage desde el script de contenido de la extensión
window.addEventListener('message', (event) => {
  // Validar el tipo de mensaje esperado
  if (event.data && event.data.type === 'ADD_PART_FROM_EXTENSION') {
    window.handleAddPartFromExtension(event.data.data);
  }
});

// ========================================================================
//    INTEGRACIÓN OFICIAL DE WHATSAPP (METODOS WEB Y META API)
// ========================================================================

function formatArgentinianPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  
  // Si ya empieza con 549 y tiene 13 dígitos, está perfecto
  if (clean.startsWith('549') && clean.length === 13) {
    return clean;
  }
  
  // Quitar el 54 inicial temporalmente para analizar el número local
  let isArgentina = false;
  if (clean.startsWith('54')) {
    clean = clean.substring(2);
    isArgentina = true;
  }
  
  // Quitar 0 inicial si lo tiene
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  // Manejar el "15" móvil si la longitud local es de 12 dígitos
  // Ej: 111512345678 (11 = área, 15 = móvil, 12345678 = local)
  if (clean.length === 12) {
    if (clean.substring(2, 4) === '15') {
      clean = clean.substring(0, 2) + clean.substring(4);
    } else if (clean.substring(3, 5) === '15') {
      clean = clean.substring(0, 3) + clean.substring(5);
    } else if (clean.substring(4, 6) === '15') {
      clean = clean.substring(0, 4) + clean.substring(6);
    }
  }
  
  // Si tiene 10 dígitos (ej: 1162012345), es el formato celular nacional
  // Le agregamos el 9 de móvil y el 54 de país
  if (clean.length === 10) {
    return '549' + clean;
  }
  
  // Si tiene 11 dígitos y empieza con 9, ya tiene el 9 de móvil
  if (clean.length === 11 && clean.startsWith('9')) {
    return '54' + clean;
  }
  
  // Re-agregar 54 si venía de ahí, o ponerlo por defecto
  if (clean.startsWith('54')) {
    return clean;
  }
  
  return '54' + clean;
}

function showToastNotification(text, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = text;
  
  let bg = 'var(--color-accent)';
  if (type === 'error') bg = '#ef4444';
  else if (type === 'success') bg = '#22c55e';
  else if (type === 'progress') bg = '#3b82f6';
  
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${bg}; color: white; font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    animation: slide-up 0.2s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  return toast;
}

window.sendDocumentViaWhatsApp = function(phone, filename, pdfBlob) {
  return new Promise((resolve, reject) => {
    if (typeof loadWorkshopConfig === 'function') {
      loadWorkshopConfig();
    }
    
    const clientPhone = formatArgentinianPhoneForWhatsApp(phone);
    if (!clientPhone) {
      alert('El número de teléfono del cliente no es válido.');
      reject(new Error('Número de teléfono inválido'));
      return;
    }
    
    const isMeta = workshopConfig.waMethod === 'meta_api';
    
    // Si es enlace directo (wa_link) pero no viene pdfBlob (fallback), abrimos el chat sin archivo
    if (!isMeta && !pdfBlob) {
      const docType = filename.includes('Presupuesto') ? 'el presupuesto' : (filename.includes('Certificado') ? 'el certificado de entrega' : 'la factura');
      const text = encodeURIComponent(`Hola! Le envío ${docType} de su vehículo. Saludos.`);
      const url = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${text}`;
      window.open(url, 'whatsapp_web_tab');
      resolve({ success: true, method: 'wa_link' });
      return;
    }
    
    // Para Meta API, necesitamos token y phoneId
    if (isMeta && (!workshopConfig.waToken || !workshopConfig.waPhoneId)) {
      alert('Por favor configure el Token de Acceso y el ID de Teléfono en los Ajustes del taller.');
      reject(new Error('Configuración incompleta'));
      return;
    }
    
    // Mostrar Toast de progreso
    let progressMsg = 'Enviando documento por WhatsApp...';
    if (workshopConfig.waMethod === 'wa_link') {
      progressMsg = 'Subiendo documento a la nube...';
    } else if (workshopConfig.waMethod === 'wa_link_ext') {
      progressMsg = 'Preparando documento para WhatsApp Web...';
    }
    const toast = showToastNotification(progressMsg, 'progress');
    
    // Convertir Blob a Base64
    const reader = new FileReader();
    reader.onloadend = function() {
      // Descargar el archivo localmente en la computadora del usuario como respaldo y confirmación visual
      if (!isMeta) {
        try {
          const downloadLink = document.createElement('a');
          downloadLink.href = URL.createObjectURL(pdfBlob);
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setTimeout(() => URL.revokeObjectURL(downloadLink.href), 1500);
          console.log("sendDocumentViaWhatsApp: PDF descargado localmente con éxito.");
        } catch (e) {
          console.error("Error al descargar PDF de respaldo:", e);
        }
      }
      
      const dataUrl = reader.result;
      const base64Data = dataUrl.split(',')[1];
      
      const docType = filename.includes('Presupuesto') ? 'el presupuesto' : (filename.includes('Certificado') ? 'el certificado de entrega' : 'la factura');
      const messageText = `Hola! Le envío ${docType} de su vehículo.`;
      
      // Preparar payload para la extension
      const payload = {
        token: workshopConfig.waToken,
        phoneId: workshopConfig.waPhoneId,
        clientPhone: clientPhone,
        filename: filename,
        pdfBase64: base64Data,
        msgType: workshopConfig.waMsgType || 'direct',
        templateName: workshopConfig.waTemplateName || '',
        templateLang: workshopConfig.waTemplateLang || 'es',
        method: workshopConfig.waMethod,
        messageText: messageText
      };
      
      // Escuchador de respuesta único
      let timeoutId = null;
      
      const responseListener = function(event) {
        if (event.source !== window || !event.data || event.data.type !== 'WHATSAPP_SEND_RESPONSE') {
          return;
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('message', responseListener);
        toast.remove();
        
        const res = event.data.response;
        if (res && res.success) {
          if (workshopConfig.waMethod === 'wa_link_ext') {
            // WhatsApp Web + Extensión: abrimos el chat directo y la extensión inyectará el PDF
            const docType = filename.includes('Presupuesto') ? 'el presupuesto' : (filename.includes('Certificado') ? 'el certificado de entrega' : 'la factura');
            const text = encodeURIComponent(`Hola! Le envío ${docType} de su vehículo.`);
            const url = `https://web.whatsapp.com/send?phone=${clientPhone}&text=${text}`;
            window.open(url, 'whatsapp_web_tab');
            showToastNotification('✓ Documento preparado y chat abierto', 'success');
            resolve(res);
          } else if (workshopConfig.waMethod === 'wa_link') {
            // Si es Enlace Directo, abrimos WhatsApp Web con el link de Pixeldrain
            const docType = filename.includes('Presupuesto') ? 'el presupuesto' : (filename.includes('Certificado') ? 'el certificado de entrega' : 'la factura');
            const text = encodeURIComponent(`Hola! Le envío ${docType} de su vehículo. Puede descargarlo e imprimirlo desde el siguiente enlace: ${res.downloadUrl}`);
            const url = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${text}`;
            window.open(url, 'whatsapp_web_tab');
            showToastNotification('✓ Archivo subido y chat abierto', 'success');
            resolve(res);
          } else {
            showToastNotification('✓ WhatsApp enviado con éxito', 'success');
            resolve(res);
          }
        } else {
          const errMsg = (res && res.error) ? res.error : 'Error desconocido.';
          
          if (!isMeta) {
            // Fallback en caso de fallo de subida en enlace directo: abrir sin el link
            const docType = filename.includes('Presupuesto') ? 'el presupuesto' : (filename.includes('Certificado') ? 'el certificado de entrega' : 'la factura');
            const text = encodeURIComponent(`Hola! Le envío ${docType} de su vehículo. Saludos.`);
            const url = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${text}`;
            window.open(url, 'whatsapp_web_tab');
            showToastNotification('⚠️ Chat abierto (Fallo al subir archivo)', 'error');
            resolve({ success: true, fallback: true });
          } else {
            alert(`Error al enviar WhatsApp: ${errMsg}`);
            showToastNotification('❌ Error al enviar WhatsApp', 'error');
            reject(new Error(errMsg));
          }
        }
      };
      
      if (!isMeta) {
        timeoutId = setTimeout(() => {
          window.removeEventListener('message', responseListener);
          toast.remove();
          console.warn("sendDocumentViaWhatsApp: Extensión no respondió a tiempo. Ejecutando fallback.");
          
          alert("La extensión de Chrome no respondió. Se procederá a abrir el chat directo sin la auto-carga del PDF.");
          
          const docType = filename.includes('Presupuesto') ? 'el presupuesto' : (filename.includes('Certificado') ? 'el certificado de entrega' : 'la factura');
          const text = encodeURIComponent(`Hola! Le envío ${docType} de su vehículo. Saludos.`);
          const url = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${text}`;
          window.open(url, 'whatsapp_web_tab');
          resolve({ success: true, fallback: true });
        }, 4000);
      }
      
      window.addEventListener('message', responseListener);
      
      // Enviar a la extensión
      window.postMessage({
        type: 'WHATSAPP_SEND_REQUEST',
        payload: payload
      }, '*');
    };
    
    reader.onerror = function(err) {
      toast.remove();
      alert('Error al procesar el archivo PDF.');
      reject(err);
    };
    
    reader.readAsDataURL(pdfBlob);
  });
};

window.sendWhatsAppTestMessage = function() {
  const token = document.getElementById('config-workshop-wa-token').value.trim();
  const phoneId = document.getElementById('config-workshop-wa-phone-id').value.trim();
  const msgType = document.getElementById('config-workshop-wa-msg-type').value;
  const templateName = document.getElementById('config-workshop-wa-template-name').value.trim();
  const templateLang = document.getElementById('config-workshop-wa-template-lang').value.trim();
  
  if (!token || !phoneId) {
    alert('Por favor complete el Token y el ID de Teléfono antes de realizar la prueba.');
    return;
  }
  
  if (msgType === 'template' && !templateName) {
    alert('Por favor complete el Nombre de la Plantilla para la prueba con plantilla.');
    return;
  }
  
  const testPhone = prompt('Ingrese el número de teléfono para enviar el PDF de prueba (ej: 11 6201 2345):');
  if (!testPhone) return;
  
  const clientPhone = formatArgentinianPhoneForWhatsApp(testPhone);
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px';
  container.style.height = '1px';
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  
  container.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; text-align: center;">
      <h1 style="color: #ff6b00;">AutoTech Test</h1>
      <p>Esta es una prueba exitosa de conexión de la API de WhatsApp Cloud.</p>
      <p>Fecha/Hora: ${new Date().toLocaleString()}</p>
    </div>
  `;
  document.body.appendChild(container);
  
  const opt = {
    margin: 10,
    filename: 'Test_AutoTech.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 1.5 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  const toast = showToastNotification('Generando PDF de prueba...', 'progress');
  
  html2pdf().set(opt).from(container).outputPdf('blob').then(pdfBlob => {
    container.remove();
    toast.remove();
    
    const oldToken = workshopConfig.waToken;
    const oldPhoneId = workshopConfig.waPhoneId;
    const oldMsgType = workshopConfig.waMsgType;
    const oldTemplateName = workshopConfig.waTemplateName;
    const oldTemplateLang = workshopConfig.waTemplateLang;
    const oldMethod = workshopConfig.waMethod;
    
    workshopConfig.waToken = token;
    workshopConfig.waPhoneId = phoneId;
    workshopConfig.waMsgType = msgType;
    workshopConfig.waTemplateName = templateName;
    workshopConfig.waTemplateLang = templateLang;
    workshopConfig.waMethod = 'meta_api';
    
    window.sendDocumentViaWhatsApp(clientPhone, 'Test_AutoTech.pdf', pdfBlob)
      .then(res => {
        alert('🎉 ¡Prueba de conexión exitosa! El mensaje ha sido enviado.');
        workshopConfig.waToken = oldToken;
        workshopConfig.waPhoneId = oldPhoneId;
        workshopConfig.waMsgType = oldMsgType;
        workshopConfig.waTemplateName = oldTemplateName;
        workshopConfig.waTemplateLang = oldTemplateLang;
        workshopConfig.waMethod = oldMethod;
      })
      .catch(err => {
        alert(`❌ Falló la prueba: ${err.message}`);
        workshopConfig.waToken = oldToken;
        workshopConfig.waPhoneId = oldPhoneId;
        workshopConfig.waMsgType = oldMsgType;
        workshopConfig.waTemplateName = oldTemplateName;
        workshopConfig.waTemplateLang = oldTemplateLang;
        workshopConfig.waMethod = oldMethod;
      });
  }).catch(err => {
    container.remove();
    toast.remove();
    alert('Error al generar el PDF de prueba.');
  });
};

window.sendQuoteWhatsApp = function() {
  const id = activeReceptionVehicleId;
  if (!id) {
    alert('No hay ningún vehículo activo.');
    return;
  }
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) {
    alert('Vehículo no encontrado.');
    return;
  }
  const phone = vehicle.clientPhone;
  if (!phone) {
    alert('El cliente no tiene número de teléfono registrado.');
    return;
  }
  
  window.downloadQuotePDF(id, true)
    .then(pdfBlob => {
      const isGolMock = vehicle.id === 'mock-vehicle-gol-2026';
      const matchResult = typeof vehicle.id === 'string' ? vehicle.id.match(/\d+/) : null;
      const baseNum = isGolMock ? 5 : (matchResult ? parseInt(matchResult[0]) : (vehicles.indexOf(vehicle) + 1));
      const budgetNum = String(99 + baseNum).padStart(8, '0');
      
      const filename = `Presupuesto_${budgetNum}.pdf`;
      return window.sendDocumentViaWhatsApp(phone, filename, pdfBlob);
    })
    .catch(err => {
      console.error("Error al enviar presupuesto por WhatsApp:", err);
    });
};

window.sendDeliveryWhatsApp = function() {
  const id = activeReceptionVehicleId;
  if (!id) {
    alert('No hay ningún vehículo activo.');
    return;
  }
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) {
    alert('Vehículo no encontrado.');
    return;
  }
  const phone = vehicle.clientPhone;
  if (!phone) {
    alert('El cliente no tiene número de teléfono registrado.');
    return;
  }
  
  window.downloadDeliveryPDF(id, true)
    .then(pdfBlob => {
      const filename = `Certificado_Entrega_${vehicle.plate}.pdf`;
      return window.sendDocumentViaWhatsApp(phone, filename, pdfBlob);
    })
    .catch(err => {
      console.error("Error al enviar certificado por WhatsApp:", err);
    });
};

window.sendTaxInvoiceWhatsApp = function(invoiceType, event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('invoice-dropdown-menu');
  if (menu) menu.style.display = 'none';
  
  const id = activeReceptionVehicleId;
  if (!id) {
    alert('No hay ningún vehículo activo.');
    return;
  }
  const vehicle = vehicles.find(v => String(v.id) === String(id));
  if (!vehicle) {
    alert('Vehículo no encontrado.');
    return;
  }
  const phone = vehicle.clientPhone;
  if (!phone) {
    alert('El cliente no tiene número de teléfono registrado.');
    return;
  }
  
  window.downloadTaxInvoicePDF(invoiceType, null, true)
    .then(pdfBlob => {
      const matchResult = typeof vehicle.id === 'string' ? vehicle.id.match(/\d+/) : null;
      const invoiceSeq = matchResult ? parseInt(matchResult[0]) : (vehicles.indexOf(vehicle) + 1);
      const invoiceNum = String(invoiceSeq).padStart(8, '0');
      
      const filename = `Factura_${invoiceType}_${invoiceNum}.pdf`;
      return window.sendDocumentViaWhatsApp(phone, filename, pdfBlob);
    })
    .catch(err => {
      console.error("Error al enviar factura por WhatsApp:", err);
    });
};

// ========================================================================
//    LÓGICA DE NAVEGACIÓN Y SOPORTE MÓVIL
// ========================================================================

window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('main-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar && overlay) {
    const isOpen = sidebar.classList.contains('mobile-open');
    if (isOpen) {
      sidebar.classList.remove('mobile-open');
      overlay.style.display = 'none';
    } else {
      sidebar.classList.add('mobile-open');
      overlay.style.display = 'block';
    }
  }
};

window.closeMobileSidebarIfOpen = function() {
  const sidebar = document.getElementById('main-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar && overlay && sidebar.classList.contains('mobile-open')) {
    sidebar.classList.remove('mobile-open');
    overlay.style.display = 'none';
  }
};


