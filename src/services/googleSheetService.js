// Serviço de Comunicação com Google Sheets Webhook

export const googleSheetService = {
  // Envia item para a planilha via Webhook (modo no-cors)
  syncItem: async (webhookUrl, item, isUpdate = false) => {
    if (!webhookUrl) throw new Error('URL do Webhook não configurada');

    const payload = {
      ...item,
      isUpdate: isUpdate
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return response;
  },

  // Lê base de dados da planilha em tempo real
  fetchSheetData: async (webhookUrl) => {
    if (!webhookUrl) return null;

    try {
      const response = await fetch(webhookUrl);
      if (!response.ok) return null;
      const data = await response.json();
      return data;
    } catch (e) {
      console.warn('[Google Sheets] Erro ao buscar dados online:', e);
      return null;
    }
  }
};
