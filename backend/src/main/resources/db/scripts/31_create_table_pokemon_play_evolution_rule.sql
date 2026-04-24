CREATE TABLE IF NOT EXISTS pokemon_play_evolution_rule (
                                                           id BIGINT AUTO_INCREMENT PRIMARY KEY,

                                                           family_code VARCHAR(64) NOT NULL,

    from_pokedex_number INT NOT NULL,
    from_form_code VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    from_card_state VARCHAR(16) NOT NULL,

    to_pokedex_number INT NOT NULL,
    to_form_code VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    to_card_state VARCHAR(16) NOT NULL,

    rule_type VARCHAR(24) NOT NULL,
    notes VARCHAR(255) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_pokemon_play_evolution_rule UNIQUE (
                                                         from_pokedex_number,
                                                         from_form_code,
                                                         from_card_state,
                                                         to_pokedex_number,
                                                         to_form_code,
                                                         to_card_state
                                                     ),

    INDEX idx_pper_family_code (family_code),
    INDEX idx_pper_from (from_pokedex_number, from_form_code, from_card_state),
    INDEX idx_pper_to (to_pokedex_number, to_form_code, to_card_state)
    );