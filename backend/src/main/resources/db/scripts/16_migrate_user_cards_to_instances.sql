CREATE PROCEDURE migrate_user_cards_guard()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'user_cards'
  ) THEN

    /* Wstaw brakujące instancje na podstawie user_cards.quantity.
       Dla każdej (user_id, card_id) dodajemy tyle rekordów,
       ile wynosi różnica pomiędzy quantity a już istniejącymi
       instancjami w user_card_instance. */

    INSERT INTO user_card_instance (user_id, card_id, deck_id)
SELECT
    uc.user_id,
    uc.card_id,
    NULL
FROM user_cards uc
         LEFT JOIN (
    SELECT user_id, card_id, COUNT(*) AS cnt
    FROM user_card_instance
    GROUP BY user_id, card_id
) e
                   ON e.user_id = uc.user_id
                       AND e.card_id = uc.card_id
         JOIN (
    /* Generator liczb 1..1000 (zwiększ, jeśli potrzebujesz). */
    SELECT a.n + b.n*10 + c.n*100 + 1 AS n
    FROM (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
          UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
             CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
             CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
) seq
              ON seq.n <= GREATEST(uc.quantity - COALESCE(e.cnt, 0), 0);

END IF;
END;
