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
  
  // Itens contados por modo (Inicializados do storage local com fallback seguro)
  const [itemsAparelhos, setItemsAparelhos] = useState(() => storageService.load(keys.ITEMS_APARELHOS, []));
  const [itemsMateriais, setItemsMateriais] = useState(() => storageService.load(keys.ITEMS_MATERIAIS, []));
  
  // Catálogo EAN / Descrição (Apenas itens aprendidos salvos localmente)
  const [lookupDB, setLookupDB] = useState(() => {
    const saved = storageService.load(keys.EAN_LOOKUP, {});
    return { ...INITIAL_CATALOG, ...saved };
  });

  // Base do Sistema ERP - Aparelhos
  const [systemStock, setSystemStock] = useState(() => 
    storageService.load(keys.SYSTEM_STOCK, { byPatrimonio: {}, bySerie: {} })
  );

  // Base do Sistema ERP - Catálogo de Materiais (11.921 itens limpos na memória RAM)
  const [materiaisCatalog, setMateriaisCatalog] = useState(() => {
    return Array.isArray(initialMateriaisCatalog) ? initialMateriaisCatalog : [];
  });

  // Histórico de bipados (para evitar duplicatas)
  const [scannedHistory, setScannedHistory] = useState(() => 
    storageService.load(keys.HISTORY, { patrimonios: {}, series: {}, materiais: {} })
  );

  // Configurações
  const [config, setConfig] = useState(storageService.loadConfig);
  
  // Feedback e Alertas
  const [feedback, setFeedback] = useState({ show: false, text: '', type: 'success' });
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingItem, setEditingItem] = useState(null);
  const [screenFlash, setScreenFlash] = useState({ active: false, type: 'success' });

  // Hook de áudio
  const { playBeep, playDoubleBeep, playWarning } = useAudio(config.soundEnabled);

  // Itens do modo atual
  const currentItems = mode === 'aparelhos' ? (itemsAparelhos || []) : (itemsMateriais || []);

  // Salvar no storage local com segurança
  useEffect(() => {
    storageService.save(keys.ACTIVE_MODE, mode);
  }, [mode, keys]);

  useEffect(() => {
    storageService.save(keys.ITEMS_APARELHOS, itemsAparelhos || []);
  }, [itemsAparelhos, keys]);

  useEffect(() => {
    storageService.save(keys.ITEMS_MATERIAIS, itemsMateriais || []);
  }, [itemsMateriais, keys]);

  useEffect(() => {
    storageService.save(keys.EAN_LOOKUP, lookupDB || {});
  }, [lookupDB, keys]);

  useEffect(() => {
    storageService.save(keys.HISTORY, scannedHistory || {});
  }, [scannedHistory, keys]);

  useEffect(() => {
    storageService.save(keys.SYSTEM_STOCK, systemStock || {});
  }, [systemStock, keys]);

  useEffect(() => {
    storageService.saveConfig(config);
  }, [config]);

  // Monitorar conexão
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

  // Buscar dados da planilha na inicialização (SINCRONIZAÇÃO NUVEM ➔ CELULAR)
  const fetchLiveSheetData = useCallback(async () => {
    if (!config.webhookUrl) return;
    try {
      const result = await googleSheetService.fetchSheetData(config.webhookUrl);
      if (!result || result.status !== 'sucesso') return;

      // 1. Processar histórico de contados aparelhos
      if (Array.isArray(result.data)) {
        setScannedHistory(prev => {
          const next = { ...(prev || {}) };
          if (!next.patrimonios) next.patrimonios = {};
          if (!next.series) next.series = {};
          result.data.forEach(it => {
            if (it.patrimonio) next.patrimonios[it.patrimonio.toUpperCase().trim()] = true;
            if (it.serie) next.series[it.serie.toUpperCase().trim()] = true;
          });
          return next;
        });
      }

      // 2. Processar materiais já contados na planilha física
      if (Array.isArray(result.fisicoMateriais) && result.fisicoMateriais.length > 0) {
        setItemsMateriais(prev => {
          const prevItems = prev || [];
          if (prevItems.length === 0) return result.fisicoMateriais;
          
          const mapByCodOrDesc = {};
          result.fisicoMateriais.forEach(item => {
            const key = (item.codigo || item.descricao || '').trim().toLowerCase();
            if (key) mapByCodOrDesc[key] = item;
          });
          prevItems.forEach(item => {
            const key = (item.codigo || item.descricao || '').trim().toLowerCase();
            if (key && !mapByCodOrDesc[key]) {
              mapByCodOrDesc[key] = item;
            }
          });
          return Object.values(mapByCodOrDesc);
        });
      }

      // 3. Processar base cadastral ERP - Aparelhos
      if (Array.isArray(result.sistema)) {
        const nextSys = { byPatrimonio: {}, bySerie: {} };
        result.sistema.forEach(sys => {
          if (sys.etiqueta) nextSys.byPatrimonio[sys.etiqueta.toUpperCase().trim()] = sys;
          if (sys.serie) nextSys.bySerie[sys.serie.toUpperCase().trim()] = sys;
        });
        setSystemStock(nextSys);
      }

      // 4. Processar novidades do ERP - Materiais
      if (Array.isArray(result.materiais) && result.materiais.length > 0) {
        setMateriaisCatalog(result.materiais);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados da planilha:', err);
    }
  }, [config.webhookUrl]);

  useEffect(() => {
    fetchLiveSheetData();
  }, [fetchLiveSheetData]);

  // Flash visual na tela
  const triggerFlash = (type = 'success') => {
    setScreenFlash({ active: true, type });
    setTimeout(() => {
      setScreenFlash({ active: false, type: 'success' });
    }, 350);
  };

  // Feedback toast
  const showFeedbackMessage = (text, type = 'success') => {
    setFeedback({ show: true, text, type });
    if (type === 'success') {
      playBeep();
      triggerFlash('success');
    } else if (type === 'info') {
      playDoubleBeep();
      triggerFlash('info');
    } else {
      playWarning();
      triggerFlash('warning');
    }
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 2500);
  };

  // Consultar estatísticas se um material já foi contado (COMPARAÇÃO INTELIGENTE)
  const getItemCountedStats = useCallback((codigo, descricao) => {
    const codClean = String(codigo || '').trim().toLowerCase();
    const codNoZeros = codClean.replace(/^0+/, '');
    const descClean = String(descricao || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (!codClean && !descClean) {
      return { isCounted: false, totalCounted: 0, countRecords: 0, locations: [], existingItems: [] };
    }

    const currentMats = itemsMateriais || [];
    const matching = currentMats.filter(item => {
      const itemCod = String(item?.codigo || '').trim().toLowerCase();
      const itemCodNoZeros = itemCod.replace(/^0+/, '');
      const itemDesc = String(item?.descricao || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // 1. Match por Código (com e sem zeros à esquerda: ex 001140 == 1140)
      if (codClean && itemCod) {
        if (codClean === itemCod) return true;
        if (codNoZeros && itemCodNoZeros && codNoZeros === itemCodNoZeros) return true;
      }

      // 2. Match por Descrição (exata ou normalizada)
      if (descClean && itemDesc) {
        if (descClean === itemDesc) return true;
        if (descClean.length > 5 && itemDesc.length > 5) {
          if (descClean.includes(itemDesc) || itemDesc.includes(descClean)) return true;
        }
      }

      return false;
    });

    if (matching.length === 0) {
      return { isCounted: false, totalCounted: 0, countRecords: 0, locations: [], existingItems: [] };
    }

    const totalCounted = matching.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
    const locations = Array.from(new Set(matching.map(it => it?.localizacao).filter(Boolean)));

    return {
      isCounted: true,
      totalCounted,
      countRecords: matching.length,
      locations,
      existingItems: matching,
      firstItem: matching[0]
    };
  }, [itemsMateriais]);

  const learnEan = (code, desc) => {
    if (!code || !desc) return;
    setLookupDB(prev => ({ ...(prev || {}), [code.trim()]: desc.trim() }));
  };

  const linkEanToMaterial = (ean, materialName) => {
    if (!ean || !materialName) return;
    learnEan(ean, materialName);
    showFeedbackMessage(`🔗 Código ${ean} vinculado a "${materialName}"!`, 'info');
  };

  // Salvar Item (Suporte a Adicionar, Editar e Somar ao Existente)
  const saveItem = async (itemData, mergeWithExisting = false) => {
    const isEdit = !!editingItem;

    if (mode === 'materiais' && mergeWithExisting && !isEdit) {
      const stats = getItemCountedStats(itemData.codigo, itemData.descricao);
      if (stats.isCounted && stats.firstItem) {
        const targetId = stats.firstItem.id;
        const addQty = Number(itemData.quantity) || 1;
        const newTotal = stats.totalCounted + addQty;

        let updatedItem = null;
        setItemsMateriais(prev => (prev || []).map(it => {
          if (it.id === targetId) {
            updatedItem = {
              ...it,
              quantity: (Number(it.quantity) || 0) + addQty,
              synced: false,
              timestamp: new Date().toLocaleString('pt-BR'),
              localizacao: itemData.localizacao ? `${it.localizacao ? it.localizacao + ' / ' : ''}${itemData.localizacao}` : it.localizacao,
              obs: itemData.obs ? `${it.obs ? it.obs + ' | ' : ''}${itemData.obs}` : it.obs
            };
            return updatedItem;
          }
          return it;
        }));

        setEditingItem(null);
        setDuplicateAlert(null);
        showFeedbackMessage(`➕ Somado! Total acumulado: ${newTotal} ${itemData.unidade || 'UN'}`, 'info');

        if (config.webhookUrl && navigator.onLine && updatedItem) {
          try {
            await googleSheetService.syncItem(config.webhookUrl, updatedItem, true);
            setItemsMateriais(prev => (prev || []).map(i => i.id === updatedItem.id ? { ...i, synced: true } : i));
          } catch (e) {
            console.warn('Sync offline:', e);
          }
        }
        return;
      }
    }

    // Registro normal / novo
    const newItem = {
      id: isEdit ? editingItem.id : Date.now().toString(),
      timestamp: isEdit ? editingItem.timestamp : new Date().toLocaleString('pt-BR'),
      synced: false,
      mode: mode,
      ...itemData
    };

    if (newItem.patrimonio) {
      setScannedHistory(prev => ({
        ...(prev || {}),
        patrimonios: { ...((prev && prev.patrimonios) || {}), [newItem.patrimonio.toUpperCase().trim()]: true }
      }));
    }
    if (newItem.serie) {
      setScannedHistory(prev => ({
        ...(prev || {}),
        series: { ...((prev && prev.series) || {}), [newItem.serie.toUpperCase().trim()]: true }
      }));
    }

    if (mode === 'aparelhos') {
      if (newItem.ean && newItem.modelo) learnEan(newItem.ean, newItem.modelo);
      setItemsAparelhos(prev => {
        const list = prev || [];
        if (isEdit) return list.map(i => i.id === newItem.id ? newItem : i);
        return [newItem, ...list];
      });
    } else {
      if (newItem.codigo && newItem.descricao) learnEan(newItem.codigo, newItem.descricao);
      setItemsMateriais(prev => {
        const list = prev || [];
        if (isEdit) return list.map(i => i.id === newItem.id ? newItem : i);
        return [newItem, ...list];
      });
    }

    setEditingItem(null);
    setDuplicateAlert(null);
    showFeedbackMessage(isEdit ? 'Item atualizado!' : 'Item adicionado ao estoque!');

    if (config.webhookUrl && navigator.onLine) {
      try {
        await googleSheetService.syncItem(config.webhookUrl, newItem, isEdit);
        newItem.synced = true;
        if (mode === 'aparelhos') {
          setItemsAparelhos(prev => (prev || []).map(i => i.id === newItem.id ? { ...i, synced: true } : i));
        } else {
          setItemsMateriais(prev => (prev || []).map(i => i.id === newItem.id ? { ...i, synced: true } : i));
        }
      } catch (e) {
        console.warn('Salvo localmente (offline):', e);
      }
    }
  };

  const syncPending = async () => {
    if (!config.webhookUrl || !navigator.onLine) return;
    const allPending = (currentItems || []).filter(i => !i.synced);
    if (allPending.length === 0) return;

    for (const item of allPending) {
      try {
        await googleSheetService.syncItem(config.webhookUrl, item, false);
        if (mode === 'aparelhos') {
          setItemsAparelhos(prev => (prev || []).map(i => i.id === item.id ? { ...i, synced: true } : i));
        } else {
          setItemsMateriais(prev => (prev || []).map(i => i.id === item.id ? { ...i, synced: true } : i));
        }
      } catch (e) {
        break;
      }
    }
  };

  const removeItem = (id) => {
    if (mode === 'aparelhos') {
      setItemsAparelhos(prev => (prev || []).filter(i => i.id !== id));
    } else {
      setItemsMateriais(prev => (prev || []).filter(i => i.id !== id));
    }
    if (editingItem && editingItem.id === id) setEditingItem(null);
  };

  const updateQuantity = (id, delta) => {
    const updateFn = prev => (prev || []).map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: nextQty, synced: false };
      }
      return item;
    });

    if (mode === 'aparelhos') setItemsAparelhos(updateFn);
    else setItemsMateriais(updateFn);
  };

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
      items: currentItems || [],
      allAparelhos: itemsAparelhos || [],
      allMateriais: itemsMateriais || [],
      itemsAparelhos: itemsAparelhos || [],
      itemsMateriais: itemsMateriais || [],
      lookupDB: lookupDB || {},
      systemStock: systemStock || {},
      materiaisCatalog: materiaisCatalog || [],
      scannedHistory: scannedHistory || {},
      config,
      setConfig,
      feedback,
      duplicateAlert,
      setDuplicateAlert,
      isOnline,
      editingItem,
      setEditingItem,
      screenFlash,
      triggerFlash,
      saveItem,
      removeItem,
      updateQuantity,
      clearCurrentList,
      syncPending,
      showFeedbackMessage,
      playBeep,
      playDoubleBeep,
      playWarning,
      fetchLiveSheetData,
      linkEanToMaterial,
      getItemCountedStats
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
