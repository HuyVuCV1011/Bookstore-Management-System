package com.bookstore.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;
import java.util.UUID;

@Getter
public class CustomUserDetails extends User {

    private final UUID userId;

    public CustomUserDetails(
            UUID userId,
            String username,
            String password,
            boolean accountNonLocked,
            Collection<? extends GrantedAuthority> authorities
    ) {
        super(username, password, true, true, true, accountNonLocked, authorities);
        this.userId = userId;
    }
}
