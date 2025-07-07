CREATE TABLE IF NOT EXISTS card_set (
    id VARCHAR(32) PRIMARY KEY,
    set_name VARCHAR(255),
    series VARCHAR(255),
    logo_url VARCHAR(512),
    symbol_url VARCHAR(512),
    release_date DATE
    );