# Hardware

Reference specification. **None of this has been purchased**, and none of it is
required to develop against the platform — the lane controller runs its whole
sequence against simulated hardware, and its tests pass on any machine.

## Controller

**Seeed reComputer Industrial J3011** (Jetson Orin NX), mounted in the gate
housing.

Chosen because the vision work lives in the Jetson ecosystem, and because the
industrial variant is built for a roadside enclosure — wide temperature range,
DIN mounting, no fan to fail. Putting the controller in the gate housing rather
than in a comms room keeps the run from camera to compute short and keeps the
lane working when everything upstream of it is not.

## Barrier

**Q-SAQ**, driven by a dry-contact vend relay.

The controller pulses the relay to open. **The barrier closes itself on its own
closing loop** — that loop is wired to the barrier and never to the controller.
Gate timing is a barrier setting configured by the installer, not a value in our
config file. See [lane-sequence.md](lane-sequence.md) for why this is not
negotiable.

## Detection

Loops, and there are three kinds of them. Two of the three are counted in the
lane's configuration, and those counts are published with the events they
govern rather than being assumed by a reader.

- **Arming loops** — inductive, upstream of the barrier. They trigger the read.
  One or two: with two, both must read occupied together, so an object has to
  span the gap between them.
- **Closing loop** — under the barrier, wired to the barrier. The controller has
  no visibility of it and no influence over it, and that is the safety case in
  [lane-sequence.md](lane-sequence.md).
- **Confirmation loops** — a pair after the barrier, read by the controller and
  never driven by it. Crossed in order, they say a vehicle actually went
  through, and which way. Zero or two, never one: one loop sees an occupancy
  and cannot tell a vehicle going in from one backing out.

Spacings and the confirmation window are site settings and assumptions.

## Cameras

Tiered. **RTSP and PoE are required for any camera on this platform** — no
proprietary streaming protocol, no cloud round-trip, no separate power run.

| Tier | Camera | Where it fits |
|---|---|---|
| Default | Reolink RLC-810A | Most lanes. 4K, PoE, RTSP, inexpensive enough to specify two. |
| Upper | Axis P1465-LE | Difficult light, long warranty expectations, sites with an existing Axis estate. |
| Upper | Hanwha XNO-9082R | Long-range lanes, harsh environments. |

The tiering exists because plate reading is dominated by optics and lighting,
not by the model. A better camera on a hard lane beats a better model on a bad
image, and it is usually cheaper.

## Payment

**A Stripe smart reader on the exit lane**, on the lane's network. Exit lanes
only — an entry lane takes no money and gets no reader.

The reader is driven by Stripe's server-driven integration: the controller
commands it through the Stripe API, and nothing of ours runs on the device — no
SDK, no application, only the reader's own software. That is why the
controller's Python is sufficient. Stripe's server-driven readers today:
**BBPOS WisePOS E**, **Stripe Reader S700 / S710**, and the Verifone smart
readers (**V660p, UX700, P630, M425**; availability varies by country). The
UX700 is the one Stripe names for unattended use, parking garages included,
and it takes Ethernet.

The reader's own screen carries the fee, so the payment leg adds no display
hardware. The same screen collects a phone number, which is how the receipt is
texted — on the S700 / S710 and the WisePOS E; Stripe's on-screen inputs are not
offered on the Verifone readers.

### Offline payment

Opt-in, and not part of the default build.

Stripe's offline mode exists only in its iOS, Android and React Native SDKs.
There is no server-driven offline path, so the controller cannot hold a payment
while the internet is down. A garage that opts into offline adds a small Android
device on the same local network as the reader, running Stripe's SDK and
collecting only.

Stripe's own constraints, as they stand:

- 10,000 USD, or the equivalent, per offline transaction.
- The reader must have been connected online, on that same local network,
  within the last 24 hours.
- The reader's software must have been updated within the last 30 days.
- No magnetic stripe.
- No refund and no cancellation until the payment has forwarded to Stripe.

## What a lane costs to run

To be filled in from the first installed site, not estimated here. Numbers in
this repository come from lanes that exist.

---

Built by 72 Knots Method by 72Knots.ai
