package com.pixelhub.backend.repository;

import com.pixelhub.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByNickname(String nickname);

    List<User> findTop10ByOrderByPixelCountDesc();
}
