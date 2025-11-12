package com.pixelhub.backend.kafka.listener;

import com.pixelhub.backend.model.dto.PixelDto;
import com.pixelhub.backend.model.dto.PixelPlacedEvent;
import com.pixelhub.backend.model.dto.WebSocketMessage;
import com.pixelhub.backend.model.entity.Pixel;
import com.pixelhub.backend.repository.PixelRepository;
import com.pixelhub.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class KafkaPixelListener {

    private final PixelRepository pixelRepository;

    private final UserRepository userRepository;

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "pixel-placed", groupId = "pixel-service", containerFactory = "kafkaListenerContainerFactory")
    @Transactional
    public void place(PixelPlacedEvent event) {
        PixelDto pixelDto = event.getPixelDto();

        Pixel pixel = new Pixel();
        pixel.setX(pixelDto.getX());
        pixel.setY(pixelDto.getY());
        pixel.setColor(pixelDto.getC());
        pixel.setPlacedAt(Instant.now());
        pixelRepository.save(pixel);

        userRepository.save(event.getUser());

        WebSocketMessage<PixelDto> msg = new WebSocketMessage<>("get", pixelDto);
        messagingTemplate.convertAndSend("/topic/pixels", msg);
    }
}