import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';

export const analyzeTrendsTool = tool({
  description: 'Analyze bug trends and patterns across the database. Returns statistics about severity distribution, common areas, and problem patterns.',
  inputSchema: z.object({
    timeframe: z.enum(['last_day', 'last_week', 'last_month', 'all_time']).default('all_time').describe('Time period to analyze'),
    focusArea: z.enum(['FRONTEND', 'BACKEND', 'INFRA', 'DATA']).nullish().describe('Focus analysis on specific area'),
  }),
  execute: async ({ timeframe, focusArea }) => {
    const now = new Date();
    let dateFilter: Date | undefined;

    switch (timeframe) {
      case 'last_day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = undefined;
    }

    const whereClause = {
      ...(dateFilter && { created_at: { gte: dateFilter } }),
      ...(focusArea && { area: focusArea }),
    };

    const [totalBugs, severityBreakdown, areaBreakdown, statusBreakdown] = await Promise.all([
      prisma.bug.count({ where: whereClause }),
      prisma.bug.groupBy({
        by: ['severity'],
        where: whereClause,
        _count: true,
      }),
      prisma.bug.groupBy({
        by: ['area'],
        where: whereClause,
        _count: true,
      }),
      prisma.bug.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
    ]);

    const criticalBugs = await prisma.bug.findMany({
      where: {
        ...whereClause,
        severity: { in: ['S0', 'S1'] },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        title: true,
        severity: true,
        area: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    return {
      summary: {
        total_bugs: totalBugs,
        timeframe,
        focus_area: focusArea || 'all',
      },
      severity_distribution: severityBreakdown.map(s => ({
        severity: s.severity || 'unassigned',
        count: s._count,
        percentage: ((s._count / totalBugs) * 100).toFixed(1),
      })),
      area_distribution: areaBreakdown.map(a => ({
        area: a.area || 'unassigned',
        count: a._count,
        percentage: ((a._count / totalBugs) * 100).toFixed(1),
      })),
      status_distribution: statusBreakdown.map(s => ({
        status: s.status,
        count: s._count,
        percentage: ((s._count / totalBugs) * 100).toFixed(1),
      })),
      insights: {
        critical_open_bugs: criticalBugs.map(b => ({
          id: b.id,
          title: b.title,
          severity: b.severity,
          area: b.area,
          status: b.status,
        })),
      },
    };
  },
});

