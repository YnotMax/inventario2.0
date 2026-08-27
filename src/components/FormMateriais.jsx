import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MaterialSearchAutocomplete } from './MaterialSearchAutocomplete';

const UNIDADES = ['UN', 'MT', 'KG', 'CX', 'PC', 'RL', 'LT', 'PAR', 'M2', 'M3'];

export const FormMateriais = ({ scannedData, onResetScanned }) => {
  const { 
    editingItem, 
    saveItem, 
    setEditingItem, 
    lookupDB, 
    linkEanToMaterial,
    getItemCountedStats,
    playDoubleBeep,
    triggerFlash
  } = useInventory();

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

  // Verificar se o item atual já foi contado
  const countedStats = useMemo(() => {
    return getItemCountedStats(codigo, descricao);
  }, [codigo, descricao, getItemCountedStats]);

  // Preencher quando o scanner lê código de barras
  useEffect(() => {
    if (scannedData) {
      const code = scannedData.ean || scannedData.codigo || scannedData.raw || '';
      if (code) {
        setCodigo(code);
        setLastScannedEan(code);
        
        // Se já existe no catálogo
        if (lookupDB && lookupDB[code]) {
          const descFound = lookupDB[code];
          setDescricao(descFound);
          setHasAutoFill(true);

          // Verificar se já foi contado e emitir alerta sonoro duplo
          const check = getItemCountedStats(code, descFound);
          if (check.isCounted) {
            playDoubleBeep();
            triggerFlash('info');
          }
        }
      }
      onResetScanned();
    }
  }, [scannedData, lookupDB, onResetScanned, getItemCountedStats, playDoubleBeep, triggerFlash]);

  // Ação ao selecionar produto no Autocomplete de Busca
  const handleSelectMaterialFromSearch = (mat) => {
    setDescricao(mat.nome || '');
    if (mat.codigo) setCodigo(mat.codigo);
    if (mat.unidade) setUnidade(mat.unidade);
    if (mat.quantidade !== undefined) setSystemBalance(mat.quantidade);
    if (mat.fornecedor) setFornecedorInfo(mat.fornecedor);
    setHasAutoFill(true);

    // Verificar se já foi contado
    const check = getItemCountedStats(mat.codigo, mat.nome);
    if (check.isCounted) {
      playDoubleBeep();
      triggerFlash('info');
    }

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

  // Salvar (com opção de somar ao existente ou criar novo)
  const handleSave = (mergeWithExisting = false) => {
    if (!codigo && !descricao) {
      alert('Por favor, preencha o código ou a descrição do material.');
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
    }, mergeWithExisting);

    handleClear();
  };

  return (
    <form className="form-card" onSubmit={(e) => { e.preventDefault(); handleSave(countedStats.isCounted && !editingItem); }}>
      <div className="form-header">
        <h3>
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>{editingItem ? 'Editando Material' : 'Material / Insumo'}</span>
        </h3>
        <button type="button" className="btn-clear-header" onClick={handleClear} title="Limpar formulário">
          <i className="fa-solid fa-rotate-left"></i>
          <span>Limpar</span>
        </button>
      </div>

      {/* 🔍 Busca Rápida Preditiva por Nome / Fornecedor */}
      <MaterialSearchAutocomplete 
        onSelectMaterial={handleSelectMaterialFromSearch}
        initialValue={descricao}
      />

      {/* 📦 CARD DE ALERTA INFORMATIVO: ITEM JÁ CONTADO */}
      {countedStats.isCounted && !editingItem && (
        <div className="alert-box-counted">
          <div className="alert-box-top">
            <span className="alert-box-title">
              <i className="fa-solid fa-circle-check"></i> Item Já Registrado no Físico!
            </span>
            <span className="alert-box-badge">
              Total Físico: {countedStats.totalCounted} {unidade}
            </span>
          </div>

          <div className="alert-box-details">
            {countedStats.locations.length > 0 && (
              <span><strong>Locais já bipados:</strong> {countedStats.locations.join(' | ')}</span>
            )}
            {systemBalance !== null && (
              <span>
                <strong>Saldo ERP:</strong> {systemBalance} {unidade} (Diferença: {countedStats.totalCounted - systemBalance > 0 ? `+${countedStats.totalCounted - systemBalance}` : countedStats.totalCounted - systemBalance} {unidade})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
            <button 
              type="button" 
              className="btn-skip-next"
              onClick={handleClear}
              title="Limpar e passar para o próximo item"
            >
              <i className="fa-solid fa-forward-step"></i>
              <span>Passar para o Próximo Item</span>
            </button>
          </div>
        </div>
      )}

      {/* Cartão de Destaque com Fornecedor e Saldo Teórico */}
      {(fornecedorInfo || systemBalance !== null) && !countedStats.isCounted && (
        <div className="info-badge-card">
          {fornecedorInfo && (
            <span><strong>Fornecedor:</strong> {fornecedorInfo}</span>
          )}
          {systemBalance !== null && (
            <span className="balance-highlight">
              <i className="fa-solid fa-calculator"></i> Saldo no Sistema: {systemBalance} {unidade}
            </span>
          )}
        </div>
      )}

      {/* Botão para vincular EAN caso tenha lido um código avulso */}
      {lastScannedEan && descricao && (!lookupDB || !lookupDB[lastScannedEan]) && (
        <div className="link-ean-card">
          <span>
            <i className="fa-solid fa-barcode"></i> EAN lido: <strong>{lastScannedEan}</strong>
          </span>
          <button type="button" onClick={handleLinkEan} className="btn-link-ean">
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
            style={{ fontWeight: 700, color: '#0369a1' }}
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
          <i className="fa-solid fa-hashtag"></i> Quantidade Contada Nesta Etapa
        </label>
        <div className="form-row">
          <input 
            ref={qtyInputRef}
            id="input-mat-qty"
            type="number" 
            min="1" 
            style={{ flex: 1, fontSize: '1.15rem', fontWeight: 800, textAlign: 'center' }}
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

      {/* BOTÕES INTELIGENTES DE SALVAR */}
      {countedStats.isCounted && !editingItem ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
          <button 
            type="button" 
            className="btn-save-main" 
            onClick={() => handleSave(true)}
            style={{ backgroundColor: '#2563eb' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Somar ao Existente (+{quantity}) ➔ Total: {countedStats.totalCounted + (Number(quantity) || 1)} {unidade}</span>
          </button>

          <button 
            type="button" 
            className="btn-save-secondary"
            onClick={() => handleSave(false)}
          >
            <i className="fa-solid fa-file-circle-plus"></i>
            <span>Salvar como Novo Registro Separado</span>
          </button>
        </div>
      ) : (
        <button type="submit" className="btn-save-main">
          <i className={`fa-solid ${editingItem ? 'fa-check' : 'fa-plus'}`}></i>
          <span>{editingItem ? 'Salvar Alterações' : 'Adicionar ao Estoque Físico'}</span>
        </button>
      )}
    </form>
  );
};
