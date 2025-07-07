package org.example.pokemontcgalbum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class PokemonTCGAlbum {

    public static void main(String[] args) {
        SpringApplication.run(PokemonTCGAlbum.class, args);
    }

}
