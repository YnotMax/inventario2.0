import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { googleSheetService } from '../services/googleSheetService';
import { useAudio } from '../hooks/useAudio';
import initialMateriaisCatalog from '../data/materiaisCatalog.json';

const InventoryContext = createContext(null);

const INITIAL_CATALOG = {
  '7891129224049': 'CRC08CBANA',
  '7891129134959': 'CRC08CBANA',
  '511123224049': 'CRC08CBANA',
  '5501129224049': 'CRC08CBANA',
  'CT05CBB2232768': 'CRT05CBBNA'
};

export const InventoryProvider = ({ children }) => {
  const keys = storageService.getKeys();
  
  // Estado de Modo: 'aparelhos' | 'materiais'
  const [mode, setMode] = useState(() => storageService.load(keys.ACTIVE_MODE, 'aparelhos'));
  
  // Itens contados por modo
  const [itemsAparelhos, setItemsAparelhos] = useState(() => storageService.load(keys.ITEMS_APARELHOS, []));
  const [itemsMateriais, setItemsMateriais] = useState(() => storageService.load(keys.ITEMS_MATERIAIS, []));
  
  // Catálogo EAN / Descrição (Auto-Aprendizado)
  const [lookupDB, setLookupDB] = useState(() => {
    const saved = storageService.load(keys.EAN_LOOKUP, {});
    // Auto-popular com EANs do catálogo de materiais inicial
    const eanMap = {};
    if (Array.isArray(initialMateriaisCatalog)) {
      initialMateriaisCatalog.forEach(mat => {
        if (mat.ean) eanMap[mat.ean.trim()] = mat.nome;
        if (mat.codigo) eanMap[mat.codigo.trim()] = mat.nome;
      });
    }
    return { ...INITIAL_CATALOG, ...eanMap, ...saved };
  });

  // Base do Sistema ERP - Aparelhos
  const [systemStock, setSystemStock] = useState(() => 
    storageService.load(keys.SYSTEM_STOCK, { byPatrimonio: {}, bySerie: {} })
  );

  // Base do Sistema ERP - Catálogo de Materiais (Embarcado 11.900+ itens + Cache)
  const [materiaisCatalog, setMateriaisCatalog] = useState(() => {
    const saved = storageService.load('inventario_2_materiais_catalog', null);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return Array.isArray(initialMateriaisCatalog) ? initialMateriaisCatalog : [];
  });

  // Histórico de bipados (para evitar duplicatas)
  const [scannedHistory, setScannedHistory] = useState(() => 
    storageService.load(keys.HISTORY, { patrimonios: {}, series: {}, materiais: {} })
  );

  // Configurações
  const [config, setConfig] = useState(storageService.loadConfig);
  
  // Feedback e Alertas Ativos
  const [feedback, setFeedback] = useState({ show: false, text: '', type: 'success' });
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingItem, setEditingItem] = useState(null);
  const [screenFlash, setScreenFlash] = useState({ active: false, warning: false });

  // Hook de áudio
  const { playBeep, playWarning } = useAudio(config.soundEnabled);

  // Itens do modo atual
  const currentItems = mode === 'aparelhos' ? itemsAparelhos : itemsMateriais;

  // Efeito para salvar estado localmente
  useEffect(() => {
    storageService.save(keys.ACTIVE_MODE, mode);
  }, [mode, keys]);

  useEffect(() => {
    storageService.save(keys.ITEMS_APARELHOS, itemsAparelhos);
  }, [itemsAparelhos, keys]);

  useEffect(() => {
    storageService.save(keys.ITEMS_MATERIAIS, itemsMateriais);
  }, [itemsMateriais, keys]);

  useEffect(() => {
    storageService.save(keys.EAN_LOOKUP, lookupDB);
  }, [lookupDB, keys]);

  useEffect(() => {
    storageService.save(keys.HISTORY, scannedHistory);
  }, [scannedHistory, keys]);

  useEffect(() => {
    storageService.save(keys.SYSTEM_STOCK, systemStock);
  }, [systemStock, keys]);

  useEffect(() => {
    storageService.save('inventario_2_materiais_catalog', materiaisCatalog);
  }, [materiaisCatalog]);

  useEffect(() => {
    storageService.saveConfig(config);
  }, [config]);

  // Monitorar conexão de internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchLiveSheetData();
      syncPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Buscar dados da planilha na inicialização
  const fetchLiveSheetData = useCallback(async () => {
    if (!config.webhookUrl) return;
    const result = await googleSheetService.fetchSheetData(config.webhookUrl);
    if (!result || result.status !== 'sucesso') return;

    // 1. Processar histórico de contados
    if (Array.isArray(result.data)) {
      setScannedHistory(prev => {
        const next = { ...prev };
        result.data.forEach(it => {
          if (it.patrimonio) next.patrimonios[it.patrimonio.toUpperCase().trim()] = true;
          if (it.serie) next.series[it.serie.toUpperCase().trim()] = true;
        });
        return next;
      });
    }

    // 2. Processar base cadastral ERP - Aparelhos
    if (Array.isArray(result.sistema)) {
      const nextSys = { byPatrimonio: {}, bySerie: {} };
      result.sistema.forEach(sys => {
        if (sys.etiqueta) nextSys.byPatrimonio[sys.etiqueta.toUpperCase().trim()] = sys;
        if (sys.serie) nextSys.bySerie[sys.serie.toUpperCase().trim()] = sys;
      });
      setSystemStock(nextSys);
    }

    // 3. Processar base cadastral ERP - Materiais (SC PALHOÇA)
    if (Array.isArray(result.materiais) && result.materiais.length > 0) {
      setMateriaisCatalog(result.materiais);
      // Auto-popular lookupDB com EANs de materiais
      setLookupDB(prev => {
        const next = { ...prev };
        result.materiais.forEach(mat => {
          if (mat.ean) next[mat.ean.trim()] = mat.nome;
          if (mat.codigo) next[mat.codigo.trim()] = mat.nome;
        });
        return next;
      });
    }
  }, [config.webhookUrl]);

  useEffect(() => {
    fetchLiveSheetData();
  }, [fetchLiveSheetData]);

  // Disparar Flash na tela
  const triggerFlash = (isWarning = false) => {
    setScreenFlash({ active: true, warning: isWarning });
    setTimeout(() => {
      setScreenFlash({ active: false, warning: false });
    }, 350);
  };

  // Mostrar Feedback temporário
  const showFeedbackMessage = (text, type = 'success') => {
    setFeedback({ show: true, text, type });
    if (type === 'success') {
      playBeep();
      triggerFlash(false);
    } else {
      playWarning();
      triggerFlash(true);
    }
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 2500);
  };

  // Aprender modelo/descrição por EAN ou Código
  const learnEan = (code, desc) => {
    if (!code || !desc) return;
    setLookupDB(prev => ({ ...prev, [code.trim()]: desc.trim() }));
  };

  // Vincular explicitamente um EAN a um material selecionado
  const linkEanToMaterial = (ean, materialName) => {
    if (!ean || !materialName) return;
    learnEan(ean, materialName);
    showFeedbackMessage(`🔗 Código ${ean} vinculado a "${materialName}"!`);
  };

  // Adicionar ou Atualizar Item
  const saveItem = async (itemData) => {
    const isEdit = !!editingItem;
    const newItem = {
      id: isEdit ? editingItem.id : Date.now().toString(),
      timestamp: isEdit ? editingItem.timestamp : new Date().toLocaleString('pt-BR'),
      synced: false,
      mode: mode,
      ...itemData
    };

    // Atualizar no histórico
    if (newItem.patrimonio) {
      setScannedHistory(prev => ({
        ...prev,
        patrimonios: { ...prev.patrimonios, [newItem.patrimonio.toUpperCase().trim()]: true }
      }));
    }
    if (newItem.serie) {
      setScannedHistory(prev => ({
        ...prev,
        series: { ...prev.series, [newItem.serie.toUpperCase().trim()]: true }
      }));
    }

    if (mode === 'aparelhos') {
      if (newItem.ean && newItem.modelo) learnEan(newItem.ean, newItem.modelo);
      setItemsAparelhos(prev => {
        if (isEdit) return prev.map(i => i.id === newItem.id ? newItem : i);
        return [newItem, ...prev];
      });
    } else {
      if (newItem.codigo && newItem.descricao) learnEan(newItem.codigo, newItem.descricao);
      setItemsMateriais(prev => {
        if (isEdit) return prev.map(i => i.id === newItem.id ? newItem : i);
        return [newItem, ...prev];
      });
    }

    setEditingItem(null);
    setDuplicateAlert(null);
    showFeedbackMessage(isEdit ? 'Item atualizado!' : 'Item adicionado à lista!');

    // Tentar sincronizar em nuvem
    if (config.webhookUrl && navigator.onLine) {
      try {
        await googleSheetService.syncItem(config.webhookUrl, newItem, isEdit);
        newItem.synced = true;
        if (mode === 'aparelhos') {
          setItemsAparelhos(prev => prev.map(i => i.id === newItem.id ? { ...i, synced: true } : i));
        } else {
          setItemsMateriais(prev => prev.map(i => i.id === newItem.id ? { ...i, synced: true } : i));
        }
      } catch (e) {
        console.warn('Salvo localmente (offline):', e);
      }
    }
  };

  // Sincronizar todos os itens pendentes
  const syncPending = async () => {
    if (!config.webhookUrl || !navigator.onLine) return;
    const allPending = currentItems.filter(i => !i.synced);
    if (allPending.length === 0) return;

    for (const item of allPending) {
      try {
        await googleSheetService.syncItem(config.webhookUrl, item, false);
        if (mode === 'aparelhos') {
          setItemsAparelhos(prev => prev.map(i => i.id === item.id ? { ...i, synced: true } : i));
        } else {
          setItemsMateriais(prev => prev.map(i => i.id === item.id ? { ...i, synced: true } : i));
        }
      } catch (e) {
        break;
      }
    }
  };

  // Remover Item
  const removeItem = (id) => {
    if (mode === 'aparelhos') {
      setItemsAparelhos(prev => prev.filter(i => i.id !== id));
    } else {
      setItemsMateriais(prev => prev.filter(i => i.id !== id));
    }
    if (editingItem && editingItem.id === id) setEditingItem(null);
  };

  // Alterar Quantidade
  const updateQuantity = (id, delta) => {
    const updateFn = prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: nextQty, synced: false };
      }
      return item;
    });

    if (mode === 'aparelhos') setItemsAparelhos(updateFn);
    else setItemsMateriais(updateFn);
  };

  // Limpar lista atual
  const clearCurrentList = () => {
    if (window.confirm(`Tem certeza que deseja apagar os dados do inventário de ${mode === 'aparelhos' ? 'Aparelhos' : 'Materiais'}?`)) {
      if (mode === 'aparelhos') setItemsAparelhos([]);
      else setItemsMateriais([]);
      setEditingItem(null);
    }
  };

  return (
    <InventoryContext.Provider value={{
      mode,
      setMode,
      items: currentItems,
      allAparelhos: itemsAparelhos,
      allMateriais: itemsMateriais,
      lookupDB,
      systemStock,
      materiaisCatalog,
      scannedHistory,
      config,
      setConfig,
      feedback,
      duplicateAlert,
      setDuplicateAlert,
      isOnline,
      editingItem,
      setEditingItem,
      screenFlash,
      saveItem,
      removeItem,
      updateQuantity,
      clearCurrentList,
      syncPending,
      showFeedbackMessage,
      playBeep,
      playWarning,
      fetchLiveSheetData,
      linkEanToMaterial
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
