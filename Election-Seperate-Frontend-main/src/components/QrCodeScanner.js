import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function QRCodeScanner({ onScanSuccess }) {
  const scannerRef = useRef(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  
  // Generate a unique ID for each instance to prevent collisions
  const regionId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;

  useEffect(() => {
    // 1. Cleanup any existing DOM content to prevent "double views" or initialization errors
    const container = document.getElementById(regionId);
    if (container) {
      container.innerHTML = "";
    }

    // 2. Initialize Scanner
    // The library requires the element to exist in the DOM before initialization
    const scanner = new Html5QrcodeScanner(
      regionId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scannerRef.current = scanner;

    const onScanSuccessCallback = (decodedText) => {
      console.log(`Scanned Data: ${decodedText}`);
      onScanSuccess(decodedText);
    };

    const onScanFailure = (error) => {
      // console.warn(`Code scan error = ${error}`);
    };

    // Render the scanner
    scanner.render(onScanSuccessCallback, onScanFailure);
    setIsScannerRunning(true);

    // 3. Cleanup Function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
        setIsScannerRunning(false);
      }
    };
  }, [onScanSuccess, regionId]);

  return (
    <div style={{ width: '100%' }}>
      {/* Dynamic ID container */}
      <div id={regionId}></div>
    </div>
  );
}

export default QRCodeScanner;