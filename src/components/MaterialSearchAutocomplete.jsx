import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';

export const MaterialSearchAutocomplete = ({ onSelectMaterial, initialValue = '' }) => {
  const { materiaisCatalog = [], getItemCountedStats } = useInventory();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtragem rápida inteligente (múltiplas palavras, ignorando acentos)
  const suggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!term || term.length < 2) return [];

    const words = term.split(/\s+/);

    return (materiaisCatalog || []).filter(mat => {
      const nomeNorm = String(mat?.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const codNorm = String(mat?.codigo || '').toLowerCase();
      const eanNorm = String(mat?.ean || '').toLowerCase();
      const fornNorm = String(mat?.fornecedor || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const fullText = `${nomeNorm} ${codNorm} ${eanNorm} ${fornNorm}`;

      return words.every(w => fullText.includes(w));
    }).slice(0, 15);
  }, [searchTerm, materiaisCatalog]);

  const handleSelect = (mat) => {
    setSearchTerm(mat.nome);
    setIsOpen(false);
    onSelectMaterial(mat);
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="autocomplete-wrapper">
      <div className="form-group">
        <label htmlFor="material-autocomplete-input" className="autocomplete-label">
          <span><i className="fa-solid fa-magnifying-glass"></i> Busca Rápida no Catálogo ERP</span>
          {materiaisCatalog.length > 0 && (
            <span className="catalog-count-tag">
              {materiaisCatalog.length.toLocaleString('pt-BR')} itens cadastrados
            </span>
          )}
        </label>
        
        <div className="autocomplete-input-box">
          <input
            id="material-autocomplete-input"
            type="text"
            className="autocomplete-input"
            placeholder="Digite nome (ex: silicone, fita, pincel), cód. ou fornecedor..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (searchTerm.trim().length >= 2) setIsOpen(true);
            }}
          />
          {searchTerm && (
            <button
              type="button"
              className="autocomplete-clear-btn"
              onClick={handleClear}
              title="Limpar busca"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Lista Suspensa de Sugestões */}
      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown">
          {suggestions.map((mat, idx) => {
            const countedStats = getItemCountedStats(mat?.codigo, mat?.nome);

            return (
              <li
                key={idx}
                onClick={() => handleSelect(mat)}
                className={`autocomplete-dropdown-item ${countedStats.isCounted ? 'is-counted' : ''}`}
              >
                <div className="dropdown-item-top">
                  <strong className="dropdown-item-name">
                    {mat.nome}
                  </strong>
                  <span className="dropdown-item-unit">
                    {mat.unidade || 'UN'}
                  </span>
                </div>

                {/* Selo de Já Contado em Destaque */}
                {countedStats.isCounted && (
                  <div className="counted-indicator-row">
                    <span className="badge-counted-tag">
                      <i className="fa-solid fa-circle-check"></i> Já Contado: {countedStats.totalCounted} {mat.unidade || 'UN'}
                    </span>
                    {countedStats.countRecords > 1 && (
                      <span className="counted-records-text">
                        ({countedStats.countRecords} registros somados)
                      </span>
                    )}
                  </div>
                )}

                <div className="dropdown-item-meta">
                  {mat.codigo && <span><strong>Cód:</strong> {mat.codigo}</span>}
                  {mat.fornecedor && <span><strong>Forn:</strong> {mat.fornecedor}</span>}
                  {mat.ean && <span><i className="fa-solid fa-barcode"></i> {mat.ean}</span>}
                  {mat.quantidade !== undefined && mat.quantidade !== null && (
                    <span className="erp-stock-highlight">
                      <strong>ERP:</strong> {mat.quantidade} {mat.unidade || 'UN'}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && searchTerm.trim().length >= 2 && suggestions.length === 0 && (
        <div className="autocomplete-empty-tip">
          <i className="fa-solid fa-info-circle"></i>
          <span>Nenhum material encontrado com "{searchTerm}". Você pode cadastrar manualmente nos campos abaixo.</span>
        </div>
      )}
    </div>
  );
};
