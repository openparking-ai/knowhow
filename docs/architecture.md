# Architecture

```
┌──────────────────────┐         ┌───────────────────────┐
│  lane controller     │ events  │  platform             │
│  (Jetson, at gate)   │────────▶│  (Node/Express/PG)    │
│                      │◀────────│                       │
│  decides locally     │  rules  │  system of record     │
└──────────┬───────────┘         └───────────┬───────────┘
           │                                 │
   loop / camera / relay              operator dashboard
```

## The asymmetry

The lane decides. The platform records.

Every decision a lane makes — is this vehicle allowed, at what rate — is made
from rules already on the box, with no network call on the path between a car
arriving and a barrier opening. The platform's job is to keep those rules fresh
and to receive the events afterwards.

This is not an optimisation. A gate that stops working when a site's internet
drops is a gate that traps people in a car park, and site internet is exactly
the thing you cannot rely on. Designing for connectivity and adding an offline
mode later does not produce the same system; the fallback paths end up being the
ones nobody tested.

## Why the stack is split

**Platform: Node / Express / Postgres.** The same stack as the rest of the
estate, which means the operational knowledge already exists — deployment,
backup, migration discipline, monitoring.

**Lane controller: Python.** Because the vision work lives in the Jetson
ecosystem and the Jetson ecosystem is Python. Fighting that would mean
maintaining bindings forever for no gain.

The two talk over HTTP with a documented event schema. Neither imports the
other.

## What the platform holds

- Tenants, sites, lanes.
- Allow and pricing rules — the source of truth the lane caches.
- The event record: every arm, every identification, every decision, every vend,
  with confidence scores attached.

Every tenant-owned table has row-level security enabled and forced. See
[multi-tenancy-and-rls.md](multi-tenancy-and-rls.md).

## What the lane holds

- A cached copy of the rules for its own site, with an age on it.
- A queue of events not yet delivered.
- Nothing else. A lane controller is replaceable; losing one loses no data that
  was not already reported or is not about to be.

---

Built by 72 Knots Method by 72Knots.ai
