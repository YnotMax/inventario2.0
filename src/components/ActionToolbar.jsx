import React from 'react';
import { useInventory } from '../context/InventoryContext';

export const ActionToolbar = () => {
  const { mode, items, clearCurrentList, syncPending, showFeedbackMessage } = useInventory();

  const exportCSV = () => {
    if (items.length === 0) {
      alert('A lista está vazia para exportar.');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    if (mode === 'aparelhos') {
      csvContent += 'Patrimonio;Modelo;NumeroSerie;EAN;Observacao;Quantidade;DataHora\n';
      items.forEach(it => {
        csvContent += `"${it.patrimonio || ''}";"${it.modelo || ''}";"${it.serie || ''}";"${it.ean || ''}";"${it.obs || ''}";${it.quantity || 1};"${it.timestamp || ''}"\n`;
      });
    } else {
      csvContent += 'Codigo;Descricao;Unidade;Localizacao;Quantidade;Observacao;DataHora\n';
      items.forEach(it => {
        csvContent += `"${it.codigo || ''}";"${it.descricao || ''}";"${it.unidade || ''}";"${it.localizacao || ''}";${it.quantity || 1};"${it.obs || ''}";"${it.timestamp || ''}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_${mode}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showFeedbackMessage('Arquivo CSV exportado!');
  };

  const copyToClipboard = () => {
    if (items.length === 0) {
      alert('A lista está vazia para copiar.');
      return;
    }

    let text = `INVENTÁRIO ${mode.toUpperCase()}\n------------------------\n`;
    items.forEach((it, idx) => {
      text += `${idx + 1}. Qtd: ${it.quantity || 1}\n`;
      if (mode === 'aparelhos') {
        if (it.patrimonio) text += `   Patrimônio: ${it.patrimonio}\n`;
        if (it.modelo) text += `   Modelo: ${it.modelo}\n`;
        if (it.serie) text += `   Série: ${it.serie}\n`;
        if (it.ean) text += `   EAN: ${it.ean}\n`;
      } else {
        if (it.codigo) text += `   Código: ${it.codigo}\n`;
        if (it.descricao) text += `   Descrição: ${it.descricao}\n`;
        if (it.unidade) text += `   Un: ${it.unidade}\n`;
        if (it.localizacao) text += `   Local: ${it.localizacao}\n`;
      }
      if (it.obs) text += `   Obs: ${it.obs}\n`;
      text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      showFeedbackMessage('Copiado para a área de transferência!');
    }).catch(() => {
      alert('Não foi possível copiar automaticamente.');
    });
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0.4rem',
      justifyContent: 'center',
      padding: '0.85rem 1rem',
      backgroundColor: 'var(--surface-color)',
      borderTop: '1px solid var(--border-color)',
      position: 'sticky',
      bottom: 0,
      zIndex: 90
    }}>
      <button 
        className="btn-tool primary" 
        onClick={exportCSV} 
        style={{ flex: 1, backgroundColor: 'var(--primary-color)', color: 'white' }}
      >
        <i className="fa-solid fa-file-csv"></i> Exportar CSV
      </button>

      <button className="btn-tool" onClick={copyToClipboard} style={{ flex: 1 }}>
        <i className="fa-solid fa-copy"></i> Copiar Texto
      </button>

      <button className="btn-tool" onClick={syncPending} style={{ flex: 1 }} title="Sincronizar Pendentes">
        <i className="fa-solid fa-cloud-arrow-up"></i> Sincronizar
      </button>

      <button 
        className="btn-tool" 
        onClick={clearCurrentList} 
        style={{ color: 'var(--danger-color)' }}
        title="Limpar Lista"
      >
        <i className="fa-solid fa-trash-can"></i>
      </button>
    </div>
  );
};
