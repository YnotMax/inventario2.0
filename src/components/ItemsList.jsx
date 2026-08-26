import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';

export const ItemsList = ({ onEditItem }) => {
  const { mode, items, removeItem, updateQuantity } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
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

  const totalQuantity = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

  return (
    <div className="list-section">
      <div className="list-header">
        <div>
          <h2>{mode === 'aparelhos' ? 'Aparelhos Contados' : 'Materiais Contados'}</h2>
          <span className="list-subtitle">
            <strong>{items.length}</strong> produtos registrados (<strong>{totalQuantity}</strong> total)
          </span>
        </div>
      </div>

      <input 
        type="text" 
        className="search-input" 
        placeholder="Buscar código, modelo ou observação..." 
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.85rem' }}>
          {searchTerm ? 'Nenhum item corresponde à busca.' : 'Nenhum código escaneado ainda. Aponte a câmera para começar!'}
        </div>
      ) : (
        <ul className="items-list">
          {filteredItems.map(item => (
            <li key={item.id} className="item-row">
              {/* Nuvem de sincronização */}
              <i 
                className={`sync-icon fa-solid ${item.synced ? 'fa-cloud-check synced' : 'fa-cloud-arrow-up pending'}`}
                title={item.synced ? 'Sincronizado na Planilha' : 'Pendente de envio'}
              ></i>

              <div className="item-info">
                {/* Linhas específicas por modo */}
                {mode === 'aparelhos' ? (
                  <>
                    {item.patrimonio && (
                      <div className="item-code">
                        <i className="fa-solid fa-tag" style={{ width: 16 }}></i> {item.patrimonio}
                      </div>
                    )}
                    {item.modelo && (
                      <div className="item-meta">
                        <strong style={{ color: 'var(--text-light)' }}>Mod:</strong> {item.modelo}
                      </div>
                    )}
                    {item.serie && (
                      <div className="item-meta">
                        <strong style={{ color: 'var(--text-light)' }}>SN:</strong> {item.serie}
                      </div>
                    )}
                    {item.ean && (
                      <div className="item-meta" style={{ color: 'var(--primary-dark)' }}>
                        <i className="fa-solid fa-barcode"></i> {item.ean}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.descricao && (
                      <div className="item-code" style={{ fontSize: '0.92rem' }}>
                        {item.descricao}
                      </div>
                    )}
                    {item.codigo && (
                      <div className="item-meta">
                        <i className="fa-solid fa-barcode"></i> {item.codigo}
                      </div>
                    )}
                    {item.localizacao && (
                      <div className="item-meta" style={{ color: '#0369a1' }}>
                        <i className="fa-solid fa-location-dot"></i> {item.localizacao}
                      </div>
                    )}
                    {item.unidade && (
                      <div className="item-meta">
                        <strong style={{ color: 'var(--text-light)' }}>Un:</strong> {item.unidade}
                      </div>
                    )}
                  </>
                )}

                {item.obs && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                    <i className="fa-regular fa-comment"></i> {item.obs}
                  </div>
                )}

                <div className="item-time">{item.timestamp}</div>
              </div>

              <div className="item-controls">
                <div className="qty-stepper">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span className="qty-val">{item.quantity || 1}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <button 
                    className="btn-action-icon" 
                    onClick={() => onEditItem(item)} 
                    title="Editar"
                    style={{ width: '1.8rem', height: '1.8rem' }}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button 
                    className="btn-action-icon danger" 
                    onClick={() => removeItem(item.id)} 
                    title="Remover"
                    style={{ width: '1.8rem', height: '1.8rem' }}
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
