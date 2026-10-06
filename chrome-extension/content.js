// Skrip ini berjalan di dalam halaman web FB Marketplace
(() => {
  const items = [];
  
  // Mencari elemen-elemen listing di FB Marketplace
  // Karena class FB acak (obfuscated), kita cari elemen yang mengandung teks "Rp" 
  // dan berada dalam sebuah tautan (a href)
  
  const links = document.querySelectorAll('a[role="link"]');
  
  links.forEach(link => {
    const text = link.innerText;
    
    // Cari teks yang terlihat seperti harga, misal: Rp 1.500.000
    const priceMatch = text.match(/Rp\s?([\d\.,]+)/);
    if (!priceMatch) return;
    
    // Hilangkan titik/koma untuk mendapatkan integer murni
    const priceStr = priceMatch[1].replace(/[^\d]/g, '');
    const price = parseInt(priceStr, 10);
    
    // Validasi harga masuk akal (misal > 10.000)
    if (isNaN(price) || price < 10000) return;
    
    let url = link.href;
    // Bersihkan URL dari parameter pelacakan FB
    if (url && url.includes('?')) {
      url = url.split('?')[0];
    }
    
    items.push({
      price: price,
      url: url,
      note: 'Auto-scraper extension'
    });
  });

  // Hapus duplikat berdasarkan URL
  const uniqueItems = items.filter((item, index, self) =>
    index === self.findIndex((t) => t.url === item.url)
  );

  // Batasi maksimal 20 item agar tidak berat
  return uniqueItems.slice(0, 20);
})();
