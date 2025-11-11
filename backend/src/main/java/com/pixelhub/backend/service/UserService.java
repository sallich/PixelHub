package com.pixelhub.backend.service;

import com.pixelhub.backend.model.entity.User;
import com.pixelhub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getLeaders() {
        return userRepository.findTop10ByOrderByPixelCountDesc();
    }
}