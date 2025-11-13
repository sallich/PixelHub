package com.pixelhub.backend.kafka.configuration;

import com.pixelhub.backend.model.dto.PixelPlacedEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConsumerConfiguration {

    @Bean
    public ConsumerFactory<String, PixelPlacedEvent> pixelConsumerFactory(KafkaProperties kafkaProperties) {
        Map<String, Object> consumerProperties = kafkaProperties.buildConsumerProperties();
        consumerProperties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        consumerProperties.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        return new DefaultKafkaConsumerFactory<>(
                consumerProperties,
                new StringDeserializer(),
                new JsonDeserializer<>(PixelPlacedEvent.class)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PixelPlacedEvent> pixelContainerFactory(
            ConsumerFactory<String, PixelPlacedEvent> consumerFactory
    ) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, PixelPlacedEvent>();
        factory.setConsumerFactory(consumerFactory);
        return factory;
    }
}