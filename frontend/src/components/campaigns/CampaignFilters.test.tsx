import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PublicCategory } from '@/shared';
import { CategoryTabs, filterHref } from './CampaignFilters';

const category = (code: string, name: string, icon: string, sortOrder: number): PublicCategory => ({
  id: code,
  code,
  name,
  icon,
  description: null,
  sortOrder,
});

describe('CategoryTabs', () => {
  it('renders one tab per category from the API data, including one added later by ADMIN', () => {
    render(
      <CategoryTabs
        categories={[
          category('ORPHAN_SPONSORSHIP', 'كفالة أيتام', 'child', 10),
          category('FOOD_BASKETS', 'سلال غذائية', 'basket', 40),
          category('NEW_THING', 'تصنيف بمفتاح أيقونة غير معروف', 'not-a-key', 50),
        ]}
        active="FOOD_BASKETS"
        allLabel="الكل"
        label="تصنيفات الحملات"
      />,
    );
    expect(screen.getByRole('link', { name: 'الكل' })).toHaveAttribute('href', '/#campaigns');
    const food = screen.getByRole('link', { name: 'سلال غذائية' });
    expect(food).toHaveAttribute('href', '/?category=FOOD_BASKETS#campaigns');
    expect(food).toHaveAttribute('aria-current', 'page');
    // An unknown icon key still renders (falls back to the brand star).
    expect(
      screen.getByRole('link', { name: 'تصنيف بمفتاح أيقونة غير معروف' }).querySelector('svg'),
    ).not.toBeNull();
  });
});

describe('filterHref', () => {
  it('keeps both filters in the URL', () => {
    expect(filterHref({ category: 'HOME_RENOVATION', priority: 'URGENT' })).toBe(
      '/?category=HOME_RENOVATION&priority=URGENT#campaigns',
    );
  });
});
