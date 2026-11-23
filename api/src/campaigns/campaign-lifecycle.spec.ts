import type { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import { CampaignStatsService } from './campaign-stats.service';
import { CampaignsService, lifecycleProblem } from './campaigns.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const ID = '44444444-4444-4444-4444-444444444444';
const admin = user(Role.ADMIN);

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  const config = { get: () => 'true' } as unknown as ConfigService;
  return new CampaignsService(
    prisma as PrismaService,
    new CampaignStatsService(prisma as PrismaService, config),
    audit as AuditService,
    new RoleAccessService(),
    { campaignPublished: jest.fn().mockResolvedValue(0) } as unknown as NotificationsService,
  );
}

const campaignRow = (over: Record<string, unknown> = {}) => ({
  id: ID,
  caseId: null,
  case: null,
  status: 'ACTIVE',
  acceptsPledges: true,
  publishedAt: new Date('2026-10-01'),
  verifiedAmount: new Prisma.Decimal(0),
  titleAr: 'ترميم سقف منزل',
  titleEn: null,
  summaryAr: 'سقف منزل أسرة تضرر من الأمطار.',
  summaryEn: null,
  coverKey: 'home-1',
  area: 'حي البعث',
  priority: 'NORMAL',
  ...over,
});

/** A prisma double whose transaction client records the campaign update and pledge count. */
function lifecycleDb(row: ReturnType<typeof campaignRow>, openPledges = 0) {
  const update = jest.fn(({ data }: { data: Record<string, unknown> }) => ({
    ...row,
    ...data,
  }));
  const caseUpdate = jest.fn();
  const tx = {
    campaign: { findUnique: jest.fn().mockResolvedValue(row), update },
    pledge: { count: jest.fn().mockResolvedValue(openPledges) },
    case: { update: caseUpdate },
  };
  const prisma = {
    campaign: { findUnique: jest.fn().mockResolvedValue(row) },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  };
  return { prisma, tx, update, caseUpdate };
}

describe('lifecycleProblem (campaign status rules)', () => {
  const base = {
    from: 'ACTIVE' as const,
    to: 'ACTIVE' as const,
    publishedAt: new Date(),
    resume: false,
    caseStatus: null,
    verifiedAmount: new Prisma.Decimal(0),
    openPledges: 0,
  };

  it.each([
    ['a closed campaign is final', { from: 'CLOSED', to: 'ACTIVE' }, 'campaign_closed'],
    [
      'a completed campaign does not reopen',
      { from: 'COMPLETED', to: 'ACTIVE' },
      'campaign_completed',
    ],
    [
      'a published campaign never returns to draft',
      { to: 'DRAFT' },
      'campaign_already_published',
    ],
    [
      'closing with verified money is refused (it would leave the public totals)',
      { to: 'CLOSED', verifiedAmount: new Prisma.Decimal(1000) },
      'campaign_has_money',
    ],
    [
      'closing with pledges on their way is refused',
      { to: 'CLOSED', openPledges: 2 },
      'campaign_has_money',
    ],
    [
      'pledges of a medical campaign under review do not resume',
      { resume: true, caseStatus: 'UNDER_REVIEW' },
      'case_review_pending',
    ],
  ])('%s', (_name, over, code) => {
    expect(
      lifecycleProblem({ ...base, ...over } as Parameters<typeof lifecycleProblem>[0]),
    ).toBe(code);
  });

  it.each([
    ['pause / resume a generic campaign', { resume: true }],
    ['publish a draft', { from: 'DRAFT', publishedAt: null }],
    ['close an empty draft', { from: 'DRAFT', to: 'CLOSED', publishedAt: null }],
    ['mark an active campaign completed', { to: 'COMPLETED' }],
    ['resume a published medical campaign', { resume: true, caseStatus: 'PUBLISHED' }],
  ])('allows: %s', (_name, over) => {
    expect(
      lifecycleProblem({ ...base, ...over } as Parameters<typeof lifecycleProblem>[0]),
    ).toBeNull();
  });
});

describe('CampaignsService.updateStatus (pause, resume, complete, close)', () => {
  it.each([Role.DONOR, Role.STAFF, Role.FINANCE_VERIFIER, Role.COLLECTOR])(
    '%s cannot change a campaign status',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma'), untouchable('audit')).updateStatus(
          ID,
          { acceptsPledges: false },
          user(role),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('needs a status or a pause flag', async () => {
    await expect(
      serviceWith(untouchable('prisma'), untouchable('audit')).updateStatus(ID, {}, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CASE_OFFICER manages only campaigns from the medical case pipeline', async () => {
    const { prisma } = lifecycleDb(campaignRow());
    await expect(
      serviceWith(prisma).updateStatus(ID, { acceptsPledges: false }, user(Role.CASE_OFFICER)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('pauses new pledges without touching the status, and audits it', async () => {
    const { prisma, tx, update } = lifecycleDb(campaignRow());
    const log = jest.fn();
    await serviceWith(prisma, { log }).updateStatus(ID, { acceptsPledges: false }, admin);
    expect(update.mock.calls[0][0].data).toEqual({ status: 'ACTIVE', acceptsPledges: false });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'campaign.status',
        before: { status: 'ACTIVE', acceptsPledges: true },
        after: { status: 'ACTIVE', acceptsPledges: false },
      }),
      tx,
    );
  });

  it('refuses to close a campaign that holds verified money', async () => {
    const { prisma, update } = lifecycleDb(
      campaignRow({ verifiedAmount: new Prisma.Decimal(500000) }),
    );
    await expect(
      serviceWith(prisma).updateStatus(ID, { status: 'CLOSED' }, admin),
    ).rejects.toThrow('campaign_has_money');
    expect(update).not.toHaveBeenCalled();
  });

  it('closing an empty draft stops pledges and closes its case', async () => {
    const { prisma, update, caseUpdate } = lifecycleDb(
      campaignRow({ status: 'DRAFT', publishedAt: null, caseId: 'case-1' }),
    );
    await serviceWith(prisma).updateStatus(ID, { status: 'CLOSED' }, admin);
    expect(update.mock.calls[0][0].data).toEqual({ status: 'CLOSED', acceptsPledges: false });
    expect(caseUpdate).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { status: 'CLOSED' },
    });
  });

  it('refuses to resume a medical campaign whose case is back under review', async () => {
    const { prisma } = lifecycleDb(
      campaignRow({
        caseId: 'case-1',
        case: { status: 'UNDER_REVIEW' },
        acceptsPledges: false,
      }),
    );
    await expect(
      serviceWith(prisma).updateStatus(ID, { acceptsPledges: true }, user(Role.CASE_OFFICER)),
    ).rejects.toThrow('case_review_pending');
  });
});

describe('CampaignsService.update (cover, summary, titles)', () => {
  it.each([Role.DONOR, Role.STAFF, Role.FINANCE_VERIFIER, Role.COLLECTOR])(
    '%s cannot edit a campaign',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma'), untouchable('audit')).update(
          ID,
          { coverKey: 'home-1' },
          user(role),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('writes only the changed fields, clears an emptied English text and audits the diff', async () => {
    const { prisma, tx, update } = lifecycleDb(campaignRow({ titleEn: 'Roof repair' }));
    const log = jest.fn();
    await serviceWith(prisma, { log }).update(
      ID,
      { coverKey: 'orphans-1', summaryAr: 'سقف منزل أسرة تضرر من الأمطار.', titleEn: ' ' },
      admin,
    );
    expect(update.mock.calls[0][0].data).toMatchObject({
      coverKey: 'orphans-1',
      titleEn: null,
    });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'campaign.update',
        before: { titleEn: 'Roof repair', coverKey: 'home-1' },
        after: expect.objectContaining({ titleEn: null, coverKey: 'orphans-1' }),
      }),
      tx,
    );
  });

  it('refuses an edit that changes nothing', async () => {
    const { prisma } = lifecycleDb(campaignRow());
    await expect(
      serviceWith(prisma).update(ID, { coverKey: 'home-1' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('a closed campaign is read-only', async () => {
    const { prisma } = lifecycleDb(campaignRow({ status: 'CLOSED' }));
    await expect(
      serviceWith(prisma).update(ID, { coverKey: 'orphans-1' }, admin),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('CampaignsService.addUpdate', () => {
  it('posts the update and writes an audit row', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'u1' });
    const tx = { campaignUpdate: { create } };
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE' }) },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    const log = jest.fn();
    await serviceWith(prisma, { log }).addUpdate(
      ID,
      { bodyAr: '  انتهى ترميم السقف، شكراً لكم.  ' },
      user(Role.STAFF),
    );
    expect(create.mock.calls[0][0].data).toMatchObject({
      campaignId: ID,
      bodyAr: 'انتهى ترميم السقف، شكراً لكم.',
      bodyEn: null,
    });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'campaign.post_update', entityId: ID }),
      tx,
    );
  });
});
