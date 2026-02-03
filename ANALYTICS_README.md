# Analytics Data Flow & Performance

## Overview
This project provides two analytics surfaces:
- **Advanced Analytics (Reports)** for detailed, filterable insights with drilldowns.
- **Analytics Dashboard** for high-level KPI summaries and alerts.

## Data Flow
1. **Frontend** issues API calls through the shared client (tenant header + auth).
2. **Reports analytics endpoints** compute metrics using `AnalyticsDataService`:
   - Date range filtering via `start_date`/`end_date`.
   - Segmentation via `segment_by` (grade/section/gender).
   - Drilldowns (class/section), fee ageing buckets, attendance anomalies.
3. **Dashboard analytics endpoints** serve overview stats and cached aggregates.
4. **Alerting** evaluates `AlertRule` definitions and records `AlertEvent` entries.

## Key Endpoints (v1)
- `/api/reports/analytics/*` (student performance, attendance trends, fee trends, drilldowns)
- `/api/dashboard/analytics/stats/` (overview stats)
- `/api/analytics/alert-rules/` (manage alert rules)
- `/api/analytics/alert-events/` (view/resolve alert events)

## Performance Notes
- **Caching:** Analytics queries use a tenant + filter hash cache key (5 minutes).
- **Async reports:** Report generation can run via Celery for large datasets.
- **Role-based access:** Finance analytics are restricted to finance/accountant roles.
- **Auto refresh:** UI supports polling on intervals for near-real-time updates.

## Scaling Tips
- Prefer date ranges to limit heavy aggregates.
- Keep drilldown filters narrow (grade/section) for faster response times.
- Use async generation for exports with large record counts.