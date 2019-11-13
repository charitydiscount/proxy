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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AffiliateController {
  final private List<AffiliateService> affiliateServices;

  @GetMapping("/programs/{programId}/promotions")
  public List<AdvertiserPromotion> getPromotionsForProgram(@PathVariable int programId) {
    Map<Integer, List<AdvertiserPromotion>> advertiserPromotions = new HashMap<>();
    MemcacheService memcacheService = MemcacheServiceFactory.getMemcacheService();
    Object cachedData = memcacheService.get(getCacheKey(programId));

    if (cachedData != null) {
      //noinspection unchecked
      return (List<AdvertiserPromotion>) cachedData;
    } else if (memcacheService.get("cached") != null) {
      return new ArrayList<>();
    }

    for (AffiliateService affiliateService : affiliateServices) {
      affiliateService.getPromotions().forEach(
          (promotion) -> advertiserPromotions.computeIfAbsent(promotion.getProgramId(),
              (k) -> new ArrayList<>())
              .add(promotion));
    }

    advertiserPromotions.forEach((id, promotions) -> memcacheService.put(getCacheKey(id), promotions,
        Expiration.byDeltaSeconds(3600)));
    memcacheService.put("cached", true, Expiration.byDeltaSeconds(3600));

    return advertiserPromotions.getOrDefault(programId, new ArrayList<>());
  }

  private String getCacheKey(int programId) {
    return "prom-" + programId;
  }
}
