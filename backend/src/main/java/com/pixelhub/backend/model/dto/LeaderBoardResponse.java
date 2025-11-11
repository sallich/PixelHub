package com.pixelhub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class LeaderBoardResponse {
    private List<UserDto> users;
}