export const adminDashboardMock = {
  source: 'demo',
  updatedAt: '2026-08-06T09:30:00+09:00',
  signups: {
    today: 24,
    last7Days: 148,
    trend: [
      { date: '2026-07-31', count: 16 },
      { date: '2026-08-01', count: 19 },
      { date: '2026-08-02', count: 14 },
      { date: '2026-08-03', count: 21 },
      { date: '2026-08-04', count: 25 },
      { date: '2026-08-05', count: 29 },
      { date: '2026-08-06', count: 24 },
    ],
  },
  consultations: {
    requests: 842,
    successes: 791,
    failures: 51,
    successRate: 93.9,
  },
  fastApi: {
    averageResponseMs: 284,
    status: 'healthy',
  },
  errors: {
    http422: 12,
    http500: 3,
    timeout: 5,
  },
  simulations: {
    runs: 324,
    saves: 187,
    saveRate: 57.7,
  },
  products: {
    asOfDate: '2026-08-05',
    version: '2026.08-r3',
    deposits: 148,
    savings: 92,
    etfs: 318,
  },
}
