import { Program } from "../serializers/market";
import { Commission } from "../serializers/commission";

interface AffiliateService {
  getPrograms(): Promise<Program[]>;
  getCommissions(): Promise<Commission[]>;
}
