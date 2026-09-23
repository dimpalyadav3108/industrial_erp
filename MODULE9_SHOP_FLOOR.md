# Module 9 — Shop Floor

Implemented on top of the cumulative Module 8 project.

## Shop Floor features
- Work Order / Job Card operator assignment
- Operator start / pause / stop / completion timestamps
- Production entry: produced, rejected, rework, scrap, actual hours
- Material consumption remains linked to production orders
- Quality check visibility through Quality Inspection status
- Downtime and downtime reason tracking
- WIP dashboard
- Delay dashboard
- Efficiency dashboard
- Rejection percentage
- OEE (Availability × Performance × Quality)
- Machine utilization
- Live shop-floor dashboard with 10-second auto refresh
- Operator "Assign me" action
- Quality module shortcut

No new Prisma schema migration was required for Module 9 because the existing ProductionJobCard, ProductionOperation, ProductionDowntime and QualityInspection models already contained the required execution fields.
