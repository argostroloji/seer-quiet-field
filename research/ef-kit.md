# Electric Foundation (EF) kit — read from the Figma, 21 Oct 2026

Source: https://www.figma.com/design/cB6ZFMUkBwMBhHadLdiSmh/Seer-Branding (public view-only).
The file has four pages: **Web** (dark + light market grid, colour palette, trade ticket "Desktop - 1"),
**Brandbook** (logo construction, palette, type, applications), **UI/Social media**, **Page 4**.
Values below were read off the canvas at 200 % zoom and cross-checked by sampling swatch pixels
(sampling drifts ±1 per channel from colour management, so the labelled hex wins where there is one).

## Colour — "Color pallete" frame (node 417-4572)

| Role (kit label)        | Dark      | Light     |
|-------------------------|-----------|-----------|
| Page Background         | `#101013` | `#F7F7F9` |
| Card base               | `#1A1A1E` | `#FFFFFF` |
| Nested Surface          | `#1F1F24` | `#F1F1F4` |
| Text Primary            | `#EDEDF2` | `#17171C` |
| Text Secondary          | `#A8A8B3` | `#5C5C66` |
| Muted labels            | `#67676F` | `#8E8E99` |
| Button Primary          | `#7C33FF` ¹ | `#7C33FF` ¹ |
| Button Secondary        | `#241E33` | `#EFE9FC` |
| Button Secondary Text   | `#9C6FF2` | `#6C2BD9` |

¹ The kit's swatch *label* for Button Primary reads `67676F` in both modes — a copy-paste typo
  (the swatch itself is violet). Brandbook labels the violet `HEX 7C33FF`; pixel sampling agrees.
  Other entrants cite `#7D33FF`; we use the Brandbook value.

Brandbook extras: deep ink `#141123` (RGB 20/18/35) used on dark brand panels; white `#FFFFFF`.
Brand copy in the book calls the palette "vermilion, fog and graphite" — leftover wording; the shipped palette is violet.

## Type
- Primary: **PP Neue Montreal** (Pangram Pangram, commercial licence).
- Secondary: **Suisse Intl Mono** (Swiss Typefaces, commercial licence) — numbers, labels, metadata.
- Specimen "Aa01": the "01" is set in violet mono → numbers are the brand's signal.

## Mark & wordmark
- Mark: a hexagonal "S" built from two interlocking parallelogram forms on a **45° construction** —
  "opposing positions resolving into a single decision", two diamond counters = a market's outcomes.
- Wordmark: lowercase **seer**; s, e, r with squared curves and horizontal terminal cuts.
- Positioning line: **"Seer — Decision Infrastructure"**, "the base layer for market-driven decision-making,
  infrastructure on which prediction markets, governance, and coordination are built."
- Visual principle: "one clear signal against a quiet, neutral field" (Swiss-modernist calm, not trading-floor).

## Motifs seen
- Thin 45° diagonal guide lines over a pale grid (logo construction panel).
- Dot-matrix field fading to violet glow (app-icon panel).
- Violet gradient glow from the bottom of dark panels (phone mockup).
- Converging-lines / ray posters on the Brandbook "Frame 117" column.

## Components (Web page, dark/light market grid)
- Top bar: mark + wordmark, pill search ("Search markets…"), text nav (Markets, Create Market, Policies, App), "Connect Wallet" pill.
- Category row: back chevron, active chip = filled violet rounded-rect ("All"), others plain text.
- Market card: card base, ~10 px radius; header = 32 px thumbnail + 2-line question; rows on nested surface
  (~6 px radius): label · % · **Yes** (filled violet small) · **No** (Button Secondary bg + violet text).
- Binary/up-down cards: full-width **Up** (primary) / **Down** (secondary) buttons.
- Multi-team: three equal buttons (Argentina / Draw / England), selected = primary.
- Footer row: `$170K Vol. • 9:00PM • World Cup` muted mono-ish + share/bookmark icons; "● LIVE" in red.
- Trade ticket ("Desktop - 1"): question, Yes/No toggles, amount `$100.00`, primary CTA.

## Kit issues we fixed (also listed as departures)
- Button Primary label typo (above).
- Muted labels `#67676F` on `#1A1A1E` = 3.2:1 → fails AA for body text; we lift to `#8A8A94` for text ≤ 14 px
  and keep `#67676F` for non-text strokes/dividers.
- The kit sample market "69¢ / 37¢" (reported by others) sums to 106¢; we always show complementary prices.
