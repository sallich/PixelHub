package com.pixelhub.backend.controller;

import com.pixelhub.backend.model.dto.PixelDto;
import com.pixelhub.backend.model.dto.WebSocketMessage;
import com.pixelhub.backend.service.PixelService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class PixelController {

    private final PixelService pixelService;

    @MessageMapping("/pixel")
    public void handlePixelUpdate(@Payload WebSocketMessage<PixelDto> request, Principal principal) {
        if (principal != null && "send".equals(request.getType())) {
            pixelService.placePixel(request.getContent(), principal.getName());
        }
    }

    //TODO: add GET full-board endpoint
}
