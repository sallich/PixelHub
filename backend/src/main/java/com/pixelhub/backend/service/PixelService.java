package com.pixelhub.backend.service;

import com.pixelhub.backend.model.dto.PixelDto;
import com.pixelhub.backend.model.dto.WebSocketMessage;
import com.pixelhub.backend.model.entity.Pixel;
import com.pixelhub.backend.repository.PixelRepository;
import com.pixelhub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PixelService {

    private final UserRepository userRepository;
    private final PixelRepository pixelRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.rate-limit-seconds:30}")
    private int RATE_LIMIT_SECONDS;
    @Value("${app.canvas-width:2000}")
    private int CANVAS_WIDTH;
    @Value("${app.canvas-height:2000}")
    private int CANVAS_HEIGHT;
    @Value("${app.min-color:0}")
    private int MIN_COLOR;
    @Value("${app.max-color:127}")
    private int MAX_COLOR;


    @Transactional
    public void placePixel(PixelDto request, String nickname) {
        if (!isValid(request)) {
            return;
        }

        userRepository.findByNickname(nickname).ifPresent(user -> {
            if (user.getLastPlacedAt() != null &&
                Instant.now().isBefore(user.getLastPlacedAt().plus(RATE_LIMIT_SECONDS, ChronoUnit.SECONDS))) {
                return;
            }

            Pixel pixel = new Pixel();
            pixel.setX(request.getX());
            pixel.setY(request.getY());
            pixel.setColor(request.getC());
            pixel.setPlacedAt(Instant.now());
            pixelRepository.save(pixel);

            user.setPixelCount(user.getPixelCount() + 1);
            user.setLastPlacedAt(Instant.now());
            userRepository.save(user);

            WebSocketMessage<PixelDto> broadcastMessage = new WebSocketMessage<>("get", request);
            messagingTemplate.convertAndSend("/topic/pixels", broadcastMessage);
        });
    }

    public List<Pixel> getFullBoard() {
        return pixelRepository.findCurrentBoardState();
    }

    public List<Pixel> getBoardStateAtTime(Instant timestamp) {
        return pixelRepository.findBoardStateAtTime(timestamp);
    }

    private boolean isValid(PixelDto request) {
        return request.getX() != null && request.getX() >= 0 && request.getX() < CANVAS_WIDTH &&
               request.getY() != null && request.getY() >= 0 && request.getY() < CANVAS_HEIGHT &&
               request.getC() != null && request.getC() >= MIN_COLOR && request.getC() <= MAX_COLOR;
    }
}
