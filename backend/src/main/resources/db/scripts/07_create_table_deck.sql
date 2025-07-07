CREATE TABLE IF NOT EXISTS decks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    base_energy VARCHAR(64),
    secondary_energy VARCHAR(64),
    CONSTRAINT fk_deck_user_id FOREIGN KEY (user_id) REFERENCES users(id)
    );