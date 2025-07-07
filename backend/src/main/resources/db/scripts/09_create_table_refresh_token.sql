CREATE TABLE IF NOT EXISTS refresh_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(200) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    CONSTRAINT fk_refresh_token_user_id FOREIGN KEY (user_id) REFERENCES users(id)
    );