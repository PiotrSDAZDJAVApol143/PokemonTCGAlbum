-- 1) wstaw brakujące RULE_DEF zgrupowane po kanonicznym tekście (hash 64 znaki)
INSERT INTO rule_def (name, name_pl, description, description_pl, canonical_key, rating)
SELECT s.name, s.name_pl, s.description, s.description_pl, s.canonical_key, s.rating
FROM (
         SELECT
             -- deterministyczny opis (przycięty do 1000)
             LEFT(MIN(r.text), 1000)     AS description,
             LEFT(MIN(r.text_pl), 1000)  AS description_pl,

             -- nazwa = pierwsze zdanie z MIN(r.text), ale max 255 znaków
             LEFT(SUBSTRING_INDEX(MIN(r.text), '.', 1), 255) AS name,
             NULL                        AS name_pl,

             -- klucz kanoniczny: normalizacja + SHA-256 (64 znaki)
             SHA2(LOWER(TRIM(REGEXP_REPLACE(IFNULL(r.text,''), '\\s+', ' '))), 256) AS canonical_key,

             MAX(r.rating)               AS rating
         FROM tcg_rule r
         WHERE r.text IS NOT NULL AND TRIM(r.text) <> ''
         GROUP BY SHA2(LOWER(TRIM(REGEXP_REPLACE(IFNULL(r.text,''), '\\s+', ' '))), 256)
     ) s
         LEFT JOIN rule_def d ON d.canonical_key = s.canonical_key
WHERE d.id IS NULL;

-- 2) przypnij def_id w tcg_rule po hash’u kanonicznego tekstu
UPDATE tcg_rule r
    JOIN rule_def d
ON d.canonical_key = SHA2(LOWER(TRIM(REGEXP_REPLACE(IFNULL(r.text,''), '\\s+', ' '))), 256)
    SET r.def_id = d.id
WHERE r.text IS NOT NULL AND TRIM(r.text) <> '';

-- 3) jeżeli rule_def.rating jest NULL, przenieś MAX z tcg_rule.rating
UPDATE rule_def d
    JOIN (
    SELECT def_id, MAX(rating) AS max_rating
    FROM tcg_rule
    WHERE rating IS NOT NULL
    GROUP BY def_id
    ) x ON x.def_id = d.id
    SET d.rating = x.max_rating
WHERE d.rating IS NULL;
