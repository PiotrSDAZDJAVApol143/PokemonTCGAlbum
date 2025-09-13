package org.example.pokemontcgalbum.dto;

import lombok.Data;

import java.util.List;

@Data
public class TcgApiSetsResponseDto {
    private List<TcgApiSetDto> data;
    private Integer page;
    private Integer pageSize;
    private Integer count;
    private Integer totalCount;
}