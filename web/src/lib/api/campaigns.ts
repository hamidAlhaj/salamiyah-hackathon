import 'server-only';
import type {
  CampaignLedger,
  Paginated,
  Priority,
  PublicCampaign,
  PublicCampaignDetail,
} from '@/shared';
import { apiFetch } from './client';

export interface CampaignListQuery {
  category?: string;
  priority?: Priority;
  /** Only campaigns in this public status (e.g. ACTIVE for collectors recording cash). */
  status?: 'ACTIVE' | 'FUNDED' | 'COMPLETED';
  page?: number;
  pageSize?: number;
  lang: 'ar' | 'en';
}

export function listCampaigns(query: CampaignListQuery) {
  return apiFetch<Paginated<PublicCampaign>>('/campaigns', {
    query: {
      category: query.category,
      priority: query.priority,
      status: query.status,
      page: query.page ? String(query.page) : undefined,
      pageSize: query.pageSize ? String(query.pageSize) : undefined,
      lang: query.lang,
    },
  });
}

/** Every public campaign (all pages): used for the platform totals on the home page. */
export async function listAllCampaigns(lang: 'ar' | 'en'): Promise<PublicCampaign[]> {
  const pageSize = 50;
  const first = await listCampaigns({ lang, page: 1, pageSize });
  const items = [...first.items];
  for (let page = 2; (page - 1) * pageSize < first.total; page += 1) {
    items.push(...(await listCampaigns({ lang, page, pageSize })).items);
  }
  return items;
}

export function getCampaign(slug: string, lang: 'ar' | 'en') {
  return apiFetch<PublicCampaignDetail>(`/campaigns/${encodeURIComponent(slug)}`, {
    query: { lang },
  });
}

export function getLedger(campaignId: string) {
  return apiFetch<CampaignLedger>(`/campaigns/${campaignId}/ledger`);
}
