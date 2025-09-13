UPDATE attack_def d
    JOIN (SELECT def_id, MAX(rating) AS max_rating FROM attack WHERE rating IS NOT NULL GROUP BY def_id) x
ON x.def_id = d.id
    SET d.rating = x.max_rating
WHERE d.rating IS NULL;

UPDATE ability_def d
    JOIN (SELECT def_id, MAX(rating) AS max_rating FROM ability WHERE rating IS NOT NULL GROUP BY def_id) x
ON x.def_id = d.id
    SET d.rating = x.max_rating
WHERE d.rating IS NULL;