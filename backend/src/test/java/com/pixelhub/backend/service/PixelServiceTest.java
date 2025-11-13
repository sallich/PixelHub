package com.pixelhub.backend.service;

import com.pixelhub.backend.model.dto.PixelDto;
import com.pixelhub.backend.model.dto.PixelPlacedEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.annotation.DirtiesContext;
import java.time.Duration;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DirtiesContext
@EmbeddedKafka(partitions = 1, topics = "${pixel.kafka.topic:pixel-placed}")
@SpringBootTest
class PixelServiceTest {

    @Value("${pixel.kafka.topic:pixel-placed}")
    private String TOPIC;

    @Autowired
    private PixelService pixelService;

    @Autowired
    private EmbeddedKafkaBroker embeddedKafka;

    @Test
    void testKafkaPixelPlaceFlow() {
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps("testGroup", "true", embeddedKafka);
        consumerProps.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        consumerProps.put(JsonDeserializer.VALUE_DEFAULT_TYPE, PixelPlacedEvent.class.getName());

        var consumerFactory = new DefaultKafkaConsumerFactory<>(
                consumerProps,
                new StringDeserializer(),
                new JsonDeserializer<>(PixelPlacedEvent.class, false)
        );

        var consumer = consumerFactory.createConsumer();
        embeddedKafka.consumeFromAnEmbeddedTopic(consumer, TOPIC);

        pixelService.placePixel(new PixelDto(1, 2, 3), "nickname");
        ConsumerRecord<String, PixelPlacedEvent> record = KafkaTestUtils.getSingleRecord(consumer, TOPIC, Duration.ofSeconds(5));

        assertNotNull(record);
        PixelPlacedEvent event = record.value();
        assertEquals(1, event.getPixelDto().getX());
        assertEquals(2, event.getPixelDto().getY());
        assertEquals(3, event.getPixelDto().getC());
    }
}