package com.charitydiscount.affiliate;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
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
//    try {
//      String token = request.getHeader(HttpHeaders.AUTHORIZATION).substring(6).trim();
//      FirebaseAuth.getInstance().verifyIdToken(token);
//    } catch (Exception e) {
//      e.printStackTrace();
//      throw new ForbiddenException();
//    }

    return true;
  }
}
