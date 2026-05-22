package com.bookstore.config;

import com.bookstore.util.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

/**
 * Interceptor that extracts guest session ID from cookies or headers
 * and makes it available to controllers via request attribute
 */
@Slf4j
@Component
public class GuestSessionInterceptor implements HandlerInterceptor {

    private static final String SESSION_ATTRIBUTE = "guestSessionId";
    private static final String HEADER_NAME = "X-Session-Id";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // First try to get session ID from cookie (preferred method)
        Optional<String> sessionFromCookie = CookieUtils.getGuestSessionIdFromCookies(request);

        if (sessionFromCookie.isPresent()) {
            request.setAttribute(SESSION_ATTRIBUTE, sessionFromCookie.get());
            log.debug("Guest session extracted from cookie: {}", sessionFromCookie.get());
            return true;
        }

        // Fallback: Try to get from X-Session-Id header (for migration support)
        String sessionFromHeader = request.getHeader(HEADER_NAME);
        if (sessionFromHeader != null && sessionFromHeader.startsWith("guest-")) {
            request.setAttribute(SESSION_ATTRIBUTE, sessionFromHeader);
            log.debug("Guest session extracted from header (migration): {}", sessionFromHeader);
            return true;
        }

        // No session found - controllers will create one if needed
        log.debug("No guest session found in request");
        return true;
    }
}
