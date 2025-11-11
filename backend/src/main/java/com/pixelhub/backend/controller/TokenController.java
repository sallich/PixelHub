package com.pixelhub.backend.controller;

import com.pixelhub.backend.model.dto.GenerateTokenDto;
import com.pixelhub.backend.model.dto.TokenDto;
import com.pixelhub.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TokenController {
    private final JwtService jwtService;

    @PostMapping("/token")
    TokenDto generateToken(@RequestBody GenerateTokenDto dto) {
        return TokenDto.builder()
                .token(jwtService.generateNewToken(dto.getNickname()))
                .nickname(dto.getNickname())
                .build();
    }

    @PostMapping("/token-refresh")
    TokenDto refreshToken(@RequestBody TokenDto dto) {
        return TokenDto.builder()
                .token(jwtService.refreshToken(dto.getToken(), dto.getNickname()))
                .nickname(dto.getNickname())
                .build();
    }
}
