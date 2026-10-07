document.addEventListener('DOMContentLoaded', () => {
  // Load saved values
  document.getElementById('modelId').value = localStorage.getItem('fb_scraper_modelId') || '';
  document.getElementById('hostUrl').value = localStorage.getItem('fb_scraper_hostUrl') || 'http://localhost:3000';
  document.getElementById('secret').value = localStorage.getItem('fb_scraper_secret') || '';

  const btn = document.getElementById('scanBtn');
  const statusEl = document.getElementById('status');

  btn.addEventListener('click', async () => {
    let modelIdRaw = document.getElementById('modelId').value.trim();
    const hostUrl = document.getElementById('hostUrl').value.trim().replace(/\/$/, '');
    const secret = document.getElementById('secret').value.trim();

    // Jika pengguna tidak sengaja menempelkan tautan lengkap (contoh: https://.../models/123-456...)
    // Ambil bagian terakhir dari URL tersebut
    let modelId = modelIdRaw;
    if (modelIdRaw.includes('/')) {
      const parts = modelIdRaw.split('/');
      modelId = parts[parts.length - 1];
    }

    if (!modelId || !hostUrl || !secret) {
      statusEl.textContent = 'Harap isi semua kolom!';
      statusEl.className = 'error';
      return;
    }

    // Save for next time
    localStorage.setItem('fb_scraper_modelId', modelId);
    localStorage.setItem('fb_scraper_hostUrl', hostUrl);
    localStorage.setItem('fb_scraper_secret', secret);

    // Save secret to chrome storage for content script (auto_scrape)
    chrome.storage.local.set({ fb_scraper_secret: secret });

    btn.disabled = true;
    statusEl.textContent = 'Menyedot data dari layar...';
    statusEl.className = '';

    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('facebook.com/marketplace')) {
      statusEl.textContent = 'Error: Buka halaman FB Marketplace dulu!';
      statusEl.className = 'error';
      btn.disabled = false;
      return;
    }

    // Inject and execute content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, (injectionResults) => {
      if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
        statusEl.textContent = 'Gagal menyuntikkan script!';
        statusEl.className = 'error';
        btn.disabled = false;
        return;
      }

      const items = injectionResults[0].result;
      
      if (!items || items.length === 0) {
        statusEl.textContent = 'Tidak menemukan harga di layar.';
        statusEl.className = 'error';
        btn.disabled = false;
        return;
      }

      statusEl.textContent = `Mengirim ${items.length} harga ke server...`;

      // Kirim data ke API Next.js
      fetch(`${hostUrl}/api/observations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`
        },
        body: JSON.stringify({
          model_id: modelId,
          observations: items
        })
      })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(res => {
        if (res.status !== 200) {
          statusEl.textContent = `Error: ${res.data.error || 'Server error'}`;
          statusEl.className = 'error';
        } else {
          statusEl.textContent = `Sukses! ${items.length} data tersimpan.`;
          statusEl.className = 'success';
        }
      })
      .catch(err => {
        statusEl.textContent = `Koneksi gagal: ${err.message}`;
        statusEl.className = 'error';
      })
      .finally(() => {
        btn.disabled = false;
      });
    });
  });
});
