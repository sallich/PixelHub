package com.pixelhub.backend.controller;

import com.pixelhub.backend.model.dto.ErrorDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Instant;

@ControllerAdvice
public class ErrorHandler {

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorDto handleException(final Exception e) {
        return ErrorDto.builder()
                .message(e.getMessage())
                .timestamp(Instant.now())
                .build();
    }
}
