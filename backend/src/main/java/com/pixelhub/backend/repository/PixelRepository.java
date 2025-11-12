package com.pixelhub.backend.repository;

import com.pixelhub.backend.model.entity.Pixel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PixelRepository extends JpaRepository<Pixel, Integer> {
    @Query(value = """
        SELECT DISTINCT ON (x, y) *
        FROM pixels
        ORDER BY x, y, placed_at DESC
        """, nativeQuery = true)
    List<Pixel> findCurrentBoardState();

    @Query(value = """
        SELECT DISTINCT ON (x, y) *
        FROM pixels
        WHERE placed_at <= :timestamp
        ORDER BY x, y, placed_at DESC
        """, nativeQuery = true)
    List<Pixel> findBoardStateAtTime(@Param("timestamp") Instant timestamp);
}
