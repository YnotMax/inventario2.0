import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MaterialSearchAutocomplete } from './MaterialSearchAutocomplete';

const UNIDADES = ['UN', 'MT', 'KG', 'CX', 'PC', 'RL', 'LT', 'PAR', 'M2', 'M3'];

export const FormMateriais = ({ scannedData, onResetScanned }) => {
  const { editingItem, saveItem, setEditingItem, lookupDB, linkEanToMaterial } = useInventory();

  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [unidade, setUnidade] = useState('UN');
  const [localizacao, setLocalizacao] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [obs, setObs] = useState('');
  const [hasAutoFill, setHasAutoFill] = useState(false);
  const [systemBalance, setSystemBalance] = useState(null);
  const [fornecedorInfo, setFornecedorInfo] = useState('');
  const [lastScannedEan, setLastScannedEan] = useState('');

  const qtyInputRef = useRef(null);

  // Preencher quando entra em modo edição
  useEffect(() => {
    if (editingItem) {
      setCodigo(editingItem.codigo || '');
      setDescricao(editingItem.descricao || '');
      setUnidade(editingItem.unidade || 'UN');
      setLocalizacao(editingItem.localizacao || '');
      setQuantity(editingItem.quantity || 1);
      setObs(editingItem.obs || '');
      setSystemBalance(editingItem.saldoSistema || null);
      setFornecedorInfo(editingItem.fornecedor || '');
    }
  }, [editingItem]);

  // Preencher quando o scanner lê código de barras
  useEffect(() => {
    if (scannedData) {
      const code = scannedData.ean || scannedData.codigo || scannedData.raw || '';
      if (code) {
        setCodigo(code);
        setLastScannedEan(code);
        
        // Se já existe no catálogo
        if (lookupDB[code]) {
          setDescricao(lookupDB[code]);
          setHasAutoFill(true);
        }
      }
      onResetScanned();
    }
  }, [scannedData, lookupDB, onResetScanned]);

  // Ação ao selecionar produto no Autocomplete de Busca
  const handleSelectMaterialFromSearch = (mat) => {
    setDescricao(mat.nome || '');
    if (mat.codigo) setCodigo(mat.codigo);
    if (mat.unidade) setUnidade(mat.unidade);
    if (mat.quantidade !== undefined) setSystemBalance(mat.quantidade);
    if (mat.fornecedor) setFornecedorInfo(mat.fornecedor);
    setHasAutoFill(true);

    // Focar no campo de quantidade
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 100);
  };

  const handleLinkEan = () => {
    if (lastScannedEan && descricao) {
      linkEanToMaterial(lastScannedEan, descricao);
      setLastScannedEan('');
    }
  };

  const handleClear = () => {
    setCodigo('');
    setDescricao('');
    setUnidade('UN');
    setLocalizacao('');
    setQuantity(1);
    setObs('');
    setHasAutoFill(false);
    setSystemBalance(null);
    setFornecedorInfo('');
    setLastScannedEan('');
    setEditingItem(null);
  };

  const addQuickQty = (amount) => {
    setQuantity(prev => (Number(prev) || 0) + amount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!codigo && !descricao) {
      alert('Por favor, preencha o código ou descrição do material.');
      return;
    }

    saveItem({
      codigo,
      descricao,
      unidade,
      localizacao,
      quantity: Number(quantity) || 1,
      saldoSistema: systemBalance,
      fornecedor: fornecedorInfo,
      obs
    });

    handleClear();
  };

  return (
    <form className="item-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <h3>
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>{editingItem ? 'Editando Material' : 'Material / Insumo'}</span>
        </h3>
        <button type="button" className="btn-text" onClick={handleClear}>
          <i className="fa-solid fa-rotate-left"></i> Limpar
        </button>
      </div>

      {/* 🔍 Busca Rápida Preditiva por Nome / Fornecedor */}
      <MaterialSearchAutocomplete 
        onSelectMaterial={handleSelectMaterialFromSearch}
        initialValue={descricao}
      />

      {/* Cartão de Destaque com Fornecedor e Saldo Teórico */}
      {(fornecedorInfo || systemBalance !== null) && (
        <div style={{
          backgroundColor: 'var(--secondary-color)',
          border: '1px solid #bae6fd',
          borderRadius: 'var(--radius-md)',
          padding: '0.55rem 0.75rem',
          fontSize: '0.78rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}>
          {fornecedorInfo && (
            <span><strong>Fornecedor:</strong> {fornecedorInfo}</span>
          )}
          {systemBalance !== null && (
            <span style={{ color: '#0369a1', fontWeight: 700 }}>
              <i className="fa-solid fa-calculator"></i> Saldo no Sistema: {systemBalance} {unidade}
            </span>
          )}
        </div>
      )}

      {/* Botão para vincular EAN caso tenha lido um código avulso */}
      {lastScannedEan && descricao && !lookupDB[lastScannedEan] && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px dashed #f59e0b',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
            <i className="fa-solid fa-barcode"></i> EAN lido: <strong>{lastScannedEan}</strong>
          </span>
          <button
            type="button"
            onClick={handleLinkEan}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-link"></i> Vincular a este produto
          </button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="input-mat-desc">
          <i className="fa-solid fa-tag"></i> Descrição do Material {hasAutoFill && <span className="badge-auto"><i className="fa-solid fa-sparkles"></i> Auto</span>}
        </label>
        <input 
          id="input-mat-desc"
          type="text" 
          placeholder="Nome do produto ou peça..." 
          value={descricao} 
          onChange={e => setDescricao(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1.2 }}>
          <label htmlFor="input-mat-codigo">
            <i className="fa-solid fa-barcode"></i> Código / EAN
          </label>
          <input 
            id="input-mat-codigo"
            type="text" 
            placeholder="Cód. ERP ou EAN" 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: 0.9 }}>
          <label htmlFor="select-mat-unidade">Unidade</label>
          <select 
            id="select-mat-unidade"
            value={unidade} 
            onChange={e => setUnidade(e.target.value)}
            style={{ fontWeight: 700, color: 'var(--primary-dark)' }}
          >
            {UNIDADES.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="input-mat-loc">
          <i className="fa-solid fa-location-dot"></i> Localização / Prateleira
        </label>
        <input 
          id="input-mat-loc"
          type="text" 
          placeholder="Ex: Rua B - Prat. 02" 
          value={localizacao} 
          onChange={e => setLocalizacao(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="input-mat-qty">
          <i className="fa-solid fa-hashtag"></i> Quantidade Contada
        </label>
        <div className="form-row">
          <input 
            ref={qtyInputRef}
            id="input-mat-qty"
            type="number" 
            min="1" 
            style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }}
            value={quantity} 
            onChange={e => setQuantity(e.target.value)}
          />
        </div>
        
        {/* Pílulas de Incremento Rápido */}
        <div className="quick-qty-pills">
          <button type="button" className="btn-quick-qty" onClick={() => addQuickQty(1)}>+1</button>
          <button type="button" className="btn-quick-qty" onClick={() => addQuickQty(5)}>+5</button>
          <button type="button" className="btn-quick-qty" onClick={() => addQuickQty(10)}>+10</button>
          <button type="button" className="btn-quick-qty" onClick={() => addQuickQty(50)}>+50</button>
          <button type="button" className="btn-quick-qty" onClick={() => addQuickQty(100)}>+100</button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="input-mat-obs">
          <i className="fa-regular fa-comment"></i> Observação
        </label>
        <textarea 
          id="input-mat-obs"
          rows="1" 
          placeholder="Lote, fornecedor, avaria, detalhe..." 
          value={obs} 
          onChange={e => setObs(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-save-main">
        <i className={`fa-solid ${editingItem ? 'fa-check' : 'fa-plus'}`}></i>
        <span>{editingItem ? 'Salvar Alterações' : 'Adicionar ao Estoque Físico'}</span>
      </button>
    </form>
  );
};
