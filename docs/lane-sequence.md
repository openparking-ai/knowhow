# The lane sequence

What a lane does, and what it does instead when it cannot.

```
1. the arming loops report a vehicle presenting
2. controller grabs camera frame(s)
3. Vehicle ID: is a vehicle there at all, and if so, what is it and how sure are we
4. decision from LOCAL cached allow/pricing rules
5. vend relay opens the barrier, and a PENDING entry is recorded
6. the barrier closes itself on its own closing loop
7. the loops after the gate say whether a vehicle actually went through
8. the events are reported to the server when connectivity allows
```

Steps 5 to 7 do not always happen. Three answers at step 3 and 4 stop the
sequence there, each with its own event and none of them silent: nothing was
present, nothing could be identified, or the rules refuse this vehicle.

## Step 6 is the one to read twice

**The controller never closes the barrier.** The closing loop is wired to the
barrier, not to us, and there is no close method anywhere in the lane controller
codebase. A test asserts its absence.

The reason is a safety case, not a preference. A barrier that closes on a signal
from software can close on a vehicle when that software is wrong, and "wrong"
includes crashed, hung, misconfigured, and mid-deploy. A barrier that closes on
its own inductive loop cannot close while a vehicle is over that loop, and it
keeps that property whatever the controller is doing — including not running at
all.

This costs us nothing and removes an entire category of incident. It also means
gate timing is a barrier setting, configured by the installer, never a value in
our config file.

## Step 1: how many loops arm the lane is a site setting

A site declares whether it has one arming loop or two. With two, both must read
occupied together before anything happens, so an object has to span the gap
between them — a person standing on one loop with a piece of metal does not.
One loop reading alone arms nothing, and that is recorded rather than dropped.

A site with one arming loop is not refused. What it does not get is named in the
record on every vehicle rather than described here.

## Step 3 asks two questions, not one

**Is a vehicle there** is asked before **what is it**, and they are separate
answers. A car with a filthy or missing front plate is a legitimate entry and
must be admitted to the fallback path. A piece of metal on the loop is not a
vehicle and must receive nothing at all — no ticket, no session, no barrier.

That refusal is not a fallback. A fallback ends in a ticket and a human; this
ends in nothing, because there is no car. A rejected arming is logged, so a lane
being worked appears as a pattern instead of as silence.

**The presence gate is unvalidated against real vehicles, opt-in, and off until
a site turns it on.** Every number behind it was measured on synthetic scenes;
it has never seen a real lane. With it off, presence is "not measured" and the
lane behaves exactly as it did before the stage existed. Where it is on and
cannot answer, it also answers "not measured" — never "no vehicle", because a
confident no at a lane is a refused customer and refusing needs the same
evidence as admitting.

## Step 4 is local, always

The decision comes from rules already on the controller. There is no network
call between a vehicle arriving and a barrier opening.

Rules carry an age. If they are older than the configured maximum, the lane
stops trusting them and falls back — because acting on day-old pricing and
acting on no rules at all are different failures, and neither should look like a
normal open.

## Never wrong silently

Vehicle ID returns a confidence score, and **confidence is checked before the
plate is used to look anything up.** The ordering is the safety property: if the
rule lookup came first, an unsure read that happened to resolve to a known plate
would open the barrier for the wrong car. Instead, a low-confidence read never
reaches the rules at all.

Every fallback is a named path with an event behind it, visible to an operator,
and **the names are in the lane controller's code, not listed here.** This page
used to carry the list, which made it a second copy of a set that lives
somewhere else — and of two copies, the one nobody runs is the one that goes
wrong.

What is worth saying here is the rule the names obey: every cause of a fallback
gets its own name and an operator-visible consequence, and none is folded into
another. Different causes need different things said to the driver, so they
cannot share a code.

No fallback is "open anyway", and none is "pick the most likely plate". A fallback
costs an operator a glance at a screen; a wrong open bills a stranger's car to
somebody else and, worse, teaches the operator that the confidence score means
nothing.

**Tuning warning.** The confidence threshold exists to be set by someone who has
looked at their own lane's read quality. It does not exist to be lowered until
the fallback rate looks good in a report. Lowering it does not improve
identification; it just moves failures from a visible column to an invisible one.

## Step 7: the ticket is not the entry

A vend creates a PENDING entry, not a session. A driver can pull up, take a
ticket and drive away, and a ticket no car ever followed is the oldest fraud in
this business — the abandoned ticket walks a car out inside the free grace
period.

A site may fit two loops after the barrier. Crossed A then B inside the
configured window, the pending entry becomes a session. B then A is somebody
backing out: no session and no occupancy, closed with its own reason. The window
elapsing with nothing at all is a THIRD answer and is held as one — voiding it
silently re-creates the abandoned ticket, and promoting it to a session invents
an occupant who fills a garage on paper and never in concrete.

An exit is the other way round, and it is the one asymmetry: the vend at an exit
IS the payment moment and the barrier opened, so the car is gone whatever the
loops saw. The session closes and the stay is billed, flagged for a human.
Otherwise fitting the loops would make a site worse than one without them.

A site with no loops after the gate is not refused. Every vehicle it lets in
carries "nothing could confirm this", on the session and on an event of its own.

Every loop count, spacing and window is a **per-site setting and an
assumption**. Nothing in the lane controller measures a spacing or a crossing
time, and each value is published with the events it governs so a reader of the
record cannot mistake it for something the software established.

## Step 8 is best effort, and last

Events queue locally and drain when the network allows. The queue is bounded for
the activity log and **unbounded for the session actions**: dropping the oldest
items in a long outage would drop the session opens first, so cars that entered
would have no session, exit to a refusal, and park free — the cheapest thing to
throw away was the most expensive. A dropped log event is counted rather than
silent, because a gap in the record that nobody knows about is worse than one
that is measured.

Nothing between a vehicle arriving and the barrier opening waits on a network
call.

---

Built by 72 Knots Method by 72Knots.ai
