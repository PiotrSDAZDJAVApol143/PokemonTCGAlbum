-- 19_backfill_defs.sql

-- helpery w SQL (MySQL 8):
-- name_key: lower(trim(name))
-- damage_key: lower(trim(damage))
-- desc_norm: lower(trim(REGEXP_REPLACE(description, '\\s+', ' ')))
-- desc_hash: SHA2(desc_norm, 256)
-- canonical_key = CONCAT(name_key, '|', damage_key, '|', desc_hash)

-- 1) wstaw brakujące ATTACK_DEF z grupowaniem po (name, damage, description)
INSERT INTO attack_def (name, name_pl, description, description_pl, damage_text, canonical_key, rating)
SELECT s.name, s.name_pl, s.description, s.description_pl, s.damage_text, s.canonical_key, NULL
FROM (
         SELECT
             MIN(a.name)            AS name,
             MIN(a.name_pl)         AS name_pl,
             MIN(a.description)     AS description,
             MIN(a.description_pl)  AS description_pl,
             MIN(a.damage)          AS damage_text,
             MIN(CONCAT(
                     LOWER(TRIM(a.name)), '|',
                     LOWER(TRIM(IFNULL(a.damage, ''))), '|',
                     SHA2(LOWER(TRIM(REGEXP_REPLACE(IFNULL(a.description,''), '\\s+', ' '))), 256)
                 ))                     AS canonical_key
         FROM attack a
         WHERE a.name IS NOT NULL AND TRIM(a.name) <> ''
         GROUP BY
             LOWER(TRIM(a.name)),
             LOWER(TRIM(IFNULL(a.damage, ''))),
             SHA2(LOWER(TRIM(REGEXP_REPLACE(IFNULL(a.description,''), '\\s+', ' '))), 256)
     ) s
         LEFT JOIN attack_def d ON d.canonical_key = s.canonical_key
WHERE d.id IS NULL;

-- 2) ABILITIES bez zmian – dalej grupowanie po nazwie
INSERT INTO ability_def (name, name_pl, description, description_pl, canonical_key, rating)
SELECT s.name, s.name_pl, s.description, s.description_pl, s.canonical_key, NULL
FROM (
         SELECT
             MIN(ab.name)            AS name,
             MIN(ab.name_pl)         AS name_pl,
             MIN(ab.description)     AS description,
             MIN(ab.description_pl)  AS description_pl,
             MIN(LOWER(TRIM(ab.name))) AS canonical_key
         FROM ability ab
         WHERE ab.name IS NOT NULL AND TRIM(ab.name) <> ''
         GROUP BY LOWER(TRIM(ab.name))
     ) s
         LEFT JOIN ability_def d ON d.canonical_key = s.canonical_key
WHERE d.id IS NULL;

-- 3) przypnij def_id w ATTACK po nowym kluczu
UPDATE attack a
    JOIN attack_def d
ON d.canonical_key = CONCAT(
    LOWER(TRIM(a.name)), '|',
    LOWER(TRIM(IFNULL(a.damage, ''))), '|',
    SHA2(LOWER(TRIM(REGEXP_REPLACE(IFNULL(a.description,''), '\\s+', ' '))), 256)
    )
    SET a.def_id = d.id
WHERE a.name IS NOT NULL AND TRIM(a.name) <> '';

-- 4) przypnij def_id w ABILITY (po nazwie jak było)
UPDATE ability ab
    JOIN ability_def d
ON d.canonical_key = LOWER(TRIM(ab.name))
    SET ab.def_id = d.id
WHERE ab.name IS NOT NULL AND TRIM(ab.name) <> '';

-- 5) przenieś rating z instancji do DEF (jeżeli DEF.rating jest NULL)
-- UPDATE attack_def d
--   JOIN (
--   SELECT def_id, MAX(rating) AS max_rating
--   FROM attack
--   WHERE rating IS NOT NULL
--   GROUP BY def_id
--   ) x ON x.def_id = d.id
--   SET d.rating = x.max_rating
-- WHERE d.rating IS NULL;

-- UPDATE ability_def d
--     JOIN (
--     SELECT def_id, MAX(rating) AS max_rating
--     FROM ability
--     WHERE rating IS NOT NULL
--     GROUP BY def_id
--     ) x ON x.def_id = d.id
--     SET d.rating = x.max_rating
-- WHERE d.rating IS NULL;