package com.pixelhub.backend.security;

import java.security.Principal;

public record TokenPrincipal(String name) implements Principal {
    @Override
    public String getName() {
        return name();
    }
}
