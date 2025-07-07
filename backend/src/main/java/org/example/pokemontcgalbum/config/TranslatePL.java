package org.example.pokemontcgalbum.config;


import org.example.pokemontcgalbum.dto.TranslateData;
import org.example.pokemontcgalbum.dto.TranslatedAbility;
import org.example.pokemontcgalbum.dto.TranslatedAttack;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TranslatePL {
    private static final Map<String, TranslateData> translations = new HashMap<>();

    static {
        translations.put("sv4pt5-125", new TranslateData(
                "Kiedy Veluza pozbywa się łusek, jej umysł staje się wyostrzony, a jej moce psychiczne rosną. Odrzucone mięso z łuskami ma łagodny, ale pyszny smak.",
                List.of(
                        new TranslatedAttack("Taran", ""),                          // Pierwszy atak PL
                        new TranslatedAttack("Smukły Świder", "Jeśli nie masz kart na ręce, ten atak może być użyty kosztem 1 Wodnej Energii") // Drugi atak PL
                ),
                List.of(

                )
        ));
        translations.put("sv7-45", new TranslateData(
                "Veluza ma doskonałe zdolności regeneracyjne. Zrzuca nadmiar łusek ochronnych, aby zwiększyć swoją zwinność, po czym szarżuje na ofiarę.",
                List.of(
                        new TranslatedAttack("Soniczne Ostrze", "Obrażenia tego ataku nie są modyfikowane przez efekty na aktywnym Pokemonie przeciwnika.")
                ),
                List.of(
                        new TranslatedAbility("Przygotowanie Jedzenia", "Ataki tego Pokemona kosztują o 1 mniej za każdą kartę Kofu w Twoim discard pile (koszu).")
                )
        ));
        translations.put("base1-1", new TranslateData(
                "Jego mózg przewyższa możliwościami superkomputer. Jego iloraz inteligencji podobno wynosi 5000.",
                List.of(
                        new TranslatedAttack("Promień Zamieszania", "Rzuć monetą. Jeśli wypadnie orzeł, broniący się Pokémon zostaje Zdezorientowany.")
                ),
                List.of(
                        new TranslatedAbility("Zamiana Obrażeń", "Dowolną ilość razy podczas swojej tury (przed atakiem) możesz przenieść 1 znacznik obrażeń z jednego ze swoich Pokémonów na innego, pod warunkiem, że nie spowodujesz przez to wyeliminowania Pokémona. Ta zdolność nie działa, jeśli Alakazam śpi, jest zdezorientowany lub sparaliżowany.")
                )
        ));
        translations.put("base1-10", new TranslateData(
                "Naukowiec stworzył tego Pokémona po latach przerażających eksperymentów z łączeniem genów i inżynierią DNA.",
                List.of(
                        new TranslatedAttack("Psychoatak", "Zadaje 10 obrażeń plus 10 dodatkowych obrażeń za każdą kartę Energii przypisaną do broniącego się Pokémona."),
                        new TranslatedAttack("Bariera", "Odłóż 1 kartę Energii Psychicznej przypisaną do Mewtwo, aby zapobiec wszystkim efektom ataków, w tym obrażeniom, zadanym Mewtwo podczas następnej tury przeciwnika.")
                ),
                List.of()
        ));
        translations.put("base1-11", new TranslateData(
                "W walce używa potężnego ogona do miażdżenia, ściskania, a następnie łamania kości ofiary.",
                List.of(
                        new TranslatedAttack("Rozszalały Atak", "Rzuć monetą. Jeśli wypadnie orzeł, ten atak zadaje 30 obrażeń plus 10 dodatkowych; jeśli reszka, ten atak zadaje 30 obrażeń, a Nidoking zadaje sobie 10 obrażeń."),
                        new TranslatedAttack("Trucizna", "Broniący się Pokémon zostaje teraz zatruty. Teraz po każdej turze obu graczy otrzymuje 20 obrażeń od trucizny zamiast 10 (nawet jeśli był już zatruty).")
                ),
                List.of()
        ));
        translations.put("base1-12", new TranslateData(
                "Bardzo mądry i bardzo mściwy. Złapanie za jeden z jego wielu ogonów może skutkować tysiącletnią klątwą.",
                List.of(
                        new TranslatedAttack("Zwabienie", "Jeśli przeciwnik ma Pokémony na Ławce, wybierz jednego z nich i zamień z jego aktywnym Pokémonem."),
                        new TranslatedAttack("Ognisty Podmuch", "Odłóż 1 kartę Energii Ognistej przypisaną do Ninetales, aby użyć tego ataku.")
                ),
                List.of()
        ));
        translations.put("base1-13", new TranslateData(
                "Świetny pływak zarówno kraulem, jak i stylem klasycznym. Z łatwością prześciga najlepszych ludzkich pływaków.",
                List.of(
                        new TranslatedAttack("Pistolet Wodny", "Zadaje 30 obrażeń plus 10 dodatkowych za każdą kartę Wodnej Energii przypisaną do Poliwratha, ale niezużytą do opłacenia kosztu ataku. Nadmiar Wodnej Energii po drugiej nie jest liczony."),
                        new TranslatedAttack("Wir", "Jeśli broniący się Pokémon ma przypisane karty Energii, wybierz jedną z nich i odłóż ją.")
                ),
                List.of()
        ));
        translations.put("base1-14", new TranslateData(
                "Jego długi ogon służy za uziemienie, chroniąc go przed własną wysokonapięciową mocą.",
                List.of(
                        new TranslatedAttack("Zwinność", "Rzuć monetą. Jeśli wypadnie orzeł, podczas następnej tury przeciwnika zapobiegasz wszystkim efektom ataków, w tym obrażeniom, zadanym Raichu."),
                        new TranslatedAttack("Grom", "Rzuć monetą. Jeśli wypadnie reszka, Raichu zadaje sobie 30 obrażeń.")
                ),
                List.of()
        ));
        translations.put("base1-15", new TranslateData(
                "Ta roślina rozkwita, gdy pochłania energię słoneczną. Cały czas się porusza, by szukać światła.",
                List.of(
                        new TranslatedAttack("Słoneczny Promień", "")
                ),
                List.of(
                        new TranslatedAbility("Transfer Energii", "Dowolną ilość razy podczas swojej tury (przed atakiem) możesz przenieść 1 kartę Energii Trawiastej przypisaną do jednego ze swoich Pokémonów i przypisać ją innemu. Ta zdolność nie działa, jeśli Venusaur śpi, jest zdezorientowany lub sparaliżowany.")
                )
        ));
        translations.put("base1-16", new TranslateData(
                "Legendarny ptak Pokémon, który podobno pojawia się z chmur, dzierżąc potężne pioruny.",
                List.of(
                        new TranslatedAttack("Grom", "Rzuć monetą. Jeśli wypadnie reszka, Zapdos zadaje sobie 30 obrażeń."),
                        new TranslatedAttack("Piorun", "Odłóż wszystkie karty Energii przypisane do Zapdosa, aby użyć tego ataku.")
                ),
                List.of()
        ));
        translations.put("base1-17", new TranslateData(
                "Lata z dużą prędkością i atakuje dużymi, jadowitymi żądłami na przednich nogach i ogonie.",
                List.of(
                        new TranslatedAttack("Podwójne Ukłucie", "Rzuć 2 monety. Ten atak zadaje 30 obrażeń razy liczba orłów."),
                        new TranslatedAttack("Żądło Trucizny", "Rzuć monetą. Jeśli wypadnie orzeł, broniący się Pokémon zostaje zatruty.")
                ),
                List.of()
        ));
        translations.put("base1-18", new TranslateData(
                "Mistyczny Pokémon, który emanuje łagodną aurą. Ma zdolność zmiany warunków pogodowych.",
                List.of(
                        new TranslatedAttack("Uderzenie", "Rzuć 2 monety. Ten atak zadaje 30 obrażeń razy liczba orłów."),
                        new TranslatedAttack("Hyperpromień", "Jeśli broniący się Pokémon ma przypisane karty Energii, wybierz jedną z nich i odłóż ją.")
                ),
                List.of()
        ));
        translations.put("base1-19", new TranslateData(
                "Zespół trojaczków Diglett. Wywołuje ogromne trzęsienia ziemi, kopiąc 100 kilometrów pod ziemią.",
                List.of(
                        new TranslatedAttack("Cięcie", ""),
                        new TranslatedAttack("Trzęsienie Ziemi", "Zadaje 10 obrażeń każdemu z własnych Pokémonów na Ławce. (Nie stosuj Słabości i Odporności wobec Pokémonów na Ławce.)")
                ),
                List.of()
        ));

    }

    public static TranslateData getTranslation(String cardId) {
        return translations.get(cardId);
    }

}
