import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';

// Card Individual de Material (Pendente ou Já Contado)
const MaterialAuditCard = ({ material, stats, onRegister }) => {
  const isCounted = stats.isCounted;
  const sysQty = Number(material?.quantidade) || 0;
  const countedQty = stats.totalCounted || 0;
  const diff = countedQty - sysQty;

  const defaultQty = !isCounted ? (sysQty > 0 ? sysQty : 1) : 1;
  const [qty, setQty] = useState(defaultQty);
  const [loc, setLoc] = useState(stats.locations && stats.locations.length ? stats.locations.join(' / ') : '');

  const handleAdjustQty = (delta) => {
    setQty(prev => Math.max(1, (Number(prev) || 0) + delta));
  };

  const handleConfirm = () => {
    onRegister({
      codigo: material?.codigo || material?.ean || '',
      descricao: material?.nome || '',
      unidade: material?.unidade || 'UN',
      localizacao: loc,
      quantity: Number(qty) || 1,
      saldoSistema: sysQty,
      fornecedor: material?.fornecedor || ''
    }, isCounted);
  };

  return (
    <div className={`pending-card ${isCounted ? 'counted-card' : ''}`}>
      <div className="pending-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-color)' }}>
              {material?.nome}
            </h4>
            {isCounted ? (
              <span className="badge-counted-success">
                <i className="fa-solid fa-circle-check"></i> JÁ CONTADO ({countedQty} {material?.unidade || 'UN'})
              </span>
            ) : (
              <span className="badge-pending-warn">
                <i className="fa-solid fa-clock"></i> PENDENTE
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            {material?.codigo && <span><strong>Cód:</strong> {material.codigo}</span>}
            {material?.fornecedor && <span><strong>Forn:</strong> {material.fornecedor}</span>}
            {material?.ean && <span><i className="fa-solid fa-barcode"></i> {material.ean}</span>}
          </div>
        </div>

        <span className="badge-unit">
          {material?.unidade || 'UN'}
        </span>
      </div>

      <div className="pending-card-body">
        {/* Painel Informativo de Saldos */}
        <div className="balance-info-grid">
          <div className="balance-info-col">
            <span className="balance-label">Saldo ERP:</span>
            <strong className="balance-val-erp">{sysQty} {material?.unidade || 'UN'}</strong>
          </div>
          <div className="balance-info-col">
            <span className="balance-label">Físico Registrado:</span>
            <strong className={`balance-val-phys ${isCounted ? 'counted' : 'zero'}`}>
              {countedQty} {material?.unidade || 'UN'}
            </strong>
          </div>
          <div className="balance-info-col">
            <span className="balance-label">Diferença:</span>
            <strong className={`balance-val-diff ${diff === 0 ? 'equal' : (diff > 0 ? 'pos' : 'neg')}`}>
              {diff > 0 ? `+${diff}` : diff} {material?.unidade || 'UN'}
            </strong>
          </div>
        </div>

        {/* Formulário de Registro / Soma */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
          <div className="qty-stepper" style={{ flex: 1 }}>
            <button type="button" onClick={() => handleAdjustQty(-1)}>-</button>
            <input 
              type="number" 
              min="1" 
              value={qty} 
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            />
            <button type="button" onClick={() => handleAdjustQty(1)}>+</button>
          </div>

          <input 
            type="text" 
            placeholder="Local / Prateleira" 
            value={loc} 
            onChange={(e) => setLoc(e.target.value)}
            style={{ flex: 1.2, padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
          />
        </div>

        <button 
          type="button" 
          className={`btn-confirm-pending ${isCounted ? 'btn-add-more' : ''}`}
          onClick={handleConfirm}
        >
          <i className={`fa-solid ${isCounted ? 'fa-plus' : 'fa-check'}`}></i>
          <span>{isCounted ? `Somar Mais (+${qty} ${material?.unidade || 'UN'})` : `Registrar Contagem (${qty} ${material?.unidade || 'UN'})`}</span>
        </button>
      </div>
    </div>
  );
};

// Card Individual de Aparelho Pendente
const PendingAparelhoCard = ({ item, onRegister }) => {
  const [obs, setObs] = useState('');

  const handleConfirm = () => {
    onRegister({
      patrimonio: item?.etiqueta || '',
      modelo: item?.material || '',
      serie: item?.serie || '',
      quantity: 1,
      obs
    });
  };

  return (
    <div className="pending-card">
      <div className="pending-card-header">
        <div>
          <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-color)' }}>
            {item?.material || 'Aparelho / Máquina'}
          </h4>
          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            <span><strong>Patrimônio:</strong> {item?.etiqueta}</span>
            {item?.serie && <span><strong>Série:</strong> {item?.serie}</span>}
          </div>
        </div>
      </div>

      <div className="pending-card-body">
        <input 
          type="text" 
          placeholder="Observação (opcional)..." 
          value={obs} 
          onChange={(e) => setObs(e.target.value)}
          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
        />

        <button 
          type="button" 
          className="btn-confirm-pending"
          onClick={handleConfirm}
        >
          <i className="fa-solid fa-check"></i>
          <span>Confirmar Aparelho no Físico</span>
        </button>
      </div>
    </div>
  );
};

export const PendingItemsList = () => {
  const { 
    mode, 
    materiaisCatalog = [], 
    systemStock = {}, 
    itemsAparelhos = [], 
    allAparelhos = [],
    getItemCountedStats,
    saveItem, 
    showFeedbackMessage 
  } = useInventory();
  
  // Filtros: 'pendentes' (falta contar com saldo > 0) | 'contados' (já contados) | 'todos' (catálogo completo)
  const [activeFilter, setActiveFilter] = useState('pendentes');
  
  // Estado de digitação imediato (nunca trava) e estado de busca com debounce
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debounceTimerRef = useRef(null);

  // Debounce automático de 300ms
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [inputValue]);

  // Disparo manual instantâneo ao clicar em Buscar ou apertar Enter
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchTerm(inputValue);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setInputValue('');
    setSearchTerm('');
  };

  const currentAps = itemsAparelhos.length ? itemsAparelhos : allAparelhos;

  // 1. Filtrar Materiais (Otimizado e Fluido)
  const filteredMateriais = useMemo(() => {
    if (mode !== 'materiais') return [];

    const term = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return (materiaisCatalog || []).map(mat => {
      const stats = getItemCountedStats(mat?.codigo, mat?.nome);
      return { material: mat, stats };
    }).filter(({ material, stats }) => {
      const hasStock = (Number(material?.quantidade) || 0) > 0;
      
      // Aplicar filtro de aba
      if (activeFilter === 'pendentes') {
        if (stats.isCounted) return false;
        if (!hasStock) return false;
      } else if (activeFilter === 'contados') {
        if (!stats.isCounted) return false;
      }

      // Aplicar busca de texto
      if (term) {
        const fullText = `${material?.nome || ''} ${material?.codigo || ''} ${material?.fornecedor || ''} ${material?.ean || ''}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (!fullText.includes(term)) return false;
      }

      return true;
    });
  }, [mode, materiaisCatalog, getItemCountedStats, activeFilter, searchTerm]);

  // Contadores para os botões de filtro
  const counts = useMemo(() => {
    if (mode !== 'materiais') return { pendentes: 0, contados: 0, todos: 0 };
    let pendentes = 0;
    let contados = 0;

    (materiaisCatalog || []).forEach(mat => {
      const stats = getItemCountedStats(mat?.codigo, mat?.nome);
      if (stats.isCounted) contados++;
      else if ((Number(mat?.quantidade) || 0) > 0) pendentes++;
    });

    return { pendentes, contados, todos: materiaisCatalog.length };
  }, [mode, materiaisCatalog, getItemCountedStats]);

  // 2. Filtrar Aparelhos Pendentes
  const pendingAparelhos = useMemo(() => {
    if (mode !== 'aparelhos' || !systemStock || !systemStock.byPatrimonio) return [];

    const countedPatrimonios = new Set(
      (currentAps || []).map(it => (it?.patrimonio || '').toUpperCase().trim())
    );

    const term = searchTerm.trim().toLowerCase();

    return Object.values(systemStock.byPatrimonio).filter(sys => {
      const isCounted = countedPatrimonios.has((sys?.etiqueta || '').toUpperCase().trim());
      if (isCounted) return false;

      if (term) {
        const fullText = `${sys?.etiqueta || ''} ${sys?.material || ''} ${sys?.serie || ''}`.toLowerCase();
        if (!fullText.includes(term)) return false;
      }

      return true;
    });
  }, [mode, systemStock, currentAps, searchTerm]);

  const handleRegisterMaterial = (itemData, merge = false) => {
    saveItem(itemData, merge);
    showFeedbackMessage(`✅ ${itemData.descricao} registrado no físico!`);
  };

  const handleRegisterAparelho = (itemData) => {
    saveItem(itemData);
    showFeedbackMessage(`✅ Patrimônio ${itemData.patrimonio} registrado!`);
  };

  return (
    <div className="pending-section">
      <div className="pending-header-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>
            <i className="fa-solid fa-clipboard-check"></i>
            <span>Painel de Auditoria e Pendências</span>
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-light)' }}>
          Compare o saldo cadastrado no sistema ERP com o que já foi conferido fisicamente.
        </p>
      </div>

      {/* Formulário de Busca Otimizada (Debounce + Tecla Enter + Botão Buscar) */}
      <form className="pending-search-form" onSubmit={handleSearchSubmit}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder={`Buscar ${mode === 'materiais' ? 'nome, código ou fornecedor' : 'patrimônio ou modelo'}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ paddingLeft: '2.2rem', paddingRight: inputValue ? '2rem' : '0.85rem' }}
          />
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.8rem', color: 'var(--text-light)', fontSize: '0.85rem', pointerEvents: 'none' }}></i>
          
          {inputValue && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.6rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: '0.2rem'
              }}
              title="Limpar busca"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>

        <button type="submit" className="btn-search-trigger" title="Buscar agora">
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>Buscar</span>
        </button>
      </form>

      {/* Seletor de Abas de Filtro */}
      {mode === 'materiais' && (
        <div className="filter-pill-selector">
          <button 
            type="button" 
            className={`pill-btn ${activeFilter === 'pendentes' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pendentes')}
          >
            <i className="fa-solid fa-hourglass-half"></i> Falta Contar ({counts.pendentes})
          </button>
          <button 
            type="button" 
            className={`pill-btn ${activeFilter === 'contados' ? 'active' : ''}`}
            onClick={() => setActiveFilter('contados')}
            style={{ 
              borderColor: activeFilter === 'contados' ? '#16a34a' : '', 
              backgroundColor: activeFilter === 'contados' ? '#16a34a' : '' 
            }}
          >
            <i className="fa-solid fa-circle-check"></i> Já Contados ({counts.contados})
          </button>
          <button 
            type="button" 
            className={`pill-btn ${activeFilter === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveFilter('todos')}
          >
            <i className="fa-solid fa-list-ul"></i> Todos ({counts.todos})
          </button>
        </div>
      )}

      {/* Lista de Cards */}
      <div className="pending-cards-grid">
        {mode === 'materiais' ? (
          filteredMateriais.length > 0 ? (
            filteredMateriais.slice(0, 100).map(({ material, stats }, idx) => (
              <MaterialAuditCard 
                key={material?.codigo || material?.ean || idx} 
                material={material} 
                stats={stats}
                onRegister={handleRegisterMaterial}
              />
            ))
          ) : (
            <div className="empty-pending-state">
              <i className="fa-solid fa-clipboard-check" style={{ fontSize: '2.5rem', color: '#16a34a' }}></i>
              <p><strong>Nenhum item encontrado!</strong></p>
              <span>{activeFilter === 'pendentes' ? 'Parabéns! Todos os itens com saldo no ERP já foram conferidos.' : 'Tente buscar por outro termo ou altere a aba acima.'}</span>
            </div>
          )
        ) : (
          pendingAparelhos.length > 0 ? (
            pendingAparelhos.slice(0, 100).map((ap, idx) => (
              <PendingAparelhoCard 
                key={ap?.etiqueta || idx} 
                item={ap} 
                onRegister={handleRegisterAparelho}
              />
            ))
          ) : (
            <div className="empty-pending-state">
              <i className="fa-solid fa-clipboard-check" style={{ fontSize: '2.5rem', color: '#16a34a' }}></i>
              <p><strong>Nenhuma pendência de aparelho!</strong></p>
              <span>Todas as máquinas cadastradas no sistema já foram bipadas.</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
