# Payments

**A card number never passes through our code.** Not through the platform, not
through a lane controller, not through a log line, not through a support tool.

Payments are processor-tokenized end to end. The card is entered into a payment
form or terminal belonging to the processor; what reaches us is a token. Code
that would put a primary account number into a variable in this codebase is
rejected on review, and the rejection is not a matter of how carefully it is
written.

## Why this is stated as a rule rather than a guideline

Card data has a habit of arriving somewhere nobody intended: a debug log, an
error report, a request body captured by monitoring, a support ticket
attachment. Every one of those is a system that was never designed to hold it
and never had to be.

The only version of this problem that stays solved is the one where the data is
never in reach. Handling it carefully is a promise that has to be kept by every
future change, by every contributor, forever. Not handling it is a property of
the architecture, and it holds by itself.

It also decides the compliance question before it is asked. A system that cannot
receive a card number has a very different scope from one that merely tries not
to keep one.

## What this means in practice

- Tokens and processor references are stored. Card numbers, expiry dates and
  security codes are not.
- No endpoint accepts a card number, so none has to be careful about logging its
  body.
- Refunds and disputes are handled through the processor, using the token.
- Any integration that would require us to hold card data is the wrong
  integration, not a reason to make an exception.

## Review rule

Any change touching payment flow gets read specifically for this. The question
is not "does this look safe" but "could a primary account number reach a
variable here" — including via a webhook body, an error path, or a third-party
SDK's own logging.

---

Built by 72 Knots Method by 72Knots.ai
