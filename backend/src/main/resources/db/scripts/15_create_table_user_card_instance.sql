CREATE TABLE IF NOT EXISTS user_card_instance (
                                                  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                                  user_id BIGINT NOT NULL,
                                                  card_id VARCHAR(32) NOT NULL,
    deck_id BIGINT NULL,
    CONSTRAINT fk_uci_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_uci_card FOREIGN KEY (card_id) REFERENCES tcg_card(id),
    CONSTRAINT fk_uci_deck FOREIGN KEY (deck_id) REFERENCES decks(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;