// Serviço de Persistência Local (localStorage) seguro

const KEYS = {
  ITEMS_APARELHOS: 'inventario_2_aparelhos',
  ITEMS_MATERIAIS: 'inventario_2_materiais',
  HISTORY: 'inventario_2_historico',
  EAN_LOOKUP: 'inventario_2_ean_lookup',
  SYSTEM_STOCK: 'inventario_2_system_stock',
  ACTIVE_MODE: 'inventario_2_mode',
  CONFIG: 'inventario_2_config'
};

const DEFAULT_CONFIG = {
  webhookUrl: 'https://script.google.com/macros/s/AKfycbzmT2-y7yFsZr9U43x_uvf8yth60r2GXE5Itk-s0P73YEnSFbVcC5mCTN5BSKdsJxcnwg/exec',
  soundEnabled: true,
  cooldownMs: 1800
};

export const storageService = {
  getKeys: () => KEYS,

  load: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] Erro ao carregar chave ${key}:`, e);
      return defaultValue;
    }
  },

  save: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[Storage] Erro ao salvar chave ${key}:`, e);
      return false;
    }
  },

  loadConfig: () => {
    return { ...DEFAULT_CONFIG, ...storageService.load(KEYS.CONFIG, {}) };
  },

  saveConfig: (config) => {
    return storageService.save(KEYS.CONFIG, config);
  }
};
