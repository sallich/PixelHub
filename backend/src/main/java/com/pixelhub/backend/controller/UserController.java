package com.pixelhub.backend.controller;

import com.pixelhub.backend.model.dto.LeaderBoardResponse;
import com.pixelhub.backend.model.dto.UserDto;
import com.pixelhub.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @ResponseBody
    @GetMapping("/leaderboard")
    public LeaderBoardResponse getLeaderBoard() {
        List<UserDto> userDtos = userService.getLeaders().stream()
                .map(u -> new UserDto(u.getNickname(), u.getPixelCount()))
                .toList();
        return new LeaderBoardResponse(userDtos);
    }
}