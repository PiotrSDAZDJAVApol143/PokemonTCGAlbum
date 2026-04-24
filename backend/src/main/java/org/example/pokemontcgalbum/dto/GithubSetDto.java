package org.example.pokemontcgalbum.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubSetDto {
    private String id;
    private String name;
    private String series;
    private Integer printedTotal;
    private Integer total;
    private String releaseDate; // np "2025/11/14"
    private Images images;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Images {
        private String symbol;
        private String logo;
    }
}