import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';

export const MaterialSearchAutocomplete = ({ onSelectMaterial, initialValue = '' }) => {
  const { materiaisCatalog } = useInventory();
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

    return materiaisCatalog.filter(mat => {
      const nomeNorm = String(mat.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const codNorm = String(mat.codigo || '').toLowerCase();
      const eanNorm = String(mat.ean || '').toLowerCase();
      const fornNorm = String(mat.fornecedor || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const fullText = `${nomeNorm} ${codNorm} ${eanNorm} ${fornNorm}`;

      // Todas as palavras digitadas devem estar presentes
      return words.every(w => fullText.includes(w));
    }).slice(0, 15); // Limitar a 15 melhores resultados para performance
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
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div className="form-group">
        <label htmlFor="material-autocomplete-input" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><i className="fa-solid fa-magnifying-glass"></i> Busca Rápida no Catálogo ERP</span>
          {materiaisCatalog.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
              {materiaisCatalog.length} itens cadastrados
            </span>
          )}
        </label>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="material-autocomplete-input"
            type="text"
            placeholder="Digite nome (ex: sensor, tubo), fornecedor ou código..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (searchTerm.trim().length >= 2) setIsOpen(true);
            }}
            style={{ paddingRight: '2rem' }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '0.6rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Lista Suspensa de Sugestões */}
      {isOpen && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 200,
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--primary-light)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '260px',
          overflowY: 'auto',
          listStyle: 'none',
          marginTop: '4px',
          padding: '4px'
        }}>
          {suggestions.map((mat, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(mat)}
              style={{
                padding: '0.65rem 0.8rem',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-color)' }}>
                  {mat.nome}
                </strong>
                <span style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap'
                }}>
                  {mat.unidade || 'UN'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-light)', flexWrap: 'wrap' }}>
                {mat.codigo && <span><strong>Cód:</strong> {mat.codigo}</span>}
                {mat.fornecedor && <span><strong>Forn:</strong> {mat.fornecedor}</span>}
                {mat.ean && <span><i className="fa-solid fa-barcode"></i> {mat.ean}</span>}
                {mat.quantidade !== undefined && mat.quantidade !== null && (
                  <span style={{ color: '#0369a1', fontWeight: 600 }}>
                    <strong>Sistema:</strong> {mat.quantidade} {mat.unidade || 'UN'}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && searchTerm.trim().length >= 2 && suggestions.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 200,
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          padding: '0.8rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-light)',
          marginTop: '4px'
        }}>
          Nenhum material encontrado com "{searchTerm}". Você pode digitar os dados manualmente abaixo.
        </div>
      )}
    </div>
  );
};
