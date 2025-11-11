package com.pixelhub.backend.config;

import com.pixelhub.backend.exception.TokenParseException;
import com.pixelhub.backend.security.TokenPrincipal;
import com.pixelhub.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AuthChannelInterceptor implements ChannelInterceptor {

    private JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            if (authorization != null && !authorization.isEmpty()) {
                String token = authorization.get(0);
                String nickname = jwtService.extractNickname(token).orElseThrow(() ->
                        new TokenParseException(token)
                );
                TokenPrincipal userPrincipal = new TokenPrincipal(nickname);
                accessor.setUser(userPrincipal);
            }
        }
        return message;
    }
}
