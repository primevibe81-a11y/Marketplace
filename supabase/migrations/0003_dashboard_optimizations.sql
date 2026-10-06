-- Ubah default batas umur stok mati dari 30 hari menjadi 5 hari
ALTER TABLE public.settings ALTER COLUMN stock_age_days SET DEFAULT 5;

-- Update data yang sudah ada jika pengguna belum mengubahnya secara manual
UPDATE public.settings SET stock_age_days = 5 WHERE stock_age_days = 30;
