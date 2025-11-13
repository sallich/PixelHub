package com.pixelhub.backend.model.dto;

import com.pixelhub.backend.model.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PixelPlacedEvent {
    private PixelDto pixelDto;
    private User user;
}