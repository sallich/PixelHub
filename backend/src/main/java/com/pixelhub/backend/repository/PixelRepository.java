package com.pixelhub.backend.repository;

import com.pixelhub.backend.model.entity.Pixel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PixelRepository extends JpaRepository<Pixel, Integer> {
}
