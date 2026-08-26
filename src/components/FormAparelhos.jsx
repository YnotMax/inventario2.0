import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';

export const FormAparelhos = ({ scannedData, onResetScanned }) => {
  const { editingItem, saveItem, setEditingItem, lookupDB, systemStock, setDuplicateAlert } = useInventory();

  const [patrimonio, setPatrimonio] = useState('');
  const [modelo, setModelo] = useState('');
  const [serie, setSerie] = useState('');
  const [ean, setEan] = useState('');
  const [obs, setObs] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [hasAutoFill, setHasAutoFill] = useState(false);

  // Preencher quando o scanner lê ou quando entra em modo edição
  useEffect(() => {
    if (editingItem) {
      setPatrimonio(editingItem.patrimonio || '');
      setModelo(editingItem.modelo || '');
      setSerie(editingItem.serie || '');
      setEan(editingItem.ean || '');
      setObs(editingItem.obs || '');
      setQuantity(editingItem.quantity || 1);
    }
  }, [editingItem]);

  useEffect(() => {
    if (scannedData) {
      if (scannedData.patrimonio) setPatrimonio(scannedData.patrimonio);
      if (scannedData.modelo) {
        setModelo(scannedData.modelo);
        setHasAutoFill(true);
      }
      if (scannedData.serie) setSerie(scannedData.serie);
      if (scannedData.ean) {
        setEan(scannedData.ean);
        if (lookupDB[scannedData.ean]) {
          setModelo(lookupDB[scannedData.ean]);
          setHasAutoFill(true);
        }
      }
      if (scannedData.obs) setObs(prev => prev ? `${prev} / ${scannedData.obs}` : scannedData.obs);
      onResetScanned();
    }
  }, [scannedData, lookupDB, onResetScanned]);

  // Efeito ao digitar EAN
  const handleEanChange = (val) => {
    setEan(val);
    if (val && lookupDB[val.trim()]) {
      setModelo(lookupDB[val.trim()]);
      setHasAutoFill(true);
    }
  };

  const handleClear = () => {
    setPatrimonio('');
    setModelo('');
    setSerie('');
    setEan('');
    setObs('');
    setQuantity(1);
    setHasAutoFill(false);
    setEditingItem(null);
    setDuplicateAlert(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patrimonio && !modelo && !serie && !ean) {
      alert('Por favor, preencha pelo menos um campo de código antes de salvar.');
      return;
    }

    saveItem({
      patrimonio,
      modelo,
      serie,
      ean,
      obs,
      quantity: Number(quantity) || 1
    });

    handleClear();
  };

  return (
    <form className="item-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <h3>
          <i className="fa-solid fa-tv"></i>
          <span>{editingItem ? 'Editando Aparelho' : 'Aparelho Atual'}</span>
        </h3>
        <button type="button" className="btn-text" onClick={handleClear}>
          <i className="fa-solid fa-rotate-left"></i> Limpar
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="input-patrimonio">
          <i className="fa-solid fa-tag"></i> Patrimônio (QR)
        </label>
        <input 
          id="input-patrimonio"
          type="text" 
          placeholder="Ex: 035.03.232" 
          value={patrimonio} 
          onChange={e => setPatrimonio(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="input-modelo">
            Modelo {hasAutoFill && <span className="badge-auto"><i className="fa-solid fa-sparkles"></i> Auto</span>}
          </label>
          <input 
            id="input-modelo"
            type="text" 
            placeholder="Ex: CRC08CBANA" 
            value={modelo} 
            onChange={e => setModelo(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="input-serie">Nº Série</label>
          <input 
            id="input-serie"
            type="text" 
            placeholder="Ex: ARC112500168435" 
            value={serie} 
            onChange={e => setSerie(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="input-ean">
          <i className="fa-solid fa-barcode"></i> Cód. Barras (EAN)
        </label>
        <input 
          id="input-ean"
          type="text" 
          placeholder="Ex: 7891129224049" 
          value={ean} 
          onChange={e => handleEanChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="input-obs">
          <i className="fa-regular fa-comment"></i> Observação
        </label>
        <textarea 
          id="input-obs"
          rows="1" 
          placeholder="Lote, avaria, local, etc..." 
          value={obs} 
          onChange={e => setObs(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="input-qty">Qtd</label>
          <input 
            id="input-qty"
            type="number" 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-save-main" style={{ flex: 2 }}>
          <i className={`fa-solid ${editingItem ? 'fa-check' : 'fa-plus'}`}></i>
          <span>{editingItem ? 'Salvar Alterações' : 'Adicionar à Lista'}</span>
        </button>
      </div>
    </form>
  );
};
