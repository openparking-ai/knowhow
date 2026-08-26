# Multi-tenancy and row-level security

Every tenant-owned table is isolated twice: once by the application, and again
by Postgres itself. Two independent controls, so that two mistakes rather than
one are needed before data crosses a tenant boundary.

This is in from migration 0001. Retrofitting row-level security onto a schema
that grew up without it means auditing every table, every query and every code
path that ever assumed it could see everything — which is why it usually does
not happen.

## The template

Every tenant-owned table:

```sql
CREATE TABLE <table> (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE  ROW LEVEL SECURITY;

CREATE POLICY <table>_tenant_isolation ON <table>
  USING      (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
```

**`ENABLE` and `FORCE` are both needed.** `ENABLE` applies policies to everyone
except the table owner. `FORCE` closes that exemption.

**`USING` and `WITH CHECK` are both needed.** `USING` governs reads, updates and
deletes; `WITH CHECK` governs writes. Omit `WITH CHECK` and a tenant can insert
rows attributed to another tenant — writes wide open while reads look correct,
which is the worst version of this bug, because a read-focused test suite stays
green.

**`tenant_id NOT NULL`.** A nullable tenant column produces rows that match no
policy and that no tenant can reach. They are invisible, not safe.

## The trap that makes all of this look like it works when it does not

**A Postgres superuser bypasses row-level security unconditionally.** `FORCE`
does not stop one — `FORCE` only removes the table-owner exemption.

So an isolation test run as a superuser sees every tenant's rows *whether the
policies exist or not*. It fails on a correct schema, and no amount of fixing
the schema makes it pass, which invites whoever is looking at it to weaken the
assertion instead. Then the suite is green, the policies may or may not be
there, and nobody can tell the difference.

This bites hardest in CI, because the stock `postgres` service container hands
you a superuser by default.

The fix:

- The application connects as a role created `NOSUPERUSER NOBYPASSRLS`.
- The tests connect as that same role — not as the owner, not as `postgres`.
- The suite **asserts those role attributes before it asserts anything else**,
  so a failing isolation test cannot be "fixed" by granting `BYPASSRLS`.

## Prove the test can fail

A control that has never been observed failing is not known to be measuring
anything. The platform repository ships `scripts/rls-fail-control.sh`, which
builds a scratch database, strips row-level security from it, and **requires the
isolation suite to fail**. CI runs it on every pull request.

Observed on 2026-08-26, against Postgres 16:

- With RLS in place: 8 of 8 pass.
- With RLS stripped: 7 of 8 fail — including all six substantive isolation
  assertions, not merely the schema guard.

The one that still passes with RLS stripped is the role-attribute guard, which
is correct: the role did not change, only the policies did.

## The application still scopes its own queries

Row-level security is the backstop, not the plan. Queries carry their own
`WHERE tenant_id = $1`, and the tenant context is set with `SET LOCAL` inside a
transaction — never a plain `SET`, which would survive on a pooled connection
and leak into whatever borrows it next.

The context is also fail-closed: unset, it resolves to `NULL`, and
`tenant_id = NULL` is `NULL` rather than true. A connection that forgets to set
a tenant sees nothing, rather than everything.

---

Built by 72 Knots Method by 72Knots.ai
