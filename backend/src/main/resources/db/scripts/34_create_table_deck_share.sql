CREATE TABLE deck_share (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            deck_id BIGINT NOT NULL,
                            target_user_id BIGINT NOT NULL,
                            read_only BIT(1) NOT NULL DEFAULT b'1',
                            wins INT NOT NULL DEFAULT 0,
                            losses INT NOT NULL DEFAULT 0,
                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT uq_deck_share_deck_target UNIQUE (deck_id, target_user_id),
                            CONSTRAINT fk_deck_share_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
                            CONSTRAINT fk_deck_share_target_user FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);