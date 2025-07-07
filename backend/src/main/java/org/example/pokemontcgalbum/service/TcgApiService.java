package org.example.pokemontcgalbum.service;

import lombok.RequiredArgsConstructor;
import org.example.pokemontcgalbum.dto.TcgApiCardDto;
import org.example.pokemontcgalbum.dto.TcgApiCardsResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TcgApiService {
    private final WebClient tcgApiWebClient;

    public List<TcgApiCardDto> getCardsByPokemonName(String name) {
        Mono<TcgApiCardsResponseDto> response = tcgApiWebClient.get()
                .uri("/cards?q=name:" + name)
                .retrieve()
                .bodyToMono(TcgApiCardsResponseDto.class);

        return response.block().getData();
    }
    public List<TcgApiCardDto> getAllCards() {
        int page = 1;
        int pageSize = 250;
        List<TcgApiCardDto> allCards = new ArrayList<>();
        while (true) {
            Mono<TcgApiCardsResponseDto> response = tcgApiWebClient.get()
                    .uri("/cards?page=" + page + "&pageSize=" + pageSize)
                    .retrieve()
                    .bodyToMono(TcgApiCardsResponseDto.class);

            List<TcgApiCardDto> pageCards = response.block().getData();
            if (pageCards == null || pageCards.isEmpty()) break;
            allCards.addAll(pageCards);
            page++;
        }
        return allCards;
    }
}
