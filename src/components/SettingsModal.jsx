import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { config, setConfig, showFeedbackMessage, fetchLiveSheetData } = useInventory();
  
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled !== false);

  if (!isOpen) return null;

  const handleSave = () => {
    setConfig(prev => ({
      ...prev,
      webhookUrl: webhookUrl.trim(),
      soundEnabled
    }));
    showFeedbackMessage('Configurações salvas!');
    fetchLiveSheetData();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        width: '100%',
        maxWidth: '460px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-sliders"></i> Configurações
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--text-light)' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="setting-webhook">
            <i className="fa-solid fa-link"></i> URL do Webhook (Google Apps Script)
          </label>
          <input 
            id="setting-webhook"
            type="text" 
            placeholder="https://script.google.com/macros/s/.../exec"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
            Insira o link de implantação da sua planilha Google Sheets.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            id="setting-sound"
            type="checkbox" 
            checked={soundEnabled}
            onChange={e => setSoundEnabled(e.target.checked)}
            style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
          />
          <label htmlFor="setting-sound" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            <i className="fa-solid fa-volume-high"></i> Habilitar sons de bipe e alerta
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button 
            type="button" 
            className="btn-tool" 
            onClick={onClose} 
            style={{ flex: 1 }}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-save-main" 
            onClick={handleSave} 
            style={{ flex: 2, marginTop: 0 }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
