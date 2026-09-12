// Shared visual system and rendering helpers for the YAML-driven CV.
// The measurements and colors mirror src/assets/cv.sty.

#let link-color = rgb("#003399")
#let note-color = rgb(200, 150, 0)
#let award-color = rgb("#800000")

#let get(data, key, default: none) = {
  if type(data) == dictionary and key in data {
    data.at(key)
  } else {
    default
  }
}

#let first-of(data, keys, default: none) = {
  for key in keys {
    let candidate = get(data, key)
    if candidate != none {
      return candidate
    }
  }
  default
}

#let as-array(value) = {
  if value == none {
    ()
  } else if type(value) == array {
    value
  } else {
    (value,)
  }
}

#let maybe-link(label, destination) = {
  if destination == none or destination == "" {
    label
  } else {
    link(destination, label)
  }
}

#let inline-icon(path) = box(
  width: 0.86em,
  height: 0.78em,
  baseline: 0.08em,
  image(path, width: 0.76em),
)

#let date-year(value) = {
  if value == none {
    ""
  } else {
    let rendered = str(value)
    if rendered.len() >= 4 {
      rendered.slice(0, 4)
    } else {
      rendered
    }
  }
}

#let month-label(number) = {
  let months = (
    "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
    "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
  )
  if number >= 1 and number <= 12 {
    months.at(number - 1)
  } else {
    ""
  }
}

#let month-year(value) = {
  if value == none {
    ""
  } else {
    let rendered = str(value)
    if rendered.len() >= 7 {
      let month = int(rendered.slice(5, 7))
      month-label(month) + " " + rendered.slice(0, 4)
    } else {
      rendered
    }
  }
}

#let date-range(entry, compact: false) = {
  let explicit = first-of(entry, ("dates", "years", "period"))
  if explicit != none {
    return str(explicit)
  }

  let start = get(entry, "dateStart")
  let end = get(entry, "dateEnd")
  let ongoing = get(entry, "ongoing", default: false)
  let expected-end = get(entry, "expectedEnd", default: false)
  let start-value = if compact { date-year(start) } else { month-year(start) }
  let end-value = if compact { date-year(end) } else { month-year(end) }

  if start-value == "" {
    ""
  } else if ongoing and not expected-end {
    start-value + " – Present"
  } else if end-value == "" {
    start-value
  } else if compact and start-value == end-value {
    start-value
  } else if expected-end {
    start-value + " – exp. " + end-value
  } else {
    start-value + " – " + end-value
  }
}

#let cv-document(body, name: "", email: "", updated: "") = {
  set page(
    paper: "a4",
    margin: (
      top: 0.94in,
      bottom: 0.62in,
      left: 0.70in,
      right: 0.70in,
    ),
    footer: context {
      set text(
        font: ("New Computer Modern", "Libertinus Serif"),
        size: 8.1pt,
        fill: black,
      )
      block[
        #line(length: 100%, stroke: 0.18pt)
        #v(3pt)
        #grid(
          columns: (1fr, auto, 1fr),
          gutter: 10pt,
          [#name. Updated #updated.],
          align(center)[
            #counter(page).get().first() - #counter(page).final().first()
          ],
          align(right)[#maybe-link(email, "mailto:" + email)],
        )
      ]
    },
  )
  set text(
    font: ("New Computer Modern", "Libertinus Serif"),
    size: 11pt,
    fill: black,
    lang: "en",
  )
  set par(
    justify: false,
    leading: 0.57em,
  )
  show link: set text(fill: link-color)
  show emph: set text(style: "italic")

  body
}

#let cv-header(profile, career) = {
  let contact = get(career, "contact", default: (:))
  let name = get(profile, "name", default: "Gabriele Sarti")
  let positions = as-array(get(career, "positions"))
  let current-position-id = get(profile, "currentPositionId")
  let current-position = if current-position-id != none {
    positions.find(position => get(position, "id") == current-position-id)
  } else if positions.len() > 0 {
    positions.first()
  } else {
    (:)
  }
  if current-position == none {
    current-position = (:)
  }
  let homepage-presentation = get(current-position, "homepagePresentation", default: (:))
  let inferred-role = if current-position.len() > 0 {
    get(current-position, "title", default: "") + ", " + get(current-position, "organization", default: "")
  } else {
    ""
  }
  let role = first-of(contact, ("role", "title"), default: inferred-role)
  let institution = first-of(contact, ("institution", "organization"))
  let inferred-school = get(homepage-presentation, "department")
  let school = first-of(contact, ("school", "department"), default: inferred-school)
  let profile-address = get(profile, "address", default: (:))
  let address = first-of(
    contact,
    ("address", "location"),
    default: first-of(profile-address, ("street", "display")),
  )
  let website = first-of(
    contact,
    ("website", "url"),
    default: get(profile, "website"),
  )
  let emails = as-array(
    get(contact, "emails", default: get(profile, "emails")),
  )

  block(below: 20pt)[
    #text(size: 15.8pt, weight: "bold")[#name]
    #v(8.5pt)
    #if role != none and role != "" { [#role\ ] }
    #if institution != none and institution != "" { [#institution\ ] }
    #if school != none and school != "" { [#school\ ] }
    #if address != none and address != "" { [#address\ ] }
    #if website != none and website != "" {
      [#inline-icon("home.svg")#h(3.5pt)#maybe-link(website, website)\ ]
    }
    #if emails.len() > 0 {
      [#inline-icon("mail.svg")#h(3.5pt)]
      for (index, email) in emails.enumerate() {
        if index > 0 { [ | ] }
        maybe-link(email, "mailto:" + email)
      }
      linebreak()
    }
  ]
}

#let cv-heading(title) = block(
  above: 26pt,
  below: 9pt,
  sticky: true,
)[
  #grid(
    columns: (1fr,),
    row-gutter: 5pt,
    [#text(size: 12.1pt)[#smallcaps(title)]],
    line(length: 100%, stroke: 0.48pt),
  )
]

#let cv-subheading(title) = block(
  above: 27pt,
  below: 10pt,
  sticky: true,
)[
  #text(size: 11.9pt)[#smallcaps(title)]
]

#let cv-minor-heading(title) = block(
  above: 16pt,
  below: 7pt,
  sticky: true,
)[
  #text(size: 11.5pt, weight: "bold")[#title]
]

#let cv-publication-heading(title) = block(
  above: 25pt,
  below: 14pt,
  sticky: true,
)[
  #text(size: 11.5pt, weight: "bold")[#title]
]

#let timeline-entry(
  entry,
  title-override: none,
  description-override: none,
  dates-override: none,
  spacing: 12pt,
) = {
  let organization = first-of(
    entry,
    ("cvOrganization", "organization", "institution", "company", "name"),
    default: "",
  )
  let location = get(entry, "location", default: "")
  let title = if title-override == none {
    first-of(entry, ("title", "degree", "role"), default: "")
  } else {
    title-override
  }
  let dates = if dates-override == none { date-range(entry) } else { dates-override }
  let description = if description-override == none {
    first-of(entry, ("description", "details"), default: "")
  } else {
    description-override
  }
  let url = first-of(
    entry,
    ("cvOrganizationUrl", "url", "organizationUrl", "institutionUrl"),
  )

  block(below: spacing, breakable: false)[
    #grid(
      columns: (1fr, auto),
      row-gutter: 5.5pt,
      [#text(weight: "bold")[#maybe-link(organization, url)]],
      align(right)[#location],
      [#text(style: "italic")[#title]],
      align(right)[#text(size: 9.2pt, style: "italic")[#dates]],
      grid.cell(colspan: 2)[#if description != none and description != "" { description }],
    )
  ]
}

#let timeline-list(entries) = {
  for entry in as-array(entries) {
    timeline-entry(entry)
  }
}

#let rich-list-entry(entry) = {
  if type(entry) != dictionary {
    entry
  } else {
    let title = first-of(entry, ("title", "name", "task"), default: "")
    let url = get(entry, "url")
    let organization = first-of(
      entry,
      ("organizationShort", "organization", "institution", "venue"),
    )
    let description = first-of(entry, ("description", "details", "display"))
    let amount = get(entry, "amount")
    let dates = first-of(entry, ("dates", "years", "year"))

    if title != "" {
      text(weight: "bold", maybe-link(title, url))
    }
    if amount != none and amount != "" {
      let compact-amount = str(amount).replace(",000", "k")
      [ (#compact-amount)]
    }
    if organization != none and organization != "" { [, #organization] }
    if description != none and description != "" { [, #description] }
    if dates != none and dates != "" { [, #dates] }
  }
}

#let compact-list(entries, gap: 0.5pt) = {
  for entry in as-array(entries) {
    block(below: gap)[#rich-list-entry(entry)]
  }
}

#let author-name(author) = {
  if type(author) == dictionary {
    get(author, "name", default: "")
  } else {
    str(author)
  }
}

#let author-markers(author) = {
  if type(author) == dictionary {
    as-array(first-of(author, ("markers", "marker"), default: ()))
  } else {
    ()
  }
}

#let author-is-etal(author) = lower(author-name(author)) == "et al."

#let contribution-markers(author, contributions) = {
  let symbols = ("†", "‡", "§", "¶")
  let name = author-name(author)
  let matches = ()
  for (index, contribution) in as-array(contributions).enumerate() {
    let names = as-array(get(contribution, "authors"))
    if name in names {
      matches.push(symbols.at(calc.min(index, symbols.len() - 1)))
    }
  }
  matches
}

#let render-author(author, contributions: ()) = {
  let name = author-name(author)
  let markers = author-markers(author) + contribution-markers(author, contributions)
  if author-is-etal(author) {
    emph(name)
  } else {
    name
    if markers.len() > 0 {
      super(markers.join(""))
    }
  }
}

#let render-authors(authors, contributions: ()) = {
  let author-list = as-array(authors)
  for (index, author) in author-list.enumerate() {
    if index > 0 {
      if author-is-etal(author) { [ ] } else { [, ] }
    }
    render-author(author, contributions: contributions)
  }
}

#let render-publication-authors(publication) = {
  let authors = as-array(get(publication, "authors"))
  let contributions = as-array(get(publication, "contributions"))
  let display = get(
    get(publication, "authorDisplay", default: (:)),
    "cv",
    default: (:),
  )
  let head-count = get(display, "head", default: authors.len())
  let tail-count = get(display, "tail", default: 0)
  let include-self = get(display, "includeSelf", default: false)

  if head-count + tail-count >= authors.len() {
    render-authors(authors, contributions: contributions)
    if include-self {
      [ (incl. Gabriele Sarti)]
    }
  } else {
    let head = authors.slice(0, calc.min(head-count, authors.len()))
    let tail = if tail-count > 0 {
      authors.slice(calc.max(authors.len() - tail-count, 0))
    } else {
      ()
    }

    render-authors(head, contributions: contributions)
    [ #emph[et al.]]
    if include-self {
      [ (incl. Gabriele Sarti)]
    }
    if tail.len() > 0 {
      [, #render-authors(tail, contributions: contributions)]
    }
  }
}

#let publication-url(publication) = {
  let links = as-array(get(publication, "links"))
  for item in links {
    if lower(get(item, "label", default: "")) == "paper" {
      return get(item, "url")
    }
  }
  if links.len() > 0 {
    get(links.first(), "url")
  } else {
    none
  }
}

#let publication-category(publication) = {
  let kind = get(publication, "type", default: "")
  if kind == "thesis" { "manuscript" } else { kind }
}

#let publication-details(publication) = {
  let year = date-year(get(publication, "date"))
  if publication-category(publication) != "journal" {
    return year
  }

  let citation = get(publication, "citation", default: (:))
  let venue = get(publication, "venue", default: "")
  let volume = get(citation, "volume")
  let issue = get(citation, "issue")
  let pages = get(citation, "pages")
  let article-number = get(citation, "articleNumber")
  let range = if pages != none { pages.replace("-", "–") } else { article-number }
  let issue-style = venue.contains("(TACL)") or venue.contains("(IJCoL)")

  if issue-style and volume != none {
    if issue != none {
      "Issue " + volume + "-" + issue + ", " + year
    } else if range != none {
      "Issue " + volume + ": " + range + ", " + year
    } else {
      "Issue " + volume + ", " + year
    }
  } else if volume != none {
    volume + if range != none { ", " + range } else { "" } + ", " + year
  } else if range != none {
    range + ", " + year
  } else {
    year
  }
}

#let award-by-id(awards, id) = {
  for award in as-array(awards) {
    if get(award, "id") == id {
      return award
    }
  }
  none
}

#let publication-award(publication, awards) = {
  let labels = ()
  let distinction = get(publication, "distinction")
  if distinction != none and distinction != "" {
    labels.push(distinction)
  }
  for id in as-array(get(publication, "awardIds")) {
    let award = award-by-id(awards, id)
    if award != none {
      labels.push(first-of(award, ("publicationLabel", "title"), default: id))
    }
  }
  if labels.len() > 0 { labels.join(", ") } else { none }
}

#let publication-entry(publication, awards: (), label-override: none) = {
  let label = if label-override == none {
    ""
  } else {
    label-override
  }
  let title = get(publication, "title", default: "")
  let authors = get(publication, "authors", default: ())
  let contributions = get(publication, "contributions", default: ())
  let venue = get(publication, "venue", default: "")
  let details = publication-details(publication)
  let category = publication-category(publication)
  let kind = if category == "manuscript" {
    "manuscript"
  } else if category == "edited" {
    "edited"
  } else {
    "publication"
  }
  let award = publication-award(publication, awards)
  let explicit-note = get(publication, "note")
  let contribution-notes = as-array(contributions).enumerate().map(pair => {
    let index = pair.first()
    let contribution = pair.last()
    let symbols = ("†", "‡", "§", "¶")
    symbols.at(calc.min(index, symbols.len() - 1)) + " = " + get(contribution, "label", default: "Equal contribution")
  })
  let note = if explicit-note != none {
    explicit-note
  } else if contribution-notes.len() > 0 {
    contribution-notes.join("; ")
  } else {
    none
  }
  let destination = publication-url(publication)

  block(below: 12.5pt)[
    #grid(
      columns: (2.75em, 1fr),
      column-gutter: 0pt,
      // Hang labels slightly into the margin to preserve the text's line width.
      [#if label != "" { move(dx: -5.5pt)[[#label]] }],
      [
        #set par(leading: 0.62em)
        #render-publication-authors(publication). “#maybe-link(title, destination)”.
        #if kind == "edited" {
          [ #details.]
        } else if kind == "manuscript" {
          [ #text(style: "italic")[#venue]. #details.]
        } else {
          [ In #text(style: "italic")[#venue]. #details.]
        }
        #if award != none and award != "" {
          [ #text(fill: award-color)[#award].]
        }
        #if note != none and note != "" {
          [ #text(fill: note-color)[(#note)]]
        }
      ],
    )
  ]
}

#let publications-by-category(publications, category) = {
  publications.filter(publication => {
    publication-category(publication) == category
  })
}

#let publication-section(publications, categories, awards: ()) = {
  for category in categories {
    let id = get(category, "id", default: "")
    let title = get(category, "title", default: id)
    let matches = publications-by-category(publications, id)
    if matches.len() > 0 {
      cv-publication-heading(title)
      let prefix = get(category, "prefix", default: upper(id.slice(0, 1)))
      for (index, publication) in matches.enumerate() {
        let label = prefix + str(matches.len() - index)
        publication-entry(publication, awards: awards, label-override: label)
      }
    }
  }
}

#let event-by-id(events, id) = {
  for event in events {
    if get(event, "id") == id {
      return event
    }
  }
  none
}

#let event-line(event) = {
  let presentation = get(event, "cv", default: (:))
  let display = get(presentation, "display")
  if display != none {
    let link-label = get(presentation, "linkLabel")
    let destination = get(presentation, "url")
    let parts = if link-label == none { () } else { display.split(link-label) }
    if parts.len() == 2 and destination != none {
      parts.first()
      maybe-link(link-label, destination)
      parts.last()
    } else {
      display
    }
    return
  }

  let event-name = first-of(event, ("event", "name"), default: "")
  let event-url = first-of(event, ("eventUrl", "url"))
  let location = get(event, "location")
  let year = date-year(get(event, "date"))

  maybe-link(event-name, event-url)
  if location != none and location != "" { [. #location] }
  if year != "" { [. #year] }
  [.]
}

#let event-group(group, events) = {
  let title = get(group, "title")
  let ids = as-array(first-of(group, ("ids", "eventIds")))
  let direct-items = as-array(get(group, "items"))
  let page-break-before = get(group, "pageBreakBefore", default: false)

  if page-break-before { pagebreak() }
  if title != none and title != "" {
    block(above: 9pt, below: 4pt, sticky: true)[
      #text(weight: "bold")[#title]
    ]
  }
  for id in ids {
    let event = event-by-id(events, id)
    if event != none {
      block(below: 4.5pt)[#pad(left: 10pt)[#event-line(event)]]
    }
  }
  for item in direct-items {
    block(below: 4.5pt)[#pad(left: 10pt)[#rich-list-entry(item)]]
  }
}

#let event-groups(groups, events) = {
  for group in as-array(groups) {
    event-group(group, events)
  }
}
