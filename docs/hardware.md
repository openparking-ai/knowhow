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

- **Arming loop** — inductive, upstream of the barrier. Triggers the read. This
  is the only loop the controller sees.
- **Closing loop** — under the barrier, wired to the barrier. The controller has
  no visibility of it and no influence over it.

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

## What a lane costs to run

To be filled in from the first installed site, not estimated here. Numbers in
this repository come from lanes that exist.

---

Built by 72 Knots. Method by [72Knots.ai](https://72knots.ai)
