package com.charitydiscount.affiliate;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class AffiliateInterceptor implements HandlerInterceptor {
    public AffiliateInterceptor() throws IOException {
        FirebaseOptions options = new FirebaseOptions.Builder()
            .setCredentials(GoogleCredentials.getApplicationDefault())
            .setDatabaseUrl("https://charitydiscount.firebaseio.com/")
            .build();
        FirebaseApp.initializeApp(options);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isEmpty()) {
            throw new ForbiddenException();
        }
        try {
            String token = authorization.substring(6).trim();
            FirebaseAuth.getInstance().verifyIdToken(token);
        } catch (Exception e) {
            e.printStackTrace();
            throw new ForbiddenException();
        }

        return true;
    }
}
