import React from 'react';
import { useInventory } from '../context/InventoryContext';

export const ActionToolbar = () => {
  const { mode, items, clearCurrentList, syncPending, showFeedbackMessage } = useInventory();

  const exportCSV = () => {
    if (items.length === 0) {
      alert('A lista estÃ¡ vazia para exportar.');
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
      alert('A lista estÃ¡ vazia para copiar.');
      return;
    }

    let text = `INVENTÃRIO ${mode.toUpperCase()}\n------------------------\n`;
    items.forEach((it, idx) => {
      text += `${idx + 1}. Qtd: ${it.quantity || 1}\n`;
      if (mode === 'aparelhos') {
        if (it.patrimonio) text += `   PatrimÃ´nio: ${it.patrimonio}\n`;
        if (it.modelo) text += `   Modelo: ${it.modelo}\n`;
        if (it.serie) text += `   SÃ©rie: ${it.serie}\n`;
        if (it.ean) text += `   EAN: ${it.ean}\n`;
      } else {
        if (it.codigo) text += `   CÃ³digo: ${it.codigo}\n`;
        if (it.descricao) text += `   DescriÃ§Ã£o: ${it.descricao}\n`;
        if (it.unidade) text += `   Un: ${it.unidade}\n`;
        if (it.localizacao) text += `   Local: ${it.localizacao}\n`;
      }
      if (it.obs) text += `   Obs: ${it.obs}\n`;
      text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      showFeedbackMessage('Copiado para a Ã¡rea de transferÃªncia!');
    }).catch(() => {
      alert('NÃ£o foi possÃ­vel copiar automaticamente.');
    });
  };

  return (
    <div className="bottom-action-toolbar">
      <button 
        className="btn-tool primary" 
        onClick={exportCSV} 
        style={{ flex: 1.2, backgroundColor: 'var(--primary-color)', color: 'white' }}
      >
        <i className="fa-solid fa-file-csv"></i> Exportar CSV
      </button>

      <button className="btn-tool" onClick={copyToClipboard} style={{ flex: 1 }}>
        <i className="fa-solid fa-copy"></i> Copiar
      </button>

      <button className="btn-tool" onClick={syncPending} style={{ flex: 1 }} title="Sincronizar Pendentes">
        <i className="fa-solid fa-cloud-arrow-up"></i> Sincronizar
      </button>

      <button 
        className="btn-tool danger" 
        onClick={clearCurrentList} 
        title="Limpar Lista"
        style={{ width: '2.5rem', flex: '0 0 auto' }}
      >
        <i className="fa-solid fa-trash-can"></i>
      </button>
    </div>
  );
};