package com.bookstore.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.Optional;

public class CookieUtils {

    private static final String COOKIE_NAME = "GUEST_SESSION_ID";
    private static final int MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
    private static final String COOKIE_PATH = "/api";

    /**
     * Generate a unique session ID for guest users
     * Format: guest-{timestamp}-{random}
     */
    public static String generateSessionId() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = Long.toString(Math.abs(new java.util.Random().nextLong()), 36).substring(0, 9);
        return "guest-" + timestamp + "-" + random;
    }

    /**
     * Create a guest session cookie with the given session ID
     */
    public static Cookie createGuestSessionCookie(String sessionId) {
        Cookie cookie = new Cookie(COOKIE_NAME, sessionId);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(MAX_AGE_SECONDS);
        cookie.setAttribute("SameSite", "Lax");
        return cookie;
    }

    /**
     * Extract guest session ID from request cookies
     */
    public static Optional<String> getGuestSessionIdFromCookies(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && value.startsWith("guest-"))
                .findFirst();
    }

    /**
     * Create a delete cookie (Max-Age=0) to remove guest session
     */
    public static Cookie deleteGuestSessionCookie() {
        Cookie cookie = new Cookie(COOKIE_NAME, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(0);
        return cookie;
    }

    /**
     * Refresh cookie expiration to 7 days from now
     */
    public static void refreshCookieExpiration(HttpServletResponse response, String sessionId) {
        Cookie cookie = createGuestSessionCookie(sessionId);
        response.addCookie(cookie);
    }

    /**
     * Check if a cookie with the given name exists in the request
     */
    public static boolean hasCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return false;
        }
        return Arrays.stream(request.getCookies())
                .anyMatch(cookie -> cookieName.equals(cookie.getName()));
    }
}
