package com.charitydiscount.affiliate;

import com.charitydiscount.affiliate.models.AdvertiserPromotion;
import com.charitydiscount.affiliate.models.PromotionsResponse;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.Nullable;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class TwoPerformantService implements AffiliateService {
  @Autowired
  private final RestTemplate restTemplate;

  @Autowired
  private final Environment environment;

  @Bean
  public static RestTemplate restTemplate() {
    return new RestTemplate();
  }

  @Nullable
  HttpHeaders getAuthHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
    headers.set("User-Agent", "PostmanRuntime/7.13.0");

    JSONObject credentials = new JSONObject();
    credentials.put("email", environment.getProperty("TWOP_EMAIL"));
    credentials.put("password", environment.getProperty("TWOP_PASS"));
    JSONObject userCredentials = new JSONObject();
    userCredentials.put("user", credentials);

    HttpEntity<String> request = new HttpEntity<>(userCredentials.toString(), headers);
    HttpHeaders authHeaders = new HttpHeaders();
    try {
      HttpEntity<String> response = restTemplate.exchange("https://api.2performant.com/users/sign_in",
          HttpMethod.POST,
          request,
          String.class);

      HttpHeaders responseHeaders = response.getHeaders();

      authHeaders.set("access-token", responseHeaders.get("access-token").get(0));
      authHeaders.set("client", responseHeaders.get("client").get(0));
      authHeaders.set("uid", responseHeaders.get("uid").get(0));
      authHeaders.set("token-type", responseHeaders.get("token-type").get(0));
      authHeaders.setContentType(MediaType.APPLICATION_JSON);
      authHeaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
      authHeaders.set("User-Agent", "PostmanRuntime/7.13.0");
    } catch (Exception e) {
      System.out.println(e.getClass());
      return null;
    }

    return authHeaders;
  }

  @Override
  public List<AdvertiserPromotion> getPromotions(int programId) {
    HttpHeaders httpHeaders = getAuthHeaders();

    PromotionsResponse response = getPromotionsForPage(httpHeaders, 1);
    ArrayList<AdvertiserPromotion> promotions = (ArrayList<AdvertiserPromotion>) response.advertiserPromotions;

    IntStream.range(response.pagination.currentPage + 1, response.pagination.pages).forEach(page -> {
      promotions.addAll(getPromotionsForPage(httpHeaders, page).advertiserPromotions);
    });

    promotions.removeIf(p -> p.getProgramId() != programId);
    promotions.forEach(p -> p.setSource("2p"));

    return promotions;
  }

  private PromotionsResponse getPromotionsForPage(HttpHeaders authHeaders, int page) {
    String url = String.format("https://api.2performant.com/affiliate/advertiser_promotions?filter[affrequest_status" +
        "]=accepted&page=%d&perpage=%d", page, 30);
    HttpEntity request = new HttpEntity<String>(null, authHeaders);
    ResponseEntity response = restTemplate.exchange(url, HttpMethod.GET, request, PromotionsResponse.class);

    return (PromotionsResponse) response.getBody();
  }
}
