# Open Parking AI — knowhow

The method behind Open Parking AI: how the system is put together, why it is put
together that way, and what it costs to run one. Everything we know about
building parking automation, published as we learn it.

This is the part most projects keep. Publishing the code without the know-how
gives you something you can read but not operate. The intent here is that
someone who has never met us can install a lane, run a site, and understand the
reasoning behind every choice — including the ones that turned out to be wrong.

## Contents

- [Architecture](docs/architecture.md) — the pieces and how they talk
- [The lane sequence](docs/lane-sequence.md) — arm, identify, decide, vend, and why nothing closes the gate
- [Multi-tenancy and row-level security](docs/multi-tenancy-and-rls.md) — how tenants are kept apart, twice
- [Hardware](docs/hardware.md) — reference bill of materials and the tiers
- [Payments](docs/payments.md) — why no card number ever reaches our code

## Repositories

| | |
|---|---|
| [platform](https://github.com/openparking-ai/platform) | Node/Express/Postgres server · AGPL-3.0 |
| [lane-controller](https://github.com/openparking-ai/lane-controller) | Python lane controller · AGPL-3.0 |
| knowhow | this repository · CC BY-SA 4.0 |

## Licence

Documentation in this repository is licensed **CC BY-SA 4.0** — see [LICENSE](LICENSE).
Use it, adapt it, build a business on it. Share your adaptations under the same
terms so the next person gets what you got.

The code repositories are AGPL-3.0. Different licence, same intent: share alike.

## Contributing

Corrections and additions are welcome, and require a signed CLA — see
[CONTRIBUTING.md](CONTRIBUTING.md). Field experience that contradicts something
written here is the most valuable contribution there is; please open an issue
rather than staying quiet about it.

---

Built by 72 Knots. Method by [72Knots.ai](https://72knots.ai)
