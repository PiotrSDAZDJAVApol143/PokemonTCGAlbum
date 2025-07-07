CREATE TABLE IF NOT EXISTS ability (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    name_pl VARCHAR(255),
    description VARCHAR(1000),
    description_pl VARCHAR(1000),
    rating INT,
    card_id VARCHAR(32),
    CONSTRAINT fk_ability_card_id FOREIGN KEY (card_id) REFERENCES tcg_card(id)
    );