// Parser inteligente de códigos de barras para Aparelhos e Materiais

export const parseBarcode = (text, mode = 'aparelhos', lookupDB = {}, systemStock = {}) => {
  const clean = text.trim();
  
  if (mode === 'materiais') {
    // Modo Materiais: Detecta EAN ou código interno
    const eanRegex = /^\d{8,14}$/;
    if (eanRegex.test(clean)) {
      return {
        type: 'ean',
        ean: clean,
        descricao: lookupDB[clean] || '',
        message: lookupDB[clean] ? `✨ EAN identificado: ${lookupDB[clean]}` : 'Código de Barras EAN capturado'
      };
    }
    return {
      type: 'codigo',
      codigo: clean,
      descricao: lookupDB[clean] || '',
      message: 'Código de material lido'
    };
  }

  // Modo Aparelhos:
  // 1. Regra Patrimônio (ex: 035.03.232)
  const patrimonioRegex = /^\d{3}\.\d{2}\.\d{3}$/;
  
  // 2. Regra EAN (8 a 14 dígitos)
  const eanRegex = /^\d{8,14}$/;
  
  // 3. Regra Consul / Código Composto (ex: CRC08CBANAJJ6584955E3)
  const consulRegex = /^(CRC[A-Z0-9]{7})([A-Z0-9]{9})(.*)$/i;
  
  // 4. Regra Elgin - Série (começa com ARC)
  const elginSerieRegex = /^ARC\d+$/i;
  
  // 5. Regra Elgin - Modelo (começa com KVF, etc)
  const elginModeloRegex = /^KVF[A-Z0-9]+$/i;

  if (patrimonioRegex.test(clean)) {
    const sys = systemStock.byPatrimonio ? systemStock.byPatrimonio[clean.toUpperCase()] : null;
    return {
      type: 'patrimonio',
      patrimonio: clean,
      modelo: sys ? sys.material : '',
      serie: sys ? sys.serie : '',
      message: sys ? `✨ Patrimônio no Sistema: ${sys.material || ''}` : 'QR Code de Patrimônio lido!'
    };
  }

  if (consulRegex.test(clean)) {
    const match = clean.match(consulRegex);
    return {
      type: 'consul',
      modelo: match[1],
      serie: match[2],
      obs: match[3] ? `Lote: ${match[3]}` : '',
      message: 'Modelo e Série Consul identificados!'
    };
  }

  if (elginSerieRegex.test(clean)) {
    const sys = systemStock.bySerie ? systemStock.bySerie[clean.toUpperCase()] : null;
    return {
      type: 'serie',
      serie: clean,
      modelo: sys ? sys.material : '',
      patrimonio: sys ? sys.etiqueta : '',
      message: sys ? `✨ Série no Sistema: ${sys.material || ''}` : 'Série Elgin identificada!'
    };
  }

  if (elginModeloRegex.test(clean)) {
    return {
      type: 'modelo',
      modelo: clean,
      message: 'Modelo Elgin identificado!'
    };
  }

  if (eanRegex.test(clean)) {
    const modelFound = lookupDB[clean];
    return {
      type: 'ean',
      ean: clean,
      modelo: modelFound || '',
      message: modelFound ? `✨ EAN lido! Modelo "${modelFound}" preenchido!` : 'EAN lido!'
    };
  }

  return {
    type: 'generic',
    raw: clean,
    message: 'Código lido'
  };
};
