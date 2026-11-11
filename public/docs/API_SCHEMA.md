# iBreviary API — reverse-engineered from Android 3.7.19

Target: `com.netguru.ibreviary` (iBreviary TS Pro Terra Sancta), version 3.7.19, versionCode 110037190, APK obtained from APKPure. Decompiled with jadx 1.5.1. The app is a Retrofit + Moshi client with no authentication, no API keys, no request signing, no Play Integrity token in the 3.x line, and no special headers beyond a default OkHttp stack. Every endpoint below was verified live on 2026-11-11 with plain `curl`.

## Conventions

- Base URL: `http://www.ibreviary.com/` (the app hardcodes HTTP; HTTPS also works, same responses).
- All endpoints answer `application/json; charset=utf-8` with HTTP 200, even for error cases (see Quirks).
- No CORS headers are sent. Browser code hitting the origin directly is blocked by same-origin policy; route requests through a server-side proxy. This site ships one (`/api/ibreviary/*`, documented at the end).
- Dates are `yyyy-MM-dd` (ISO-8601). Timestamps elsewhere are `yyyy-MM-dd HH:mm` in server local time.
- Language codes are lowercase two-letter strings, except the three rite codes (`ra`, `mo`, `vt`). Thirteen exist (list under `get_status`).
- A custom User-Agent is not required. `iBreviary/3.7.19 Android` was used during capture and is accepted.

## Endpoint map

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | GET | `/service/services.php?s=get_status` | Catalog: languages, event types (propers), cache-busting timestamps |
| 2 | GET | `/service/services.php?s=get_daily_text&l={lang}&d={date}` | One full liturgical day, all celebrations included |
| 3 | GET | `/service/services.php?s=get_fixed_text&l={lang}` | Language-static texts: order of Mass, prayers, rites, commons, specials |
| 4 | GET | `/iOS/services.php?type=getNot&lang={lang}` | Server-push notifications (shared with the iOS app) |
| A | GET | `/img_db.php?t=r&id={saint_id}&n={n}` | Saint portrait PNG (URL comes pre-built inside `day.saint[].image`) |

## 1. get_status — the catalog

```
GET http://www.ibreviary.com/service/services.php?s=get_status
```

Response (6,286 bytes captured 2026-11-11):

```jsonc
{
  "languages": {
    "list": [
      { "code": "it", "title": "Italiano",        "direction": "ltr", "color": "#000000" },
      { "code": "en", "title": "English",        "direction": "ltr", "color": "#de0008" },
      { "code": "es", "title": "Español",        "direction": "ltr", "color": "#FFCC33" },
      { "code": "fr", "title": "Français",       "direction": "ltr", "color": "#007AFF" },
      { "code": "ro", "title": "Româna",         "direction": "ltr", "color": "#fbae00" },
      { "code": "ar", "title": "العربية",          "direction": "rtl", "color": "#7fc15f" },
      { "code": "pt", "title": "Português",      "direction": "ltr", "color": "#18945a" },
      { "code": "tr", "title": "Türkçe",         "direction": "ltr", "color": "#de1818" },
      { "code": "ra", "title": "Rito Ambrosiano","direction": "ltr", "color": "#6ccde0" },
      { "code": "gl", "title": "Galego",         "direction": "ltr", "color": "#000000" },
      { "code": "mo", "title": "Rito Monastico", "direction": "ltr", "color": "#000000" },
      { "code": "la", "title": "Latinum",        "direction": "ltr", "color": "#5855D6" },
      { "code": "vt", "title": "Vetus Ordo",     "direction": "ltr", "color": "#E47911" }
    ],
    "last_update": "2021-08-05 00:00:00"
  },
  "event_type": {
    "list": [ /* proper variants, see below */ ],
    "last_update": "2021-08-05 00:00:00"
  },
  "fixed_text":     { "last_update": "2021-09-20 09:33:33" },
  "styles":         { "last_update": "2021-09-20 09:33:33" },
  "linked_images":  { "last_update": "2021-05-15 07:31:58" },
  "backgrounds":    { "last_update": null }
}
```

Notes:

- `direction` matters for Arabic (`rtl`); the app flips its layout on this flag.
- The three rite codes are full liturgies, not dialects: `ra` returns Ambrosian day texts, `mo` monastic, `vt` the 1962 Vetus Ordo with Latin titles ("Feria Quarta, Hebd. XXXII").
- `event_type.list[]` items are the "propers" the app's settings screen calls them:

```jsonc
{
  "type": "TerraSanta",
  "title": { "it": "Terra Santa", "en": "Holy land", "es": "Tierra Santa",
             "fr": "Terre Sainte", "ro": "Holy Land", "ar": "الأرض المقدسة",
             "pt": "Terra Santa", "tr": "Filistin", "ra": "Terra Santa",
             "gl": null, "mo": "", "la": "Terra Sancta", "vt": "Terra Sancta" },
  "image": "…png", "logo": "…png", "home": 1
}
```

The `type` string reappears in `day.event[].day_info.type` (celebration variants attached to a day) and in `prayers[].type` (devotional prayers specific to a proper). `title` is a per-language map; `home` flags which proper is pinned on the home screen.

- The four `last_update` blocks are cache invalidation keys: the app compares `fixed_text.last_update` with its locally stored value and re-downloads `get_fixed_text` when the server moved on. The 3.7.19 model only reads `languages`, `event_type`, and `fixed_text`; `styles`, `linked_images`, `backgrounds` are consumed by the 4.x line but are present here.

## 2. get_daily_text — one day, every celebration

```
GET http://www.ibreviary.com/service/services.php?s=get_daily_text&l=en&d=2026-11-11
```

| Param | Value | Notes |
|-------|-------|-------|
| `l`   | language code, e.g. `en` | one of the 13 above |
| `d`   | `yyyy-MM-dd`, e.g. `2026-11-11` | any date; past and ~14 months future tested |

Captured sizes: 266,562 B (en, 2026-11-11), 359,816 B (en, 2026-11-12 — carries an event), 4,347 B (ra), 512 B (vt weekday with no memorial), 372,057 B (en, Christmas).

### Response skeleton

```jsonc
{
  "day_info":        { … },          // calendar identity of the day
  "saint":           [ … ] | null,    // saints of the day with hagiography
  "breviary":        { … },          // Liturgy of the Hours, base celebration
  "breviary_memory": [ … ] | null,   // commemorations, each with own hours
  "missal":          [ … ] | null,   // Mass formularies
  "missal_memory":   [ … ] | null,   // Mass formularies for commemorations
  "event":           [ … ] | null    // optional celebrations by proper type
}
```

Every key except `day_info` can be absent entirely (2027-01-01 returns no `missal`; ordinary weekdays in `vt` return a near-empty `breviary`). Clients must treat all of them as optional.

### day_info

```jsonc
{
  "date": "Wednesday, 11 November 2026",     // human string, server locale of the language
  "title": "Wednesday of the Thirty-Second Week in Ordinary Time",
  "day_type": "Weekday",                     // or Solemnity | Feast | Memorial | Feriale | …
  "day_time": "Ordinary",                    // liturgical season: Advent, Christmas, Lent, Easter, Ordinary
  "complete": 1,                             // 1 = full texts present
  "code": "PO323",                           // internal calendar id (see below)
  "event": ["Guanelliani"]                   // optional: proper codes attached to this day
}
```

`code` prefixes seen while sampling: `PO` (per annum/ordinary), `N` (sanctoral; `N0101-15` was 2027-01-01), plus season-prefixed codes around Christmas (`N1225`). Treat it as opaque.

The `event` array inside `day_info` lists the proper codes whose celebration bodies appear in the top-level `event[]` array. Example from 2026-11-12: `day_info.event = ["Guanelliani"]`, and the corresponding item in `event[]` has `day_info.type = "Guanelliani"`.

### saint[]

```jsonc
{
  "id": 1320,
  "image": "http://www.ibreviary.com/img_db.php?t=r&id=1320&n=2",
  "name": "Saint Martin of Tours",
  "subtitle": "Bishop",
  "type": "Memorial",
  "text": "<p>SAINT MARTIN OF TOURS was born in Pannonia…</p>"
}
```

`text` is full hagiography HTML, the same markup the app renders in its saint screen. `id` joins with `breviary_memory[].saint_id`. The `image` URL is plain HTTP; proxy it if the consuming page is HTTPS.

### breviary

```jsonc
{
  "complete": 1,
  "officeofreadings":  { "title": "Office of Readings", "content": "<p>…</p>" },
  "lauds":             { "title": "Morning Prayer",    "content": "<p>…</p>" },
  "daytimeprayers":    { "title": "Daytime Prayer",    "content": "<p>…</p>" },
  "vespers":           { "title": "Evening Prayer",    "content": "<p>…</p>" },
  "compline":          { "title": "Night Prayer",      "content": "<p>…</p>" },
  "previouscompline":  { "title": "Night Prayer",      "content": "<p>…</p>" }
}
```

`previouscompline` is yesterday's Night Prayer, kept so a user who prays Compline before sleeping after the calendar flips still gets the right text. The five main hours plus this one are the six reading surfaces in the app's Breviary menu.

### breviary_memory[] — commemorations

```jsonc
{
  "title": "Saint Martin of Tours",
  "type": "Memorial",
  "mandatory": 1,
  "saint_id": 1320,
  "officeofreadings": { "title": "Office of Readings", "content": "…" },
  "lauds":            { "title": "Morning Prayer",    "content": "…" },
  "daytimeprayers":   { "title": "Daytime Prayer",    "content": "…" },
  "vespers":          { "title": "Evening Prayer",    "content": "…" },
  "compline":         { "title": "Night Prayer",      "content": "…" }
}
```

`mandatory: 1` marks obligatory memorials; the app pins those to the top of the day's variant list. On 2026-11-11 the payload carries the weekday hours in `breviary` and the complete memorial office of St Martin of Tours in `breviary_memory` — two full celebrations in one response, selectable in the app's day view. (The m2 mobile website hides this: it serves only whichever celebration its PHP session picked, and never shows commemorations.)

### missal[]

```jsonc
{
  "variant": "",           // formulary variant tag; observed empty or a proper name
  "order": 0,              // display order when several formularies exist
  "complete": 1,
  "antiphon_and_opening_prayer":       { "title": "Entrance Antiphon and Collect", "content": "…" },
  "first_reading":                    { "title": "First Reading", "content": "…" },
  "responsorial_psalm":               { "title": "Responsorial Psalm", "content": "…" },
  "second_reading":                   { "title": "Second Reading", "content": "…" },   // often on feasts
  "gospel_acclamation":               { "title": "Gospel Acclamation", "content": "…" },
  "gospel":                           { "title": "Gospel", "content": "…" },
  "prayer_of_the_faithful":           { "title": "Prayer of the Faithful", "content": "…" },
  "prayer_over_the_gifts":            { "title": "Prayer over the Offerings", "content": "…" },
  "preface":                          { "title": "Preface", "content": "…" },
  "antiphon_and_prayer_after_communion": { "title": "…", "content": "…" }
}
```

These are the five sections the app's Readings menu exposes (antiphon+collect, readings, prayer over the offerings, preface, communion) with the internals kept whole.

### missal_memory[]

Same section shape as `missal[]` plus `title`, `type`, `mandatory`, `saint_id` — the Mass formularies of the commemorations. On 2026-11-11: "Saint Martin of Tours", type Memorial.

### event[] — optional celebrations

```jsonc
{
  "day_info": {
    "date": "Thursday, 12 November 2026",
    "title": "Blessed Virgin Mary Mother of Divine Providence, patron",
    "subtitle": "Solemnity",
    "type": "Guanelliani"               // joins event_type.list[].type
  },
  "breviary": { "officeofreadings": …, "lauds": …, "daytimeprayers": …, "vespers": …, "compline": … },
  "missal":   { … same as missal[] items … }
}
```

Events carry complete offices and Masses for optional/parallel celebrations. On Christmas 2026 the Nativity event has `type: "TerraSanta"` — the Holy Land proper, which the app renders when the user picks that proper in settings. Picking a proper never changes the request URL; it changes which part of the response the UI surfaces.

### The celebration selection model, in one paragraph

One `get_daily_text` call returns the whole day: the base liturgy (`breviary`, `missal`), its commemorations (`breviary_memory`, `missal_memory`, joined to `saint` by `saint_id`), and any optional celebrations (`event`, keyed by proper `type`). The app builds a variant list from these (base first, `mandatory` memories pinned above their saints, events whose `day_info.type` matches the user's selected proper highlighted) and lets the user page through them — "Wednesday Ordinary Time" and "Saint Martin of Tours" side by side on 11 November, for instance. There is no separate request per celebration.

## 3. get_fixed_text — everything language-static

```
GET http://www.ibreviary.com/service/services.php?s=get_fixed_text&l=en
```

9.3 MB for English (captured `last_update: 2026-07-11 07:35:59`). Fetch once per language, cache, and re-fetch only when `get_status.fixed_text.last_update` moves.

```jsonc
{
  "languages": {
    "missal_ancor_text": ["The Introductory Rites", "Creed", "The Liturgy of the Eucharist",
                          "The Communion Rite", "Solemn blessings"],   // anchor labels inside order_of_mass HTML
    "readings_title": "Readings"
  },
  "missal": {
    "order_of_mass": {
      "title": "…",
      "introductory_rites":         { "title": "…", "content": "…" },
      "eucharistic_liturgy":        { "title": "…", "content": "…" },
      "communion_rites":            { "title": "…", "content": "…" },
      "communion_rites_celebration":{ "title": "…", "content": "…" },
      "concluding_rites":           { "title": "…", "content": "…" }
    },
    "preface":               [ { "title": "…", "content": "…" }, … ],
    "eucharistic_liturgy":  [ … ],
    "prayers_of_the_faithful": { "title": "…", "list": [ { "title": "…", "content": "…" }, … ] },
    "blessing":             { "title": "…", "list": [ … ] }
  },
  "prayers": [           // 130 devotional prayers
    { "type": "", "title": "Complementary Psalmody (Gradual Psalms)",
      "content": "<p>…</p>", "use": "" }
    // type: "" normally; "Guanelliani" | "Mercedari" tie a prayer to those propers
    // use:  "" normally; "Credo" flags the Creed slot
  ],
  "rites": [             // 24 rites: Chrism Mass, Easter Vigil, funerals, baptism, Latin Mass order
    { "title": "Chrism Mass", "content": "<p>…</p>" }
  ],
  "breviary_special": [  // 24 offices for commons/occasions, with full hours
    { "title": "Common of the Dedication of a Church",
      "first_vespers": …, "officeofreadings": …, "lauds": …,
      "daytimeprayers": …, "vespers": …, "compline": … }
  ],
  "missal_special": [    // 161 Mass formularies for occasions
    { "title": "Common of the Dedication of a Church (outside the Church that was Dedicated)",
      "type": null,
      "introduction": …, "antiphon_and_opening_prayer": …, "prayer_of_the_faithful": …,
      "prayer_over_the_gifts": …, "preface": …, "antiphon_and_prayer_after_communion": … }
  ],
  "last_update": "2026-07-11 07:35:59"
}
```

The 3.7.19 app's `OrderOfMass` model maps only five parts and silently drops `concluding_rites`; the JSON carries six. Parse defensively.

## 4. iOS notifications

```
GET http://www.ibreviary.com/iOS/services.php?type=getNot&lang=en
```

Field names are Italian in the payload (the endpoint predates the Android client and is shared with iOS):

```jsonc
{
  "servizio": "get Notifiche List",
  "lista_notifiche": [
    {
      "id": "31",                    // string in JSON
      "type": "7",                   // observed: 7 = donation appeal, 0 = news/announcement
      "regola_ricorrente": "YES",    // recurring rule?
      "giorni_frequenza": "0",       // recurrence frequency in days
      "solo_una_volta": "NO",        // show-once flag
      "sempre_presente_in_home": "YES",  // always pin on home
      "last_update": "2023-09-19 11:44:36",
      "contenuto_localizzato": {
        "id": "36",
        "id_notifica": "31",
        "titolo": "DONA PER iBreviary©",
        "attivo": "1",              // active flag, string
        "contenuto": "Attraverso questa pagina puoi donare…",
        "link": "http://www.proterrasancta.org/it/sostieni-ibreviary/",
        "link_titolo": "DONA",
        "lingua": "it"
      }
    }
  ],
  "last_update_ricorrente": "2023-09-26 12:55:18",
  "last_istant_id": -1
}
```

`contenuto_localizzato` can also carry `browser_html` and `browser_link` for notifications that open rendered HTML; none of the live items use them. Localization is per notification, not per request: the English list carries the donation appeal (id 31) plus one item with no English localization at all (id 976, `contenuto_localizzato` absent) — clients must treat both the list and each item's localization as optional. One more quirk: the first-ever request for a language can return an empty list while the server warms its cache; the populated list comes back seconds later.

## Content markup

All `content` strings are HTML fragments using the app's own stylesheet classes. The relevant classes, extracted from the APK's `assets/`:

| Class | Meaning | Default style |
|-------|---------|---------------|
| `sezione` | hour / section heading | uppercase, red `#dc2300`, centered, 160% |
| `titolo` | sub-section title | uppercase, bold |
| `capolettera_grande` | drop-cap, large | red, 160% |
| `capolettera_piccolo` | section label like INVITATORY, HYMN | red, bold, 120% |
| `paragrafo_grande` / `paragrafo_piccolo` | emphasized body tiers | bold, 125% / 105% |
| `rubrica` | rubrics and liturgical marks | red |
| `citazione` | source attribution | dark red `#710000` |
| `risposta` | response line | bold |

Inside the HTML: `&nbsp;` performs verse indentation, `&mdash;` marks versicle responses, `*` and `&dagger;` (via `rubrica` spans) mark psalm verse halves, `+` marks blessing crossings, and in-page anchors (`#hymn`, `#psalm`, `#ps24`) jump within the hour. The app loads this into a WebView with one of four stylesheets (`Default`, `Night`, `Accessible`, `Old` + the bundled Garamond); all four are preserved in `app-assets/` of this deliverable for reuse.

## Quirks observed while probing

1. HTTP 200 even for empty/degenerate bodies — `vt` on a memorial-less weekday returns a 512-byte skeleton with empty hour contents. Check `complete` and key presence before rendering.
2. Future dates beyond the published window (2027-01-01 tested) return partial days: `title` empty in `day_info`, `missal` key absent. The server publishes roughly the current day plus a forward window; the app itself only ever requests today plus the next 7 days.
3. Dates in the past work (2020-11-11 returned the identical St Martin memorial payload as 2026-11-11).
4. `ra`/`mo`/`vt` change the rite, not just the strings: the Ambrosian day for 2026-11-11 has a different title ("Mercoledì nell'ultima settimana dell'Anno liturgico") and no `breviary_memory`.
5. No pagination, no ETags, no rate-limit headers observed. The 9 MB fixed-text payload is the heaviest request; cache it.
6. The site `www.ibreviary.com/m2/` (the mobile web) is a separate, session-driven PHP surface that only exposes one celebration at a time and no commemorations. The JSON API above is strictly richer; use it instead.

## This site's re-exposed API

The website in this deliverable wraps the four endpoints with a CORS-enabled JSON surface (proxying also the image endpoint for HTTPS):

| Route | Upstream |
|-------|----------|
| `GET /api/ibreviary/status` | `get_status` |
| `GET /api/ibreviary/day?l=en&d=2026-11-11` | `get_daily_text` |
| `GET /api/ibreviary/fixed?l=en` | `get_fixed_text` (server-side disk cache, per-language) |
| `GET /api/ibreviary/notifications?lang=it` | `getNot` |
| `GET /api/ibreviary/img?t=r&id=1320&n=2` | `img_db.php` image bytes |

Examples:

```bash
curl https://<this-site>/api/ibreviary/status
curl 'https://<this-site>/api/ibreviary/day?l=en&d=2026-11-11' | jq '.breviary_memory[0].title'
# → "Saint Martin of Tours"
```

Raw upstream examples (no proxy needed server-side):

```bash
curl 'http://www.ibreviary.com/service/services.php?s=get_daily_text&l=en&d=2026-11-11'
curl 'http://www.ibreviary.com/service/services.php?s=get_fixed_text&l=it' -o fixed_it.json
curl 'http://www.ibreviary.com/iOS/services.php?type=getNot&lang=it'
```

## How the app uses these endpoints (behavioral map)

Decompiled call graph, for anyone re-implementing the client:

- On launch: `get_status` → store languages/propers, compare `fixed_text.last_update` against the local copy; re-fetch `get_fixed_text` for the current language when newer.
- Home "TODAY": `get_daily_text(l=CurrentReadingLanguage, d=today)`; the day is cached on disk keyed `languageCode|date` and served offline afterward.
- Day picker: single days, or "following 7 days" (seven parallel `get_daily_text` calls; the app's auto-download setting triggers this on launch).
- Variant pager: built from `breviary` + `breviary_memory` + `event` as described above; selection is purely client-side.
- Notifications: polled per language; `sempre_presente_in_home` items pinned; read-state kept locally (`last_istant_id` unused in 3.7.19).
- Settings that never affect requests: text size, style (`Default|Night|Accessible|Old`), contrast, TTS on/off + velocity, auto-scroll velocity, proper choice. Only the language code reaches the wire.

## Files in this deliverable

- `API_SCHEMA.md` — this document.
- `samples/` — eleven raw captures: `get_status`, day payloads for 2026-11-11 (St Martin), 2026-11-12 (Guanelliani event), 2026-12-25 (Nativity + TerraSanta event), 2027-01-01 (partial future), 2020-11-11 (past), `ra` and `vt` variants, `get_fixed_text` (en, full 9.3 MB), and notifications for `en` and `it`.
- `app-assets/` — the four reading stylesheets and Garamond.ttf pulled from the APK, for faithful rendering.
