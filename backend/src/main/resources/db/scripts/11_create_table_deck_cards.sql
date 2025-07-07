CREATE TABLE IF NOT EXISTS deck_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    deck_id BIGINT NOT NULL,
    card_id VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_deck_cards_deck_id FOREIGN KEY (deck_id) REFERENCES decks(id),
    CONSTRAINT fk_deck_cards_card_id FOREIGN KEY (card_id) REFERENCES tcg_card(id)
    );