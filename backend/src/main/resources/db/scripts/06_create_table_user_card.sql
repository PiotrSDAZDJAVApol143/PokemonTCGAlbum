CREATE TABLE IF NOT EXISTS user_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    card_id VARCHAR(32),
    quantity INT,
    CONSTRAINT fk_user_card_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_card_card_id FOREIGN KEY (card_id) REFERENCES tcg_card(id)
    );