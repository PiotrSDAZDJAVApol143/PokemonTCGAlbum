package org.example.pokemontcgalbum.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient pokeApiWebClient() {
        return WebClient.builder()
                .baseUrl("https://pokeapi.co/api/v2")
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create()
                        .responseTimeout(java.time.Duration.ofSeconds(60))))
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(4 * 1024 * 1024)) // 4 MB
                .build();
    }

    @Bean
    public WebClient tcgApiWebClient() {
        return WebClient.builder()
                .baseUrl("https://api.pokemontcg.io/v2")
                .defaultHeader("X-Api-Key", "fff61821-9725-431f-9dc9-c61c73e13dbe")
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create()
                        .responseTimeout(java.time.Duration.ofSeconds(60))))
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(4 * 1024 * 1024)) // 4 MB
                .build();
    }
}