CREATE TABLE IF NOT EXISTS user_card_in_deck (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_card_id BIGINT NOT NULL,
    deck_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_user_card_in_deck_user_card_id FOREIGN KEY (user_card_id) REFERENCES user_cards(id),
    CONSTRAINT fk_user_card_in_deck_deck_id FOREIGN KEY (deck_id) REFERENCES decks(id)
    );