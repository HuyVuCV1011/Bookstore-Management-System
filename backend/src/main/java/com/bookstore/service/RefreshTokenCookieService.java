package com.bookstore.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenCookieService {

    @Value("${security.cookie.name:refreshToken}")
    private String cookieName;

    @Value("${security.cookie.path:/api/auth}")
    private String cookiePath;

    @Value("${security.cookie.domain:#{null}}")
    private String cookieDomain;

    @Value("${security.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${security.cookie.same-site:Lax}")
    private String cookieSameSite;

    public void setRefreshTokenCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path(cookiePath)
                .maxAge(maxAgeSeconds)
                .sameSite(cookieSameSite);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path(cookiePath)
                .maxAge(0)
                .sameSite(cookieSameSite);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }
}
