package com.pixelhub.backend.service;

import com.pixelhub.backend.exception.NonUniqueUsernameException;
import com.pixelhub.backend.model.entity.User;
import com.pixelhub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getLeaders() {
        return userRepository.findTop10ByOrderByPixelCountDesc();
    }

    @Value("${app.rate-limit-seconds}")
    private long rateLimitSeconds;

    public boolean existsByNickname(String nickname) {
        return userRepository.findByNickname(nickname).isPresent();
    }

    public User createByUsername(String username) {
        if (existsByNickname(username)) {
            throw new NonUniqueUsernameException(username);
        }
        User user = new User();
        user.setNickname(username);
        user.setPixelCount(0L);
        user.setLastPlacedAt(Instant.now().minusSeconds(rateLimitSeconds));
        return userRepository.save(user);
    }
}
