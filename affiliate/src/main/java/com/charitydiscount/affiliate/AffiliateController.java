package com.charitydiscount.affiliate;

import com.charitydiscount.affiliate.models.AdvertiserPromotion;
import com.google.appengine.api.memcache.Expiration;
import com.google.appengine.api.memcache.MemcacheService;
import com.google.appengine.api.memcache.MemcacheServiceFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AffiliateController {
  final private List<AffiliateService> affiliateServices;

  @GetMapping("/programs/{programId}/promotions")
  public List<AdvertiserPromotion> getPromotionsForProgram(@PathVariable int programId) {
    List<AdvertiserPromotion> promotions = new ArrayList<>();

    MemcacheService memcacheService = MemcacheServiceFactory.getMemcacheService();
    Object cachedData = memcacheService.get(getCacheKey(programId));

    if (cachedData != null) {
      //noinspection unchecked
      return (List<AdvertiserPromotion>) cachedData;
    }

    for (AffiliateService affiliateService : affiliateServices) {
      promotions.addAll(affiliateService.getPromotions(programId));
    }

    memcacheService.put(getCacheKey(programId), promotions, Expiration.byDeltaSeconds(3600));
    return promotions;
  }

  private String getCacheKey(int programId) {
    return "prom-" + programId;
  }
}
