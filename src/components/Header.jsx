import React from 'react';
import { useInventory } from '../context/InventoryContext';

export const Header = ({ onOpenSettings }) => {
  const { mode, setMode, isOnline, items, syncPending } = useInventory();
  const pendingCount = items.filter(i => !i.synced).length;

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <i className="fa-solid fa-qrcode" style={{ fontSize: '1.25rem' }}></i>
          <h1>Inventário 2.0</h1>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-header-icon" 
            onClick={onOpenSettings} 
            title="Configurações e Webhooks"
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </div>

      {/* Seletor de Modo */}
      <div className="mode-selector">
        <button 
          className={`mode-btn ${mode === 'aparelhos' ? 'active' : ''}`}
          onClick={() => setMode('aparelhos')}
        >
          <i className="fa-solid fa-tv"></i> Aparelhos
        </button>
        
        <button 
          className={`mode-btn ${mode === 'materiais' ? 'active' : ''}`}
          onClick={() => setMode('materiais')}
        >
          <i className="fa-solid fa-boxes-stacked"></i> Materiais & Peças
        </button>
      </div>

      {/* Pílula de Status de Conexão */}
      <div 
        className={`status-pill ${!isOnline ? 'offline' : (pendingCount > 0 ? 'pending' : 'online')}`}
        onClick={pendingCount > 0 && isOnline ? syncPending : undefined}
      >
        <i className={`fa-solid ${!isOnline ? 'fa-cloud-arrow-down' : (pendingCount > 0 ? 'fa-cloud-arrow-up' : 'fa-cloud-check')}`}></i>
        <span>
          {!isOnline 
            ? `Offline (${pendingCount} salvos no celular)` 
            : (pendingCount > 0 ? `${pendingCount} pendente(s) • Toque p/ enviar` : 'Conectado & Sincronizado')
          }
        </span>
      </div>
    </header>
  );
};
