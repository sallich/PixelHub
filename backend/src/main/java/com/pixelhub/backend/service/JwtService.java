package com.pixelhub.backend.service;

import com.pixelhub.backend.exception.TokenParseException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JwtService {

    @Value("${app.auth.jwt.secret}")
    private String secret;

    @Value("${app.auth.jwt.expiration-milliseconds}")
    private Long expirationMilliseconds;

    private final UserService userService;

    private JwtParser parser;

    @PostConstruct
    private void initJwtParser() {
        parser = Jwts.parserBuilder().setSigningKey(secret).build();
    }

    private String generateToken(String username) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationMilliseconds))
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }

    public String generateNewToken(String username) {
        userService.createByUsername(username);
        return generateToken(username);
    }

    public String refreshToken(String token, String username) {
        try {
            String subject = parser.parseClaimsJws(token).getBody().getSubject();
            validateSubject(subject, username);
            return generateToken(subject);
        } catch (ExpiredJwtException expiredJwtException) {
            String subject = expiredJwtException.getClaims().getSubject();
            validateSubject(subject, username);
            return generateToken(subject);
        } catch (Exception e) {
            throw new TokenParseException(e.getMessage());
        }
    }

    public Optional<String> extractNickname(String token) {
        try {
            return Optional.of(parser.parseClaimsJws(token).getBody().getSubject());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private void validateSubject(String tokenSubject, String expectedNickname) {
        if (!tokenSubject.equals(expectedNickname)) {
            throw new TokenParseException("Token subject mismatch");
        }
    }
}
