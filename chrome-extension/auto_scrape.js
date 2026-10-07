(() => {
  // Hanya jalan jika ada hashtag #auto_scrape=
  if (!window.location.hash.includes('#auto_scrape=')) return;

  const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
  const modelId = hashParams.get('auto_scrape');
  const targetHost = hashParams.get('host') || 'http://localhost:3000';
  
  if (!modelId) return;

  console.log("Auto-Scrape Started for Model:", modelId);

  // Fungsi untuk scroll otomatis beberapa kali agar FB memuat gambar/listing
  const autoScroll = async () => {
    return new Promise(resolve => {
      let scrolls = 0;
      const interval = setInterval(() => {
        window.scrollBy(0, 800);
        scrolls++;
        if (scrolls >= 4) { // Scroll 4 kali
          clearInterval(interval);
          setTimeout(resolve, 1500); // Tunggu sebentar setelah scroll selesai
        }
      }, 800);
    });
  };

  const scrapeData = () => {
    const items = [];
    const links = document.querySelectorAll('a[role="link"]');
    
    // Kata-kata yang membuat listing dibuang
    const badWords = ['lcd', 'mesin', 'mati', 'rusak', 'casing', 'minus', 'baterai', 'batre', 'kamera', 'kaca', 'retak', 'tukartambah', 'tt', 'tukar tambah', 'bt', 'barter', 'box', 'dus', 'kotak', 'kosong'];

    links.forEach(link => {
      const text = link.innerText.toLowerCase();
      
      // Filter out junk
      if (badWords.some(word => text.includes(word))) return;

      const priceMatch = link.innerText.match(/Rp\s?([\d\.,]+)/);
      if (!priceMatch) return;
      
      const priceStr = priceMatch[1].replace(/[^\d]/g, '');
      const price = parseInt(priceStr, 10);
      
      if (isNaN(price) || price < 100000) return; // Harga terlalu murah = aksesoris
      
      let url = link.href;
      if (url && url.includes('?')) {
        url = url.split('?')[0];
      }
      
      items.push({
        price: price,
        url: url,
        note: 'Auto-scraper (1-click)'
      });
    });

    const uniqueItems = items.filter((item, index, self) =>
      index === self.findIndex((t) => t.url === item.url)
    );

    return uniqueItems.slice(0, 15);
  };

  const sendData = async (items) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['fb_scraper_secret'], (result) => {
        const secret = result.fb_scraper_secret;
        if (!secret) {
          alert('Token rahasia belum diset di popup ekstensi!');
          resolve(false);
          return;
        }

        // Tampilkan loading overlay di halaman FB
        const overlay = document.createElement('div');
        overlay.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);color:white;z-index:99999;display:flex;align-items:center;justify-content:center;font-size:24px;';
        overlay.innerText = `Menyimpan ${items.length} harga...`;
        document.body.appendChild(overlay);

        fetch(`${targetHost}/api/observations`, {
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
            overlay.innerText = `Gagal menyimpan: ${res.data.error}`;
            setTimeout(() => { overlay.remove(); resolve(false); }, 3000);
          } else {
            overlay.innerText = `Sukses menyimpan ${items.length} harga! Menutup tab...`;
            setTimeout(() => { 
              resolve(true); 
              window.close(); // Coba tutup tab
            }, 1500);
          }
        })
        .catch(err => {
          overlay.innerText = `Koneksi gagal! Pastikan server jalan.`;
          setTimeout(() => { overlay.remove(); resolve(false); }, 3000);
        });
      });
    });
  };

  // Run sequence
  const init = async () => {
    // Tambah sedikit delay agar FB merender UI awal
    setTimeout(async () => {
      await autoScroll();
      const items = scrapeData();
      if (items.length > 0) {
        await sendData(items);
      } else {
        alert('Tidak menemukan listing yang cocok (atau semua tersaring sebagai "minus/LCD"). Tab akan ditutup.');
        window.close();
      }
    }, 2000);
  };

  init();
})();
