package com.pixelhub.backend.controller;

import com.pixelhub.backend.model.dto.BoardResponse;
import com.pixelhub.backend.model.dto.PixelDto;
import com.pixelhub.backend.model.dto.WebSocketMessage;
import com.pixelhub.backend.service.PixelService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.time.Instant;
import java.util.List;

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

    @ResponseBody
    @GetMapping("/full-board")
    public BoardResponse getFullBoard() {
        List<PixelDto> pixelDtos = pixelService.getFullBoard().stream()
                .map(p -> new PixelDto(p.getX(), p.getY(), p.getColor()))
                .toList();

        return new BoardResponse(pixelDtos);
    }

    @ResponseBody
    @GetMapping("/board-history")
    public BoardResponse getBoardAtTime(
            @RequestParam("timestamp") 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) 
            Instant timestamp) {
        List<PixelDto> pixelDtos = pixelService.getBoardStateAtTime(timestamp).stream()
                .map(p -> new PixelDto(p.getX(), p.getY(), p.getColor()))
                .toList();
        return new BoardResponse(pixelDtos);
    }

}
