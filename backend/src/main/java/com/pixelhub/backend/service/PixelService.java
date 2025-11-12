package com.pixelhub.backend.service;

import com.pixelhub.backend.model.dto.PixelDto;
import com.pixelhub.backend.model.dto.PixelPlacedEvent;
import com.pixelhub.backend.model.entity.Pixel;
import com.pixelhub.backend.repository.PixelRepository;
import com.pixelhub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PixelService {

    private final UserRepository userRepository;
    private final PixelRepository pixelRepository;
    private final KafkaTemplate<String, PixelPlacedEvent> kafkaTemplate;

    @Value("${app.rate-limit-seconds:30}")
    private int rateLimitSeconds;
    @Value("${app.canvas-width:2000}")
    private int canvasWidth;
    @Value("${app.canvas-height:2000}")
    private int canvasHeight;
    @Value("${app.min-color:0}")
    private int minColor;
    @Value("${app.max-color:127}")
    private int maxColor;
    @Value("${pixel.kafka.topic:pixel-placed}")
    private String topic;

    public void placePixel(PixelDto request, String nickname) {
        if (!isValid(request)) {
            return;
        }

        userRepository.findByNickname(nickname).ifPresent(user -> {
            if (user.getLastPlacedAt() != null &&
                Instant.now().isBefore(user.getLastPlacedAt().plusSeconds(RATE_LIMIT_SECONDS))) {
                return;
            }

            user.setPixelCount(user.getPixelCount() + 1);
            user.setLastPlacedAt(Instant.now());

            PixelPlacedEvent event = new PixelPlacedEvent(request, user);
            kafkaTemplate.send(topic, event);
        });
    }

    public List<Pixel> getFullBoard() {
        return pixelRepository.findCurrentBoardState();
    }

    public List<Pixel> getBoardStateAtTime(Instant timestamp) {
        return pixelRepository.findBoardStateAtTime(timestamp);
    }

    private boolean isValid(PixelDto request) {
        return request.getX() != null && request.getX() >= 0 && request.getX() < canvasWidth &&
               request.getY() != null && request.getY() >= 0 && request.getY() < canvasHeight &&
               request.getC() != null && request.getC() >= minColor && request.getC() <= maxColor;
    }
}
