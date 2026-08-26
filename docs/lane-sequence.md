# The lane sequence

Fixed. Every lane does exactly this, in exactly this order.

```
1. arming loop detects a vehicle
2. controller grabs camera frame(s)
3. Vehicle ID: plate, make, model, colour, distinguishing marks, confidence
4. decision from LOCAL cached allow/pricing rules
5. vend relay opens the barrier
6. the barrier closes itself on its own closing loop
7. the event is reported to the server when connectivity allows
```

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

There are four named fallback outcomes. Each is an explicit path with an event
behind it, visible to an operator:

| Fallback | Means |
|---|---|
| `LOW_CONFIDENCE` | The read was not good enough to act on |
| `NO_PLATE_READ` | No plate was found in the frames |
| `UNKNOWN_VEHICLE` | Good read, no rule for this vehicle |
| `STALE_RULES` | Good read, but the cached rules are too old to trust |

None of these is "open anyway". None is "pick the most likely plate". A fallback
costs an operator a glance at a screen; a wrong open bills a stranger's car to
somebody else and, worse, teaches the operator that the confidence score means
nothing.

**Tuning warning.** The confidence threshold exists to be set by someone who has
looked at their own lane's read quality. It does not exist to be lowered until
the fallback rate looks good in a report. Lowering it does not improve
identification; it just moves failures from a visible column to an invisible one.

## Step 7 is best effort, and last

Events queue locally and drain when the network allows. The queue is bounded, so
a lane offline for a week does not run the controller out of memory — and when
it overflows it *counts* what it dropped, because a gap in the record that
nobody knows about is worse than one that is measured.

Nothing in steps 1–6 waits on step 7.

---

Built by 72 Knots Method by 72Knots.ai
