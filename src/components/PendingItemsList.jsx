import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';

// Card Individual de Material Pendente
const PendingMaterialCard = ({ material, onRegister }) => {
  const defaultQty = (Number(material.quantidade) || 0) > 0 ? Number(material.quantidade) : 1;
  const [qty, setQty] = useState(defaultQty);
  const [loc, setLoc] = useState('');

  const handleAdjustQty = (delta) => {
    setQty(prev => Math.max(1, (Number(prev) || 0) + delta));
  };

  const handleConfirm = () => {
    onRegister({
      codigo: material.codigo || material.ean || '',
      descricao: material.nome,
      unidade: material.unidade || 'UN',
      localizacao: loc,
      quantity: Number(qty) || 1,
      saldoSistema: material.quantidade,
      fornecedor: material.fornecedor || ''
    });
  };

  return (
    <div className="pending-card">
      <div className="pending-card-header">
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-color)' }}>
            {material.nome}
          </h4>
          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            {material.codigo && <span><strong>Cód:</strong> {material.codigo}</span>}
            {material.fornecedor && <span><strong>Forn:</strong> {material.fornecedor}</span>}
            {material.ean && <span><i className="fa-solid fa-barcode"></i> {material.ean}</span>}
          </div>
        </div>

        <span className="badge-unit">
          {material.unidade || 'UN'}
        </span>
      </div>

      <div className="pending-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>
            <i className="fa-solid fa-calculator"></i> Saldo no ERP: {material.quantidade} {material.unidade || 'UN'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Qtd Física Encontrada:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            placeholder="Local / Prat." 
            value={loc} 
            onChange={(e) => setLoc(e.target.value)}
            style={{ flex: 1.2, padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
          />
        </div>

        <button 
          type="button" 
          className="btn-confirm-pending"
          onClick={handleConfirm}
        >
          <i className="fa-solid fa-check"></i>
          <span>Registrar Contagem ({qty} {material.unidade || 'UN'})</span>
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
      patrimonio: item.etiqueta,
      modelo: item.material,
      serie: item.serie,
      quantity: 1,
      obs
    });
  };

  return (
    <div className="pending-card">
      <div className="pending-card-header">
        <div>
          <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-color)' }}>
            {item.material || 'Aparelho / Máquina'}
          </h4>
          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            <span><strong>Patrimônio:</strong> {item.etiqueta}</span>
            {item.serie && <span><strong>Série:</strong> {item.serie}</span>}
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
  const { mode, materiaisCatalog, systemStock, itemsMateriais, itemsAparelhos, saveItem, showFeedbackMessage } = useInventory();
  
  const [filterWithStockOnly, setFilterWithStockOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrar Materiais Pendentes
  const pendingMateriais = useMemo(() => {
    if (mode !== 'materiais') return [];

    const countedKeys = new Set(
      itemsMateriais.map(it => (it.codigo || it.descricao || '').trim().toLowerCase())
    );

    const term = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return materiaisCatalog.filter(mat => {
      const isCounted = countedKeys.has((mat.codigo || mat.nome || '').trim().toLowerCase());
      if (isCounted) return false;

      const hasStock = (Number(mat.quantidade) || 0) > 0;
      if (filterWithStockOnly && !hasStock) return false;

      if (term) {
        const fullText = `${mat.nome || ''} ${mat.codigo || ''} ${mat.fornecedor || ''} ${mat.ean || ''}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (!fullText.includes(term)) return false;
      }

      return true;
    });
  }, [mode, materiaisCatalog, itemsMateriais, filterWithStockOnly, searchTerm]);

  // 2. Filtrar Aparelhos Pendentes
  const pendingAparelhos = useMemo(() => {
    if (mode !== 'aparelhos' || !systemStock || !systemStock.byPatrimonio) return [];

    const countedPatrimonios = new Set(
      itemsAparelhos.map(it => (it.patrimonio || '').toUpperCase().trim())
    );

    const term = searchTerm.trim().toLowerCase();

    return Object.values(systemStock.byPatrimonio).filter(sys => {
      const isCounted = countedPatrimonios.has((sys.etiqueta || '').toUpperCase().trim());
      if (isCounted) return false;

      if (term) {
        const fullText = `${sys.etiqueta || ''} ${sys.material || ''} ${sys.serie || ''}`.toLowerCase();
        if (!fullText.includes(term)) return false;
      }

      return true;
    });
  }, [mode, systemStock, itemsAparelhos, searchTerm]);

  const handleRegisterMaterial = (itemData) => {
    saveItem(itemData);
    showFeedbackMessage(`✅ ${itemData.descricao} registrado!`);
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
            <i className="fa-solid fa-hourglass-half"></i>
            <span>Itens Pendentes ({mode === 'materiais' ? pendingMateriais.length : pendingAparelhos.length})</span>
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-light)' }}>
          Itens cadastrados no sistema que ainda não foram registrados na contagem física.
        </p>
      </div>

      {/* Filtros e Busca de Pendências */}
      <div className="pending-filters">
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" 
            placeholder={`Filtrar pendências de ${mode === 'materiais' ? 'materiais' : 'aparelhos'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '0.85rem' }}></i>
        </div>

        {mode === 'materiais' && (
          <div className="filter-pill-selector">
            <button 
              type="button" 
              className={`pill-btn ${filterWithStockOnly ? 'active' : ''}`}
              onClick={() => setFilterWithStockOnly(true)}
            >
              <i className="fa-solid fa-boxes-stacked"></i> Apenas com Saldo no ERP ({materiaisCatalog.filter(m => (Number(m.quantidade) || 0) > 0).length})
            </button>
            <button 
              type="button" 
              className={`pill-btn ${!filterWithStockOnly ? 'active' : ''}`}
              onClick={() => setFilterWithStockOnly(false)}
            >
              <i className="fa-solid fa-list-ul"></i> Todos Não Contados
            </button>
          </div>
        )}
      </div>

      {/* Lista de Cards */}
      <div className="pending-cards-grid">
        {mode === 'materiais' ? (
          pendingMateriais.length > 0 ? (
            pendingMateriais.slice(0, 100).map((mat, idx) => (
              <PendingMaterialCard 
                key={mat.codigo || mat.ean || idx} 
                material={mat} 
                onRegister={handleRegisterMaterial}
              />
            ))
          ) : (
            <div className="empty-pending-state">
              <i className="fa-solid fa-clipboard-check" style={{ fontSize: '2.5rem', color: '#16a34a' }}></i>
              <p><strong>Nenhuma pendência encontrada!</strong></p>
              <span>Todos os itens deste filtro já foram contabilizados no estoque físico.</span>
            </div>
          )
        ) : (
          pendingAparelhos.length > 0 ? (
            pendingAparelhos.slice(0, 100).map((ap, idx) => (
              <PendingAparelhoCard 
                key={ap.etiqueta || idx} 
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
