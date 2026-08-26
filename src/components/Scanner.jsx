import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useInventory } from '../context/InventoryContext';
import { parseBarcode } from '../services/barcodeParser';

export const Scanner = ({ onCodeDetected }) => {
  const { mode, lookupDB, systemStock, scannedHistory, showFeedbackMessage, setDuplicateAlert, playWarning } = useInventory();
  
  const [isScanning, setIsScanning] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  
  const html5QrRef = useRef(null);
  const lastScannedTextRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const isCoolingDownRef = useRef(false);

  // Inicializar câmeras disponíveis
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        const rearOnly = devices.filter(d => {
          const l = (d.label || '').toLowerCase();
          return !l.includes('front') && !l.includes('user') && !l.includes('selfie');
        });
        setCameras(rearOnly.length ? rearOnly : devices);
      }
    }).catch(e => console.warn('Câmeras:', e));

    return () => {
      if (html5QrRef.current && isScanning) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = (decodedText) => {
    if (isCoolingDownRef.current) return;

    const now = Date.now();
    if (decodedText === lastScannedTextRef.current && (now - lastScanTimeRef.current) < 1600) {
      return;
    }

    lastScannedTextRef.current = decodedText;
    lastScanTimeRef.current = now;

    // Parser do código
    const parsed = parseBarcode(decodedText, mode, lookupDB, systemStock);
    
    // Verificação de Duplicidade (Modo Aparelhos)
    if (mode === 'aparelhos') {
      const pat = parsed.patrimonio;
      const ser = parsed.serie;
      let dupMsg = null;

      if (pat && scannedHistory.patrimonios[pat.toUpperCase().trim()]) {
        dupMsg = `Patrimônio ${pat} já foi bipado anteriormente!`;
      } else if (ser && scannedHistory.series[ser.toUpperCase().trim()]) {
        dupMsg = `Nº de Série ${ser} já foi bipado anteriormente!`;
      }

      if (dupMsg) {
        playWarning();
        setDuplicateAlert({
          title: '⚠️ DUPLICIDADE DETECTADA',
          desc: dupMsg
        });
      }
    }

    onCodeDetected(parsed);
    showFeedbackMessage(parsed.message || 'Código capturado!');

    // Cooldown de 1.8 segundos
    isCoolingDownRef.current = true;
    setTimeout(() => {
      isCoolingDownRef.current = false;
    }, 1800);
  };

  const startScanner = async () => {
    try {
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode('reader-video');
      }

      const cameraId = cameras[activeCamIndex]?.id;
      const config = {
        fps: 20,
        qrbox: { width: 300, height: 160 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39
        ]
      };

      await html5QrRef.current.start(
        cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' },
        config,
        handleScanSuccess,
        () => {} // scan failure frame callback
      );

      setIsScanning(true);

      // Checar suporte a lanterna
      setTimeout(() => {
        const videoEl = document.querySelector('#reader-video video');
        if (videoEl && videoEl.srcObject) {
          const track = videoEl.srcObject.getVideoTracks()[0];
          if (track && track.getCapabilities) {
            const caps = track.getCapabilities();
            setHasTorch(!!caps.torch);
          }
        }
      }, 500);

    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current && isScanning) {
      try {
        await html5QrRef.current.stop();
        setIsScanning(false);
        setIsTorchOn(false);
      } catch (e) {
        console.error('Erro ao parar câmera:', e);
      }
    }
  };

  const toggleTorch = async () => {
    if (!isScanning) return;
    try {
      const videoEl = document.querySelector('#reader-video video');
      if (videoEl && videoEl.srcObject) {
        const track = videoEl.srcObject.getVideoTracks()[0];
        if (track) {
          const next = !isTorchOn;
          await track.applyConstraints({ advanced: [{ torch: next }] });
          setIsTorchOn(next);
        }
      }
    } catch (e) {
      console.warn('Erro ao alternar lanterna:', e);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    await stopScanner();
    const nextIdx = (activeCamIndex + 1) % cameras.length;
    setActiveCamIndex(nextIdx);
    setTimeout(startScanner, 200);
  };

  return (
    <div className="scanner-container">
      <div className="reader-box">
        <div id="reader-video"></div>
      </div>

      <div className="scanner-controls">
        <button 
          className={`btn-main-scanner ${isScanning ? 'scanning' : ''}`}
          onClick={isScanning ? stopScanner : startScanner}
        >
          <i className={`fa-solid ${isScanning ? 'fa-stop' : 'fa-camera'}`}></i>
          <span>{isScanning ? 'Parar Câmera' : 'Iniciar Câmera'}</span>
        </button>

        <button 
          className={`btn-tool ${isTorchOn ? 'active' : ''}`}
          onClick={toggleTorch}
          disabled={!isScanning}
          title="Lanterna"
        >
          <i className="fa-solid fa-bolt"></i> Flash
        </button>

        <button 
          className="btn-tool"
          onClick={switchCamera}
          disabled={cameras.length <= 1}
          title="Alternar Câmera"
        >
          <i className="fa-solid fa-camera-rotate"></i> Câmera
        </button>
      </div>
    </div>
  );
};
