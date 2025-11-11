package com.pixelhub.backend.controller;

import com.pixelhub.backend.exception.NonUniqueUsernameException;
import com.pixelhub.backend.exception.TokenParseException;
import com.pixelhub.backend.model.dto.ErrorDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Instant;

@ControllerAdvice
public class ErrorHandler {

    @ExceptionHandler(TokenParseException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorDto handleTokenParseException(final TokenParseException e) {
        return ErrorDto.builder()
                .message(e.getMessage())
                .timestamp(Instant.now())
                .build();
    }

    @ExceptionHandler(NonUniqueUsernameException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorDto handleNonUniqueUsernameException(final NonUniqueUsernameException e) {
        return ErrorDto.builder()
                .message(e.getMessage())
                .timestamp(Instant.now())
                .build();
    }
}
