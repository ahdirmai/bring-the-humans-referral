# Bring the humans

## Original concept

A field notebook for the person behind the prompt. The page treats an agent as a tool and human judgment as the contribution: discover a brief, build, and submit. The original six-stroke ink asterisk represents that human contribution. It appears as the make.fun invitation mark, the annotated hero drawing, and a small margin note. This is an independent referral advertisement, not an official platform interface.

The conversion goal is a person following the referral invitation and signing up on make.fun. Both primary links use **Start building**, with the complete referral URL and a plain explanation of attribution immediately adjacent. The first screen gives the workflow and potential reward currency and chain. No testimonials, user counts, performance figures, scarcity, or earnings examples are used. No payment is guaranteed.

## Art direction and design plan

| Token | Value | Purpose |
| --- | --- | --- |
| Paper | `#f4f0e3` | Warm notebook stock |
| Sheet | `#faf7ed` | Graph-paper insert and light button text |
| Ink | `#242d29` | Main text and structural rules |
| Cobalt | `#293fb3` | Display type, drawing, links, primary action |
| Pencil | `#58605a` | Supporting copy |
| Citron tape | `#e0e9b1` | Small physical accents, not text |

Type uses the local Iowan Old Style / Palatino / Georgia serif stack for expressive display text and the native system sans stack for highly readable copy. Native monospace is reserved for the literal referral URL and sequential process numbers. No font files or network requests are needed. Exact glyphs depend on the operating system.

The desktop composition is asymmetric and left aligned: a large two-line invitation beside an original taped graph-paper drawing. A punched binding rail holds the entire page together. The middle uses editorial columns and sequential notes, not equal feature cards. A cobalt closing note repeats the same action and disclosure. The mobile composition preserves the full proposition and action before the illustration, with comfortable type and tap targets.

```text
Desktop                         Mobile
mark + invitation     nav       mark             nav
                                Bring the
Bring the       taped note      humans.
humans.         + ink drawing   workflow + potential rewards
workflow                        Start building + referral
Start building + referral       taped drawing
--------------------------      -----------------------
process title   01 brief        process title
                02 build        01 / 02 / 03 notes
                03 submit       FAQ
FAQ title       native FAQ      cobalt final invitation
cobalt final invitation         footer
footer
```

Before implementation, the direction was checked against the brief: warm paper and serif type are intentional requirements, but a generic cream-and-clay marketing template would not give this page an identity. Cobalt handwriting, the punched rail, graph stock, a bespoke human-element sketch, and the asymmetric notes supply that identity. Unnecessary metrics, card grids, and decorative labels were removed. The sole large visual gesture is the headline and its companion ink drawing.

## Implementation

`index.html` contains all markup, styles, and original SVG art. There are no dependencies, scripts, remote fonts, analytics, tracking pixels, forms, or network-loaded assets. Open the file directly, or serve the directory with a static HTTP server. The only external navigation is the user-activated referral URL: `https://make.fun/r/ttzeesk6`.

Semantic landmarks, one h1, a skip link, visible focus, native keyboard-operable FAQ disclosures, and explicit referral copy support accessibility. The page has no animation or content dependent on JavaScript. FAQ answers use native details/summary and remain available with JavaScript disabled. The first reward answer starts expanded.

## Render review and verification

The final page was captured in Chromium at desktop, tablet, 390px and 320px, and in WebKit at 390px. The actual rendered images were inspected: the editorial composition, readable support copy and prominent first-screen CTA were retained. No horizontal overflow was measured at any tested width. Native FAQ disclosures and both referral CTAs were exercised; each reached https://make.fun/r/ttzeesk6 with HTTP 200 and the title @ahdirmai invited you to make.fun. No claim of completed signups is made: only the referral destination and page behavior were verified.
