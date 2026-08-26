/**
 * ===================================================================
 * GOOGLE APPS SCRIPT - INTEGRAÃ‡ÃƒO LEITOR DE INVENTÃRIO (WEBHOOK)
 * ===================================================================
 * 
 * Totalmente DinÃ¢mico:
 * - VocÃª pode mudar as colunas de lugar em qualquer uma das abas!
 * - O script localiza as colunas pelo nome do cabeÃ§alho automaticamente.
 * 
 * Abas Suportadas:
 * - "estoque fisico": Onde o aplicativo salva as contagens.
 * - "estoque sistema aparelhos": Base cadastral do ERP/SAP para comparaÃ§Ã£o.
 * 
 * ===================================================================
 */

// FunÃ§Ã£o auxiliar para encontrar aba ignorando maiÃºsculas/minÃºsculas
function getSheetCaseInsensitive(ss, name) {
  var exact = ss.getSheetByName(name);
  if (exact) return exact;
  var sheets = ss.getSheets();
  var normTarget = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  for (var i = 0; i < sheets.length; i++) {
    var normSheet = sheets[i].getName().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (normSheet === normTarget) return sheets[i];
  }
  return null;
}

// 1. RECEBER DADOS DO CELULAR (SALVA NA ABA 'estoque fisico')
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetCaseInsensitive(ss, "estoque fisico") || ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Se a aba estiver vazia, cria os cabeÃ§alhos padrÃ£o
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["PatrimÃ´nio", "Modelo", "NÂº SÃ©rie", "EAN", "ObservaÃ§Ã£o", "Quantidade", "Data/Hora"]);
    }
    
    // LÃª os cabeÃ§alhos da primeira linha para saber a posiÃ§Ã£o exata de cada coluna
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0];
    var headerNormalized = headers.map(function(h) { 
      return String(h).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Âº]/g, "o").replace(/[Âª]/g, "a").trim(); 
    });
    
    var colPat = headerNormalized.indexOf("patrimonio") !== -1 ? headerNormalized.indexOf("patrimonio") : headerNormalized.indexOf("etiqueta");
    var colMod = headerNormalized.indexOf("modelo") !== -1 ? headerNormalized.indexOf("modelo") : headerNormalized.indexOf("material");
    var colSer = headerNormalized.indexOf("no serie") !== -1 ? headerNormalized.indexOf("no serie") : (headerNormalized.indexOf("serie") !== -1 ? headerNormalized.indexOf("serie") : headerNormalized.indexOf("numeroserie"));
    var colEan = headerNormalized.indexOf("ean") !== -1 ? headerNormalized.indexOf("ean") : headerNormalized.indexOf("cod. barras");
    var colObs = headerNormalized.indexOf("observacao") !== -1 ? headerNormalized.indexOf("observacao") : headerNormalized.indexOf("obs");
    var colQtd = headerNormalized.indexOf("quantidade") !== -1 ? headerNormalized.indexOf("quantidade") : headerNormalized.indexOf("qtd");
    var colDat = headerNormalized.indexOf("data/hora") !== -1 ? headerNormalized.indexOf("data/hora") : (headerNormalized.indexOf("data") !== -1 ? headerNormalized.indexOf("data") : headerNormalized.indexOf("timestamp"));

    var numCols = Math.max(headers.length, 7);
    
    // Monta a linha de dados na ordem correta das colunas
    var newRow = new Array(numCols).fill("");
    if (colPat !== -1) newRow[colPat] = data.patrimonio || '';
    if (colMod !== -1) newRow[colMod] = data.modelo || '';
    if (colSer !== -1) newRow[colSer] = data.serie || '';
    if (colEan !== -1) newRow[colEan] = data.ean || '';
    if (colObs !== -1) newRow[colObs] = data.obs || '';
    if (colQtd !== -1) newRow[colQtd] = data.quantity || 1;
    if (colDat !== -1) newRow[colDat] = data.timestamp || new Date().toLocaleString('pt-BR');
    
    // ---------------------------------------------------------------
    // MODO ATUALIZAÃ‡ÃƒO: Busca a linha existente pelo timestamp e atualiza
    // ---------------------------------------------------------------
    if (data.isUpdate && data.timestamp) {
      var allData = sheet.getDataRange().getValues();
      var timestampCol = colDat !== -1 ? colDat : 6; // fallback coluna G
      var foundRow = -1;
      
      for (var r = 1; r < allData.length; r++) {
        var cellTimestamp = String(allData[r][timestampCol] || '').trim();
        if (cellTimestamp === String(data.timestamp).trim()) {
          foundRow = r + 1; // Converte de 0-index para 1-index do Sheets
          break;
        }
      }
      
      if (foundRow > 1) {
        // Atualiza a linha existente sem inserir nova
        sheet.getRange(foundRow, 1, 1, numCols).setValues([newRow]);
        
        return ContentService
          .createTextOutput(JSON.stringify({ "status": "sucesso", "acao": "atualizado", "linha": foundRow }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Se nÃ£o encontrou a linha original, continua abaixo e insere como nova
    }
    
    // ---------------------------------------------------------------
    // MODO INSERÃ‡ÃƒO: Insere no final da aba (banco de dados limpo)
    // ---------------------------------------------------------------
    if (colPat !== -1 || colSer !== -1 || colMod !== -1) {
      sheet.appendRow(newRow);
    } else {
      // Fallback padrÃ£o se nÃ£o houver cabeÃ§alhos reconhecidos
      sheet.appendRow([
        data.patrimonio || '',
        data.modelo || '',
        data.serie || '',
        data.ean || '',
        data.obs || '',
        data.quantity || 1,
        data.timestamp || new Date().toLocaleString('pt-BR')
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "sucesso", "acao": "inserido" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "erro", "detalhe": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. ENVIAR DADOS PARA O CELULAR (LÃŠ AS DUAS ABAS DINAMICAMENTE)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // -------------------------------------------------------------
    // A. LER ABA 'estoque fisico'
    // -------------------------------------------------------------
    var sheetFisico = getSheetCaseInsensitive(ss, "estoque fisico") || ss.getActiveSheet();
    var rowsFisico = sheetFisico.getDataRange().getValues();
    var itensFisicos = [];
    
    if (rowsFisico.length > 1) {
      var headerF = rowsFisico[0].map(function(h) { 
        return String(h).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Âº]/g, "o").replace(/[Âª]/g, "a").trim(); 
      });
      
      var colFPat = headerF.indexOf("patrimonio") !== -1 ? headerF.indexOf("patrimonio") : 0;
      var colFMod = headerF.indexOf("modelo") !== -1 ? headerF.indexOf("modelo") : 1;
      // BUG FIX: expressÃ£o ternÃ¡ria anterior calculava o indexOf duas vezes desnecessariamente
      var _colFSerIdx1 = headerF.indexOf("no serie");
      var _colFSerIdx2 = headerF.indexOf("serie");
      var colFSer = _colFSerIdx1 !== -1 ? _colFSerIdx1 : (_colFSerIdx2 !== -1 ? _colFSerIdx2 : 2);
      var colFEan = headerF.indexOf("ean") !== -1 ? headerF.indexOf("ean") : 3;

      for (var i = 1; i < rowsFisico.length; i++) {
        var rowF = rowsFisico[i];
        var pat = String(rowF[colFPat] || '').trim();
        var mod = String(rowF[colFMod] || '').trim();
        var ser = String(rowF[colFSer] || '').trim();
        var ean = String(rowF[colFEan] || '').trim();

        if (pat || mod || ser || ean) {
          itensFisicos.push({
            patrimonio: pat,
            modelo: mod,
            serie: ser,
            ean: ean
          });
        }
      }
    }
    
    // -------------------------------------------------------------
    // B. LER ABA 'estoque sistema aparelhos'
    // -------------------------------------------------------------
    var sheetSistema = getSheetCaseInsensitive(ss, "estoque sistema aparelhos");
    var itensSistema = [];
    
    if (sheetSistema) {
      var rowsSistema = sheetSistema.getDataRange().getValues();
      if (rowsSistema.length > 1) {
        var headerS = rowsSistema[0].map(function(h) { 
          return String(h).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Âº]/g, "o").replace(/[Âª]/g, "a").trim(); 
        });
        
        var colMaterial = headerS.indexOf("material");
        var colEtiqueta = headerS.indexOf("ultimaetiqueta") !== -1 ? headerS.indexOf("ultimaetiqueta") : (headerS.indexOf("etiqueta") !== -1 ? headerS.indexOf("etiqueta") : headerS.indexOf("patrimonio"));
        var colSerie = headerS.indexOf("numeroserie") !== -1 ? headerS.indexOf("numeroserie") : headerS.indexOf("serie");
        
        for (var j = 1; j < rowsSistema.length; j++) {
          var rowS = rowsSistema[j];
          var mat = colMaterial !== -1 ? String(rowS[colMaterial] || '').trim() : '';
          var etq = colEtiqueta !== -1 ? String(rowS[colEtiqueta] || '').trim() : '';
          var serS = colSerie !== -1 ? String(rowS[colSerie] || '').trim() : '';
          
          if (etq || serS || mat) {
            itensSistema.push({
              material: mat,
              etiqueta: etq,
              serie: serS
            });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // C. LER ABA 'estoque sistema materiais'
    // -------------------------------------------------------------
    var sheetMateriais = getSheetCaseInsensitive(ss, "estoque sistema materiais");
    var itensMateriais = [];

    if (sheetMateriais) {
      var rowsMat = sheetMateriais.getDataRange().getValues();
      if (rowsMat.length > 1) {
        var headerM = rowsMat[0].map(function(h) { 
          return String(h).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Âº]/g, "o").replace(/[Âª]/g, "a").trim(); 
        });

        var colNome = headerM.indexOf("nome do produto") !== -1 ? headerM.indexOf("nome do produto") : headerM.indexOf("descricao");
        var colCod = headerM.indexOf("codigo");
        var colEan = headerM.indexOf("codigo ean") !== -1 ? headerM.indexOf("codigo ean") : headerM.indexOf("ean");
        var colUni = headerM.indexOf("unidade");
        var colQtd = headerM.indexOf("quantidade") !== -1 ? headerM.indexOf("quantidade") : headerM.indexOf("saldo");

        for (var m = 1; m < rowsMat.length; m++) {
          var rowM = rowsMat[m];
          var nome = colNome !== -1 ? String(rowM[colNome] || '').trim() : '';
          var cod = colCod !== -1 ? String(rowM[colCod] || '').trim() : '';
          var eanM = colEan !== -1 ? String(rowM[colEan] || '').trim() : '';
          var uni = colUni !== -1 ? String(rowM[colUni] || '').trim() : 'UN';
          var qtd = colQtd !== -1 ? (Number(rowM[colQtd]) || 0) : 0;

          if (nome || cod || eanM) {
            itensMateriais.push({
              nome: nome,
              codigo: cod,
              ean: eanM,
              unidade: uni,
              quantidade: qtd
            });
          }
        }
      }
    }
    
    // -------------------------------------------------------------
    // D. LER ABA 'estoque fisico materiais'
    // -------------------------------------------------------------
    var sheetFisicoMat = getSheetCaseInsensitive(ss, "estoque fisico materiais");
    var itensFisicosMat = [];

    if (sheetFisicoMat) {
      var rowsFMat = sheetFisicoMat.getDataRange().getValues();
      if (rowsFMat.length > 1) {
        var headerFM = rowsFMat[0].map(function(h) { 
          return String(h).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Âº]/g, "o").replace(/[Âª]/g, "a").trim(); 
        });

        var colFMCod = headerFM.indexOf("codigo") !== -1 ? headerFM.indexOf("codigo") : 0;
        var colFMDes = headerFM.indexOf("descricao") !== -1 ? headerFM.indexOf("descricao") : 1;
        var colFMUni = headerFM.indexOf("unidade") !== -1 ? headerFM.indexOf("unidade") : 2;
        var colFMLoc = headerFM.indexOf("localizacao") !== -1 ? headerFM.indexOf("localizacao") : 3;
        var colFMQtd = headerFM.indexOf("quantidade") !== -1 ? headerFM.indexOf("quantidade") : 4;
        var colFMObs = headerFM.indexOf("observacao") !== -1 ? headerFM.indexOf("observacao") : 5;
        var colFMDat = headerFM.indexOf("data/hora") !== -1 ? headerFM.indexOf("data/hora") : 6;

        for (var k = 1; k < rowsFMat.length; k++) {
          var rowFM = rowsFMat[k];
          var codM = colFMCod !== -1 ? String(rowFM[colFMCod] || '').trim() : '';
          var desM = colFMDes !== -1 ? String(rowFM[colFMDes] || '').trim() : '';
          var uniM = colFMUni !== -1 ? String(rowFM[colFMUni] || '').trim() : 'UN';
          var locM = colFMLoc !== -1 ? String(rowFM[colFMLoc] || '').trim() : '';
          var qtdM = colFMQtd !== -1 ? (Number(rowFM[colFMQtd]) || 1) : 1;
          var obsM = colFMObs !== -1 ? String(rowFM[colFMObs] || '').trim() : '';
          var datM = colFMDat !== -1 ? String(rowFM[colFMDat] || '').trim() : '';

          if (codM || desM) {
            itensFisicosMat.push({
              id: 'sheet_mat_' + k,
              codigo: codM,
              descricao: desM,
              unidade: uniM,
              localizacao: locM,
              quantity: qtdM,
              obs: obsM,
              timestamp: datM,
              synced: true,
              mode: 'materiais'
            });
          }
        }
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        "status": "sucesso",
        "total": itensFisicos.length,
        "data": itensFisicos,
        "totalSistema": itensSistema.length,
        "sistema": itensSistema,
        "totalMateriais": itensMateriais.length,
        "materiais": itensMateriais,
        "totalFisicoMateriais": itensFisicosMat.length,
        "fisicoMateriais": itensFisicosMat
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        "status": "erro",
        "detalhe": error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
