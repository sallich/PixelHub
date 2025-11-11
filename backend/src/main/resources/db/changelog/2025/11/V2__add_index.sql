-- liquibase formatted sql

-- changeset maxpri:add_index
CREATE INDEX idx_pixels_placed_at_xy ON pixels(placed_at DESC, x, y);
