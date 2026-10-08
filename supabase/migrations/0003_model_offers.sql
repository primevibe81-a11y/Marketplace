-- Migrasi 0003: Mengubah relasi offers agar langsung menempel ke phone_models (dan membuat unit_id opsional)

-- 1. Tambahkan kolom model_id ke offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES phone_models(id);

-- 2. Migrasi data yang ada: Ambil model_id dari tabel units
UPDATE offers
SET model_id = units.model_id
FROM units
WHERE offers.unit_id = units.id AND offers.model_id IS NULL;

-- 3. Ubah unit_id agar boleh kosong (opsional)
ALTER TABLE offers ALTER COLUMN unit_id DROP NOT NULL;

-- 4. Tambahkan indeks pada model_id untuk performa query
CREATE INDEX IF NOT EXISTS idx_offers_model_id ON offers(model_id);

-- 5. Ubah view latest_offers untuk menggunakan model_id
DROP VIEW IF EXISTS latest_offers;
CREATE VIEW latest_offers WITH (security_invoker = on) AS
SELECT DISTINCT ON (model_id, shop_id)
    id,
    model_id,
    shop_id,
    price,
    offered_at,
    note
FROM offers
WHERE model_id IS NOT NULL
ORDER BY model_id, shop_id, offered_at DESC;
