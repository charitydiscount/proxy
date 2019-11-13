package com.charitydiscount.affiliate;

import com.charitydiscount.affiliate.models.AdvertiserPromotion;

import java.util.List;

public interface AffiliateService {
  public List<AdvertiserPromotion> getPromotions();
  public List<AdvertiserPromotion> getPromotions(int programId);
}
