CREATE TABLE IF NOT EXISTS attack (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    name_pl VARCHAR(255),
    cost VARCHAR(255),
    damage VARCHAR(32),
    description VARCHAR(1000),
    description_pl VARCHAR(1000),
    special BOOLEAN,
    rating INT,
    card_id VARCHAR(32),
    CONSTRAINT fk_attack_card_id FOREIGN KEY (card_id) REFERENCES tcg_card(id)
    );