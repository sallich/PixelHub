package com.pixelhub.backend.exception;

public class NonUniqueUsernameException extends RuntimeException {
    public NonUniqueUsernameException(String message) {
        super(message);
    }
}
