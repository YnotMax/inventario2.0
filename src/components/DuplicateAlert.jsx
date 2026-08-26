import React from 'react';
import { useInventory } from '../context/InventoryContext';

export const DuplicateAlert = () => {
  const { duplicateAlert, setDuplicateAlert } = useInventory();

  if (!duplicateAlert) return null;

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      border: '2px solid #ef4444',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
      animation: 'shake 0.4s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c', fontWeight: 700, fontSize: '0.9rem' }}>
        <i className="fa-solid fa-triangle-exclamation"></i>
        <span>{duplicateAlert.title}</span>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#991b1b', marginLeft: '1.3rem' }}>
        {duplicateAlert.desc}
      </div>

      <button
        type="button"
        onClick={() => setDuplicateAlert(null)}
        style={{
          alignSelf: 'flex-end',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '0.3rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: '0.2rem'
        }}
      >
        <i className="fa-solid fa-check"></i> Entendi / Fechar
      </button>
    </div>
  );
};
