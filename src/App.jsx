import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { Scanner } from './components/Scanner';
import { FormAparelhos } from './components/FormAparelhos';
import { FormMateriais } from './components/FormMateriais';
import { DuplicateAlert } from './components/DuplicateAlert';
import { ItemsList } from './components/ItemsList';
import { ActionToolbar } from './components/ActionToolbar';
import { SettingsModal } from './components/SettingsModal';

import './styles/App.css';
import './styles/components.css';

const MainApp = () => {
  const { mode, feedback, screenFlash, setEditingItem } = useInventory();
  const [scannedData, setScannedData] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleEditItem = (item) => {
    setEditingItem(item);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Flash visual nas bordas */}
      <div className={`screen-flash ${screenFlash.active ? 'active' : ''} ${screenFlash.type === 'warning' ? 'warning' : ''} ${screenFlash.type === 'info' ? 'info' : ''}`} />

      {/* Header com Seletor e Status (Rola com a tela para liberar espaço) */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="main-content">
        {/* Banner de Feedback Rápido */}
        {feedback.show && (
          <div className={`feedback-banner ${feedback.type === 'warning' ? 'warning' : ''} ${feedback.type === 'info' ? 'info' : ''}`}>
            <span>
              <i className={`fa-solid ${feedback.type === 'warning' ? 'fa-triangle-exclamation' : (feedback.type === 'info' ? 'fa-circle-info' : 'fa-check-circle')}`}></i> {feedback.text}
            </span>
          </div>
        )}

        {/* Alerta de Duplicidade / Divergência */}
        <DuplicateAlert />

        {/* Scanner com Câmera e Lanterna */}
        <Scanner onCodeDetected={(data) => setScannedData(data)} />

        {/* Formulário Condicional baseado no Modo Ativo */}
        {mode === 'aparelhos' ? (
          <FormAparelhos 
            scannedData={scannedData} 
            onResetScanned={() => setScannedData(null)} 
          />
        ) : (
          <FormMateriais 
            scannedData={scannedData} 
            onResetScanned={() => setScannedData(null)} 
          />
        )}
      </main>

      {/* Lista de Itens Contados em Tempo Real */}
      <ItemsList onEditItem={handleEditItem} />

      {/* Barra de Ações (No fluxo da página, rola junto com a lista) */}
      <ActionToolbar />

      {/* Modal de Configurações */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}
