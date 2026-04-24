CREATE TABLE IF NOT EXISTS pokemon_species_evolution (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    family_code VARCHAR(64) NOT NULL,
    pokedex_number INT NOT NULL,
    form_code VARCHAR(32) NOT NULL DEFAULT 'NORMAL',

    pokemon_name VARCHAR(128) NOT NULL,
    pokemon_name_pl VARCHAR(128) NULL,

    evolution_tier INT NOT NULL,
    normal_stage VARCHAR(16) NOT NULL,
    is_baby BOOLEAN NOT NULL DEFAULT FALSE,

    evolves_from_pokedex_number INT NULL,
    evolves_from_form_code VARCHAR(32) NULL,

    branch_order INT NOT NULL DEFAULT 0,
    notes VARCHAR(255) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_pokemon_species_evolution UNIQUE (pokedex_number, form_code),

    INDEX idx_pse_family_code (family_code),
    INDEX idx_pse_prev (evolves_from_pokedex_number, evolves_from_form_code)
    );