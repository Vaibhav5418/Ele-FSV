import React, { useEffect, useState } from 'react';

const PwaInstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Don't show again if already dismissed this session
        const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
        if (dismissed) return;

        const handler = (e) => {
            e.preventDefault(); // Prevent the mini-infobar
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
        setDeferredPrompt(null);
        setShowBanner(false);
        sessionStorage.setItem('pwa-banner-dismissed', 'true');
    };

    const handleDismiss = () => {
        setShowBanner(false);
        sessionStorage.setItem('pwa-banner-dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <>
            <style>{`
        @keyframes pwa-slide-in {
          from { opacity: 0; transform: translate(-50%, 20px) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, 0) scale(1);    }
        }

        .pwa-banner {
          position: fixed;
          top: auto;
          bottom: max(20px, env(safe-area-inset-bottom));
          left: 50%;
          transform: translate(-50%, 0);
          z-index: 99999;
          width: 360px;
          max-width: calc(100vw - 32px);
          background: linear-gradient(135deg, #6a4fcf 0%, #8b45cc 60%, #a044c8 100%);
          border-radius: 16px;
          padding: 18px 20px 16px 20px;
          box-shadow: 0 8px 32px rgba(106, 79, 207, 0.45);
          animation: pwa-slide-in 0.35s ease forwards;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          color: #fff;
        }

        .pwa-banner-close {
          position: absolute;
          top: 12px;
          right: 14px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.75);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.2s;
        }
        .pwa-banner-close:hover { color: #fff; }

        .pwa-banner-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
          padding-right: 28px;
        }

        .pwa-banner-icon {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.18);
          border-radius: 10px;
        }

        .pwa-banner-title {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .pwa-banner-subtitle {
          font-size: 12.5px;
          color: rgba(255,255,255,0.82);
          margin: 0 0 14px 0;
          line-height: 1.55;
        }

        .pwa-banner-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pwa-btn-install {
          background: #fff;
          color: #6a4fcf;
          border: none;
          border-radius: 8px;
          padding: 8px 22px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .pwa-btn-install:hover {
          background: #f0ecff;
          transform: scale(1.03);
        }

        .pwa-btn-notnow {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.85);
          font-size: 13px;
          cursor: pointer;
          padding: 8px 4px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .pwa-btn-notnow:hover { color: #fff; }
      `}</style>

            <div className="pwa-banner" role="dialog" aria-label="Install app banner">
                {/* Close ✕ */}
                <button
                    className="pwa-banner-close"
                    onClick={handleDismiss}
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Icon + Title */}
                <div className="pwa-banner-header">
                    <div className="pwa-banner-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L7 11H10V4H14V11H17L12 16Z" fill="white" />
                            <path d="M5 18H19V20H5V18Z" fill="white" />
                        </svg>
                    </div>
                    <p className="pwa-banner-title">Install VMukti FSV</p>
                </div>

                {/* Subtitle */}
                <p className="pwa-banner-subtitle">
                    Install our app for faster access and offline support.
                </p>

                {/* Actions */}
                <div className="pwa-banner-actions">
                    <button className="pwa-btn-install" onClick={handleInstall}>
                        Install
                    </button>
                    <button className="pwa-btn-notnow" onClick={handleDismiss}>
                        Not now
                    </button>
                </div>
            </div>
        </>
    );
};

export default PwaInstallBanner;
