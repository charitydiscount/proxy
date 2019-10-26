import { Program } from "../serializers/program";
import { Commission } from "../serializers/commission";

interface AffiliateService {
  getPrograms(): Promise<Program[]>;
  getCommissions(): Promise<Commission[]>;
}
