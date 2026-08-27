import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';

// Formatador elegante de data/hora
const formatDateTime = (ts) => {
  if (!ts) return '';
  if (typeof ts === 'string' && (ts.includes('GMT') || ts.includes('T') || ts.includes('-'))) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  }
  return String(ts);
};

export const ItemsList = ({ onEditItem }) => {
  const { mode, items, removeItem, updateQuantity } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  const currentItems = items || [];

  const filteredItems = currentItems.filter(item => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (item.patrimonio && item.patrimonio.toLowerCase().includes(term)) ||
      (item.modelo && item.modelo.toLowerCase().includes(term)) ||
      (item.serie && item.serie.toLowerCase().includes(term)) ||
      (item.codigo && item.codigo.toLowerCase().includes(term)) ||
      (item.descricao && item.descricao.toLowerCase().includes(term)) ||
      (item.localizacao && item.localizacao.toLowerCase().includes(term)) ||
      (item.obs && item.obs.toLowerCase().includes(term))
    );
  });

  const totalQuantity = currentItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

  return (
    <div className="list-section">
      <div className="list-header">
        <div>
          <h2>{mode === 'aparelhos' ? 'Aparelhos Contados' : 'Materiais Contados'}</h2>
          <span className="list-subtitle">
            <strong>{currentItems.length}</strong> {currentItems.length === 1 ? 'item registrado' : 'itens registrados'} (<strong>{totalQuantity}</strong> total físico)
          </span>
        </div>
      </div>

      <div className="search-box">
        <i className="fa-solid fa-magnifying-glass search-icon"></i>
        <input 
          type="text" 
          className="search-input" 
          placeholder={`Filtrar ${mode === 'aparelhos' ? 'patrimônio, modelo, série...' : 'código, nome, localização...'}`} 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            type="button" 
            className="search-clear-btn" 
            onClick={() => setSearchTerm('')}
            title="Limpar busca"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-clipboard-list" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {searchTerm ? 'Nenhum item corresponde à sua busca.' : 'Nenhum item escaneado ainda.'}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {searchTerm ? 'Tente buscar por outro termo.' : 'Aponte a câmera ou use o formulário acima para registrar.'}
          </span>
        </div>
      ) : (
        <ul className="items-list">
          {filteredItems.map((item, idx) => (
            <li key={item.id || idx} className="item-row">
              {/* Nuvem de sincronização com tooltip */}
              <div className="sync-badge-container">
                <i 
                  className={`sync-icon fa-solid ${item.synced ? 'fa-cloud-check synced' : 'fa-cloud-arrow-up pending'}`}
                  title={item.synced ? 'Sincronizado no Google Sheets' : 'Pendente de sincronização'}
                ></i>
              </div>

              <div className="item-info">
                {/* Linhas específicas por modo */}
                {mode === 'aparelhos' ? (
                  <>
                    {item.patrimonio && (
                      <div className="item-code">
                        <i className="fa-solid fa-tag"></i>
                        <span>{item.patrimonio}</span>
                      </div>
                    )}
                    {item.modelo && (
                      <div className="item-meta">
                        <span className="meta-label">Modelo:</span>
                        <strong className="meta-value">{item.modelo}</strong>
                      </div>
                    )}
                    {item.serie && (
                      <div className="item-meta">
                        <span className="meta-label">Série:</span>
                        <span className="meta-value font-mono">{item.serie}</span>
                      </div>
                    )}
                    {item.ean && (
                      <div className="item-meta">
                        <i className="fa-solid fa-barcode"></i>
                        <span className="meta-value font-mono">{item.ean}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.descricao && (
                      <div className="item-code">
                        <span>{item.descricao}</span>
                      </div>
                    )}
                    <div className="item-tags-row">
                      {item.codigo && (
                        <span className="item-badge-code">
                          <i className="fa-solid fa-barcode"></i> {item.codigo}
                        </span>
                      )}
                      {item.unidade && (
                        <span className="item-badge-unit">
                          {item.unidade}
                        </span>
                      )}
                      {item.localizacao && (
                        <span className="item-badge-loc">
                          <i className="fa-solid fa-location-dot"></i> {item.localizacao}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {item.obs && (
                  <div className="item-obs">
                    <i className="fa-regular fa-comment"></i>
                    <span>{item.obs}</span>
                  </div>
                )}

                <div className="item-time">
                  <i className="fa-regular fa-clock"></i> {formatDateTime(item.timestamp)}
                </div>
              </div>

              {/* Controles de Quantidade e Ações */}
              <div className="item-controls">
                <div className="qty-stepper">
                  <button 
                    type="button" 
                    className="qty-btn" 
                    onClick={() => updateQuantity(item.id, -1)}
                    title="Diminuir quantidade"
                  >
                    -
                  </button>
                  <span className="qty-val">{item.quantity || 1}</span>
                  <button 
                    type="button" 
                    className="qty-btn" 
                    onClick={() => updateQuantity(item.id, 1)}
                    title="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>

                <div className="item-actions-group">
                  <button 
                    type="button"
                    className="btn-action-icon edit" 
                    onClick={() => onEditItem(item)} 
                    title="Editar item"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button 
                    type="button"
                    className="btn-action-icon danger" 
                    onClick={() => removeItem(item.id)} 
                    title="Remover item"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
