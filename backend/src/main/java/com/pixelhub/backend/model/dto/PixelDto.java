package com.pixelhub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PixelDto {
    private Integer x;
    private Integer y;
    private Integer c;
}
