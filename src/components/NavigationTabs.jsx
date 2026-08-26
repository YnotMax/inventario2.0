import React from 'react';
import { useInventory } from '../context/InventoryContext';

export const NavigationTabs = ({ activeTab, onTabChange }) => {
  const { mode, materiaisCatalog, systemStock, itemsMateriais, itemsAparelhos } = useInventory();

  // Calcular total de pendências com saldo > 0
  let pendingCount = 0;
  if (mode === 'materiais') {
    const countedSet = new Set(
      itemsMateriais.map(it => (it.codigo || it.descricao || '').trim().toLowerCase())
    );
    pendingCount = materiaisCatalog.filter(mat => {
      const isCounted = countedSet.has((mat.codigo || mat.nome || '').trim().toLowerCase());
      return !isCounted && (Number(mat.quantidade) || 0) > 0;
    }).length;
  } else {
    const countedPatrimonios = new Set(
      itemsAparelhos.map(it => (it.patrimonio || '').toUpperCase().trim())
    );
    if (systemStock && systemStock.byPatrimonio) {
      pendingCount = Object.keys(systemStock.byPatrimonio).filter(
        pat => !countedPatrimonios.has(pat.toUpperCase().trim())
      ).length;
    }
  }

  return (
    <div className="nav-tabs-container">
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'contagem' ? 'active' : ''}`}
        onClick={() => onTabChange('contagem')}
      >
        <i className="fa-solid fa-barcode"></i>
        <span>Contagem Ativa</span>
      </button>

      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'pendentes' ? 'active' : ''}`}
        onClick={() => onTabChange('pendentes')}
      >
        <i className="fa-solid fa-clock-rotate-left"></i>
        <span>Itens Pendentes</span>
        {pendingCount > 0 && (
          <span className="nav-tab-badge">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};
