/**
 * Kolfex Solana Wallet Manager
 * Supports Phantom, Solflare, Backpack, and OKX Wallet
 */
(function() {
  'use strict';

  const WALLETS = [
    {
      id: 'phantom',
      name: 'Phantom',
      icon: `<svg viewBox="0 0 128 128" class="size-7" fill="none"><rect width="128" height="128" rx="28" fill="#AB9FF2"/><path d="M110.5 64c0 24.58-19.92 44.5-44.5 44.5-12.82 0-24.38-5.41-32.53-14.1l17.75-24.96c2.58-3.63 7.82-3.89 10.74-.53l12.72 14.61c1.55 1.78 4.3 1.83 5.92.11 7.42-7.88 12.01-18.49 12.01-30.13 0-4.66-.73-9.15-2.08-13.37L103.85 49c4.27 4.54 6.65 10.37 6.65 15z" fill="#FFF"/><circle cx="51" cy="53" r="6" fill="#4E44CE"/><circle cx="77" cy="53" r="6" fill="#4E44CE"/></svg>`,
      getProvider: () => window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null),
      downloadUrl: 'https://phantom.app/download',
      description: 'The premier Solana wallet'
    },
    {
      id: 'solflare',
      name: 'Solflare',
      icon: `<svg viewBox="0 0 128 128" class="size-7" fill="none"><rect width="128" height="128" rx="28" fill="#1C1827"/><path d="M64 24l35.6 35.6-35.6 35.6-35.6-35.6L64 24z" fill="#FC842C"/><path d="M64 38l21.6 21.6-21.6 21.6-21.6-21.6L64 38z" fill="#FEAC44"/></svg>`,
      getProvider: () => window.solflare?.isSolflare ? window.solflare : (window.solflare || null),
      downloadUrl: 'https://solflare.com/download',
      description: 'Popular Solana web & mobile wallet'
    },
    {
      id: 'backpack',
      name: 'Backpack',
      icon: `<svg viewBox="0 0 128 128" class="size-7" fill="none"><rect width="128" height="128" rx="28" fill="#E33E38"/><path d="M40 38h48v52H40V38z" fill="#FFF" rx="8"/><circle cx="54" cy="52" r="5" fill="#E33E38"/><circle cx="74" cy="52" r="5" fill="#E33E38"/></svg>`,
      getProvider: () => window.backpack?.isBackpack ? window.backpack : null,
      downloadUrl: 'https://backpack.app/download',
      description: 'xNFT and Solana wallet'
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      icon: `<svg viewBox="0 0 128 128" class="size-7" fill="none"><rect width="128" height="128" rx="28" fill="#000"/><rect x="36" y="36" width="24" height="24" rx="4" fill="#FFF"/><rect x="68" y="36" width="24" height="24" rx="4" fill="#FFF"/><rect x="52" y="52" width="24" height="24" rx="4" fill="#FFF"/><rect x="36" y="68" width="24" height="24" rx="4" fill="#FFF"/><rect x="68" y="68" width="24" height="24" rx="4" fill="#FFF"/></svg>`,
      getProvider: () => window.okxwallet?.solana || null,
      downloadUrl: 'https://www.okx.com/web3',
      description: 'Multi-chain Web3 wallet'
    }
  ];

  let currentWallet = null;
  let currentAddress = null;

  // Restore stored session
  try {
    const saved = localStorage.getItem('kolfex_solana_wallet');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.address) {
        currentAddress = parsed.address;
        currentWallet = parsed.walletId;
      }
    }
  } catch (e) {}

  function shorten(addr) {
    if (!addr) return '';
    return addr.slice(0, 4) + '...' + addr.slice(-4);
  }

  function updateAllWalletButtons() {
    const btns = document.querySelectorAll('button');
    btns.forEach(btn => {
      const txt = (btn.textContent || '').trim();
      if (
        txt === 'Connect wallet' ||
        txt === 'Connect' ||
        txt.includes('...') ||
        btn.classList.contains('kolfex-connect-btn') ||
        btn.getAttribute('data-kolfex-wallet-btn') === 'true'
      ) {
        btn.setAttribute('data-kolfex-wallet-btn', 'true');
        if (currentAddress) {
          btn.innerHTML = `
            <span class="flex items-center gap-2 group-hover/wallet:hidden">
              <span class="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              <span class="font-mono font-semibold">${shorten(currentAddress)}</span>
            </span>
            <span class="hidden items-center gap-1.5 group-hover/wallet:flex text-red-400 font-semibold">
              Disconnect
            </span>
          `;
          btn.classList.add('group/wallet');
        } else {
          btn.innerHTML = 'Connect wallet';
          btn.classList.remove('group/wallet');
        }
      }
    });
  }

  function createModal() {
    let existing = document.getElementById('kolfex-solana-modal');
    if (existing) return existing;

    const modal = document.createElement('div');
    modal.id = 'kolfex-solana-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(6px);
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: inherit;
    `;

    modal.innerHTML = `
      <div style="
        background: #0e1014;
        border: 2px solid #272a34;
        box-shadow: 0 20px 45px rgba(0,0,0,0.85);
        max-width: 420px;
        width: 100%;
        color: #f3f4f6;
        position: relative;
        padding: 24px;
        box-sizing: border-box;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.02em;">Connect Solana Wallet</h3>
            <p style="font-size: 0.8125rem; color: #9ca3af; margin: 0;">Select your wallet to bet on KOLs with SOL</p>
          </div>
          <button id="kolfex-modal-close" style="
            background: transparent;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 4px;
            font-size: 1.25rem;
            line-height: 1;
          ">&times;</button>
        </div>

        <div id="kolfex-wallet-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 18px;">
          <!-- Wallets injected dynamically -->
        </div>

        <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #1f232c; text-align: center; font-size: 0.75rem; color: #6b7280;">
          Powered by Solana &amp; pump.fun &bull; Non-custodial
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById('kolfex-modal-close').addEventListener('click', closeModal);

    return modal;
  }

  function openModal() {
    const modal = createModal();
    const list = document.getElementById('kolfex-wallet-list');
    list.innerHTML = '';

    WALLETS.forEach(w => {
      const provider = w.getProvider();
      const isDetected = !!provider;

      const item = document.createElement('button');
      item.type = 'button';
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        padding: 12px 14px;
        background: #14171f;
        border: 1.5px solid #232734;
        color: #fff;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
      `;

      item.onmouseenter = () => {
        item.style.borderColor = '#516af6';
        item.style.background = '#1a1e29';
      };
      item.onmouseleave = () => {
        item.style.borderColor = '#232734';
        item.style.background = '#14171f';
      };

      item.innerHTML = `
        <div style="flex-shrink: 0; display: flex; align-items: center;">${w.icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 0.95rem;">${w.name}</div>
          <div style="font-size: 0.75rem; color: #9ca3af;">${w.description}</div>
        </div>
        <div>
          ${isDetected 
            ? '<span style="font-size: 0.6875rem; font-weight: 600; color: #10b981; background: rgba(16,185,129,0.12); padding: 3px 8px; border: 1px solid rgba(16,185,129,0.3);">Detected</span>'
            : '<span style="font-size: 0.6875rem; font-weight: 600; color: #9ca3af; background: rgba(255,255,255,0.06); padding: 3px 8px; border: 1px solid #333;">Install &nearr;</span>'
          }
        </div>
      `;

      item.onclick = async () => {
        if (!isDetected) {
          window.open(w.downloadUrl, '_blank', 'noopener');
          return;
        }

        try {
          item.style.opacity = '0.6';
          item.querySelector('div:last-child').innerHTML = '<span style="font-size: 0.75rem; color: #516af6;">Connecting...</span>';
          
          let resp;
          if (w.id === 'solflare') {
            await provider.connect();
            resp = { publicKey: provider.publicKey };
          } else {
            resp = await provider.connect();
          }

          if (resp && resp.publicKey) {
            currentAddress = resp.publicKey.toString();
            currentWallet = w.id;
            localStorage.setItem('kolfex_solana_wallet', JSON.stringify({
              walletId: w.id,
              address: currentAddress
            }));
            closeModal();
            updateAllWalletButtons();
            showNotification(`Connected to ${w.name}: ${shorten(currentAddress)}`, 'success');
          }
        } catch (err) {
          console.error(`Failed to connect ${w.name}:`, err);
          showNotification(err.message || 'Connection rejected', 'error');
          openModal(); // reset state
        }
      };

      list.appendChild(item);
    });

    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('kolfex-solana-modal');
    if (modal) modal.style.display = 'none';
  }

  function disconnect() {
    if (confirm(`Disconnect wallet (${shorten(currentAddress)})?`)) {
      try {
        const w = WALLETS.find(x => x.id === currentWallet);
        const p = w?.getProvider();
        if (p?.disconnect) p.disconnect();
      } catch (e) {}
      currentAddress = null;
      currentWallet = null;
      localStorage.removeItem('kolfex_solana_wallet');
      updateAllWalletButtons();
      showNotification('Wallet disconnected', 'info');
    }
  }

  function showNotification(msg, type = 'info') {
    let toast = document.getElementById('kolfex-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kolfex-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100000;
        padding: 12px 18px;
        background: #14171f;
        border: 1.5px solid #2a2e39;
        color: #fff;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 10px 25px rgba(0,0,0,0.6);
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.style.borderColor = '#10b981';
      toast.style.color = '#34d399';
    } else if (type === 'error') {
      toast.style.borderColor = '#ef4444';
      toast.style.color = '#f87171';
    } else {
      toast.style.borderColor = '#516af6';
      toast.style.color = '#fff';
    }

    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3500);
  }

  // Intercept button clicks
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a');
    if (!target) return;

    const txt = (target.textContent || '').trim();
    const isWalletBtn = 
      target.getAttribute('data-kolfex-wallet-btn') === 'true' ||
      txt === 'Connect wallet' ||
      txt === 'Connect' ||
      target.classList.contains('kolfex-connect-btn');

    if (isWalletBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (currentAddress) {
        disconnect();
      } else {
        openModal();
      }
      return;
    }

    // Betting buttons
    if (target.classList.contains('kolfex-bet-btn') || txt === 'Back a trader' || txt === 'Pick a side') {
      if (!currentAddress) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      }
    }
  }, true);

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateAllWalletButtons();
    });
  } else {
    updateAllWalletButtons();
  }

  // Observer to keep buttons updated when React re-renders
  const observer = new MutationObserver(() => {
    updateAllWalletButtons();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.kolfexSolana = {
    connect: openModal,
    disconnect: disconnect,
    getAddress: () => currentAddress,
    getWallet: () => currentWallet
  };
})();
