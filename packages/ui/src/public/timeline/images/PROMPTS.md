# Era backdrop images — Grok Imagine prompt pack

These sit **behind** each era band on the Biblical Timeline, faded to ~15–22% opacity
with the gold spine and cards on top. So they should read as **muted, atmospheric,
darker-toned** scenes — texture and mood, not fine detail (detail is lost at low opacity).

## How to add one
1. Generate an image with the matching prompt below (16:9 / landscape).
2. Save it as **`<era-key>.jpg`** in this folder (`/timeline/images/`).
   Keys: `primeval, exodus, judges, united, divided, exile, return, between, jesus, apostolic, john,`
   `antenicene, imperial, byzantine, medieval, reformation`
3. Reload `/timeline` — it appears automatically. No image = the era just shows its color tint.
   (Keep files reasonably small, ~150–400 KB each; they're a background wash, not a gallery.)

## Shared STYLE (paste in front of EVERY scene prompt)
> Aged illuminated-manuscript fresco meets cinematic matte painting. Muted, desaturated
> earth palette — parchment, ochre, deep umber, indigo — with restrained gold-leaf
> highlights. Painterly, textured like pigment on old vellum; soft directional light;
> reverent, atmospheric, slightly dark. Historically grounded Ancient Near East / Second
> Temple detail. 16:9 landscape, the key subject weighted to one side so the center stays
> calm. No text, no lettering, no people's faces in close-up, no modern elements, no
> borders or frames.

## Scenes (one per era)

**primeval** — *Primeval History & the Patriarchs (4004–1491 BC)*
> …the first dawn breaking over dark primordial waters; far off, a wooden ark resting on a
> distant mountain with a single dove in flight; above, the faint stars of an ancient
> covenant sky.

**exodus** — *Exodus & Conquest (1491–1451 BC)*
> …a vast desert wilderness at dusk; a towering pillar of cloud and fire over a distant
> encampment; Mount Sinai silhouetted against a smoldering sky.

**judges** — *The Judges (1451–1116 BC)*
> …a rugged Canaanite highland at twilight; a lone ram's-horn shofar resting on a rocky
> outcrop above scattered Iron-Age villages; low storm light.

**united** — *United Monarchy (1095–975 BC)*
> …Solomon's first Temple at golden hour, cedar beams and hammered gold; incense smoke of
> dedication rising into a warm sky; a stringed lyre in the foreground shadow.

**divided** — *Divided Monarchy (971–609 BC)*
> …two hill-cities separated by a deep valley under a bruised ochre sky; faint Assyrian
> winged-bull relief carved into a distant cliff.

**exile** — *Conquest & Exile (605–561 BC)*
> …Jerusalem burning on the far horizon at night; silhouettes of exiles seated by the
> rivers of Babylon; willow branches and a broken harp; deep indigo, mournful.

**return** — *Return & Second Temple (539–430 BC)*
> …cold dawn over a half-rebuilt temple foundation; laborers laying great stones amid
> timber scaffolding; a returning caravan small on the road; hopeful pale light.

**between** — *Between the Testaments (331–19 BC)*
> …Hellenistic-Roman colonnades rising over Judea; a nine-branched menorah rekindled by
> torchlight in a reclaimed temple court; Maccabean shields stacked in shadow.

**jesus** — *Life of Jesus (5 BC–AD 30)*
> …luminous nightfall over the hills of Bethlehem; one impossibly bright star low on the
> horizon; a shepherds' fire; warm gold light breaking through cloud.

**apostolic** — *The Apostolic Age (AD 34–68)*
> …a first-century eastern-Mediterranean harbor at dawn; a small wooden ship setting sail;
> Roman roads stretching outward over the hills; the glow of an oil lamp in the foreground.

**john** — *Fall of Jerusalem & the Apostle John (AD 70–99)*
> …the second Temple wreathed in flames beneath a Roman siege at dusk; and far away, a
> lone figure on the rocky isle of Patmos beneath a vast, stormy, apocalyptic sky.

### Church-age scenes (AD 100 → present)
For these five, keep the shared STYLE above **but swap the "Ancient Near East / Second Temple
detail"** line for period-appropriate grounding — *Roman → Byzantine → Gothic/medieval →
Reformation.* Same muted, painterly, fresco-on-vellum mood; one subject weighted to a side.

**antenicene** — *The Ante-Nicene Church (AD 100–312)*
> …a dim Roman catacomb passage lit by a single clay oil lamp; a faint fish (ichthys) and a
> Chi-Rho scratched into the tufa wall; far off through an opening, a Colosseum arch under a
> bruised, threatening sky. Hidden, reverent, the persecuted church.

**imperial** — *Imperial Church & the Councils (AD 313–476)*
> …the vast apse of an early basilica in gold mosaic, rows of bishops seated in council
> beneath it; a Chi-Rho labarum standard catching the light; and far away, the sun going
> down behind a broken Roman aqueduct — the West falling as the creed is written.

**byzantine** — *Byzantium, Islam & the Papacy (AD 476–1054)*
> …the great golden dome of Hagia Sophia at golden hour, a gold-ground icon of Christ
> Pantocrator half in shadow; on the far horizon, a rising minaret and crescent moon.
> Deep Byzantine blue and gilded light, East and South drifting apart.

**medieval** — *Medieval Christendom (AD 1054–1517)*
> …a soaring Gothic cathedral rising in timber scaffolding under a stormy plum sky; a
> crusader's cross-shield and an illuminated manuscript in the foreground shadow; far off,
> the great land walls of Constantinople breached amid cannon smoke.

**reformation** — *Reformation & the Protestant Age (AD 1517–present)*
> …a wooden printing press and an open Bible lit by a single candle; a church door with a
> nailed page half-seen at the edge; and beyond, countless small steeples and chapels
> scattering outward across a wide land under a clearing dawn — the church breaking apart
> and spreading over the earth.

## Tuning
- If an image makes the cards hard to read, lower its own brightness before saving, or
  reduce the backdrop opacity in `index.html` (search for `.era::before { … opacity }`).
- Per-era color tints live in `index.html` under `/* Era ambience */` — adjust any `--tint`.
