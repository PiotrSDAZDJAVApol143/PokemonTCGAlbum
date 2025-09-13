CREATE TABLE IF NOT EXISTS attack_def (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pl VARCHAR(255),
    description VARCHAR(1000),
    description_pl VARCHAR(1000),
    canonical_key VARCHAR(255) NOT NULL,
    rating INT,
    CONSTRAINT uq_attack_def_canonical UNIQUE (canonical_key)
    );

CREATE TABLE IF NOT EXISTS ability_def (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pl VARCHAR(255),
    description VARCHAR(1000),
    description_pl VARCHAR(1000),
    canonical_key VARCHAR(255) NOT NULL,
    rating INT,
    CONSTRAINT uq_ability_def_canonical UNIQUE (canonical_key)
    );