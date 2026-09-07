#import "theme.typ": *

// Domain data: these files are also consumed by the Astro site.
#let profile = yaml("../data/profile.yaml")
#let publications = yaml("../data/publications.yaml")
#let positions = yaml("../data/positions.yaml")
#let education = yaml("../data/education.yaml")
#let visits = yaml("../data/visits.yaml")
#let teaching = yaml("../data/teaching.yaml")
#let advising = yaml("../data/advising.yaml")
#let awards = yaml("../data/awards.yaml")
#let grants = yaml("../data/grants.yaml")
#let service = yaml("../data/service.yaml")
#let events = yaml("../data/talks.yaml") + yaml("../data/events.yaml")
#let press = yaml("../data/press.yaml")
#let engagements = yaml("../data/engagements.yaml")
#let references = yaml("../data/references.yaml")
#let career = (positions: positions)

// CV-only presentation choices. This file must not contain factual records.
#let presentation = yaml("../data/cv.yaml")

#let section-label(key, fallback) = {
  let labels = get(presentation, "sectionLabels", default: (:))
  get(labels, key, default: fallback)
}

#let break-before(title) = {
  let requested = as-array(get(presentation, "pageBreakBeforeSections"))
  if title in requested {
    pagebreak()
  }
}

#let publication-by-id(id) = {
  for publication in publications {
    if get(publication, "id") == id {
      return publication
    }
  }
  none
}

#let education-description(entry) = {
  let advisors = as-array(get(entry, "advisors"))
  let thesis-id = get(entry, "thesisPublicationId")
  let thesis = if thesis-id != none { publication-by-id(thesis-id) } else { none }
  let description = get(entry, "description")

  if advisors.len() > 0 {
    [Advisors: #advisors.join(", ")]
  }
  if thesis != none {
    if advisors.len() > 0 { linebreak() }
    let title = get(thesis, "title", default: "")
    [Thesis: “#maybe-link(title, publication-url(thesis))”]
  }
  if description != none and description != "" {
    if advisors.len() > 0 or thesis != none { linebreak() }
    description
  }
}

#let position-title(entry) = {
  let title = get(entry, "title", default: "")
  let hosts = as-array(get(entry, "hosts"))
  if hosts.len() > 0 {
    title + " (hosted by " + hosts.join(", ") + ")"
  } else {
    title
  }
}

#let linked-description(entry) = {
  let description = get(entry, "description", default: "")
  let links = as-array(get(entry, "descriptionLinks"))
  if description == "" or links.len() == 0 {
    return description
  }

  let link-data = links.first()
  let label = get(link-data, "label", default: "")
  let destination = get(link-data, "url")
  let parts = if label == "" { () } else { description.split(label) }
  if parts.len() == 2 {
    parts.first()
    maybe-link(label, destination)
    parts.last()
  } else {
    description
  }
}

#let visit-entry(entry) = {
  let description = get(entry, "description")
  let description-url = get(entry, "descriptionUrl")
  let host = get(entry, "host")

  timeline-entry(
    entry,
    title-override: if host != none { [Hosted by #host] } else { [] },
    description-override: if description != none {
      maybe-link(description, description-url)
      if not description.ends-with(".") { [.] }
    } else { [] },
    spacing: 14pt,
  )
}

#let year-span(entries) = {
  let years = entries.map(entry => int(date-year(get(entry, "dateStart"))))
  let first = calc.min(..years)
  let last = calc.max(..years)
  if first == last { str(first) } else { str(first) + "-" + str(last) }
}

#let short-university(name) = {
  if name == "University of Groningen" { "RUG" } else { name }
}

#let short-degree(name) = {
  name
    .replace("MSc Information Science", "MSc Inf. Sci.")
    .replace("Data Wise: Data Science in Society Minor", "Data Science Minor")
}

#let teaching-list(entries) = {
  let course-priority = course => {
    if course == "Advanced Topics in Natural Language Processing" {
      0
    } else if course == "Natural Language Processing" {
      1
    } else {
      2
    }
  }
  let courses = entries
    .map(entry => get(entry, "course"))
    .dedup()
    .sorted(key: course-priority)
  for course in courses {
    let matches = entries.filter(entry => get(entry, "course") == course)
    let representative = matches.first()
    let university = short-university(get(representative, "university", default: ""))
    let degree = short-degree(get(representative, "degree", default: ""))
    let role = get(representative, "role")
    block(below: 7.5pt)[
      #course, #university,
      #degree#if role != none { [ (#role)] }, #year-span(matches)
    ]
  }
}

#let advising-list(entries, level) = {
  let matches = entries.filter(entry => get(entry, "level") == level)
  for entry in matches {
    let name = get(entry, "name", default: "")
    let description = get(entry, "description", default: "")
    let co-supervisors = as-array(get(entry, "coSupervisors"))
    let year = if get(entry, "ongoing", default: false) {
      date-year(get(entry, "dateStart")) + "–"
    } else {
      date-year(first-of(entry, ("dateEnd", "dateStart")))
    }
    let co-supervision = if co-supervisors.len() > 0 {
      " (co-sup. with " + co-supervisors.join(", ") + ")"
    } else {
      ""
    }
    block(below: 7.5pt)[
      #name, #description#co-supervision, #year
    ]
  }
}

#let service-period(entry) = {
  let years = as-array(get(entry, "years"))
  if years.len() > 0 {
    years.map(year => str(year)).join(", ")
  } else {
    date-range(entry, compact: true)
  }
}

#let service-list(entries) = {
  let roles = entries.map(entry => get(entry, "role")).dedup()
  for role in roles {
    block(above: 18pt, below: 8pt, sticky: true)[
      #text(size: 11.5pt, weight: "bold")[#role]
    ]
    for entry in entries.filter(entry => get(entry, "role") == role) {
      let venue = get(entry, "venue", default: "")
      let label = get(entry, "linkLabel", default: venue)
      let parts = if label != "" { venue.split(label) } else { () }
      block(below: 6pt)[
        #if parts.len() == 2 {
          parts.first()
          maybe-link(label, get(entry, "url"))
          parts.last()
        } else {
          venue
        }, #service-period(entry)
      ]
    }
  }
}

#let press-list(entries) = {
  for entry in entries {
    let title = get(entry, "title", default: "")
    let has-terminal-punctuation = (
      title.ends-with(".") or title.ends-with("?") or title.ends-with("!")
    )
    block(below: 5.5pt)[
      #text(weight: "bold")[#get(entry, "outlet")],
      #maybe-link(title, get(entry, "url"))#if not has-terminal-punctuation { [.] }
      #get(entry, "year").
    ]
  }
}

#let engagement-list(entries) = {
  block(above: 8pt)[
    #grid(
      columns: (auto, 1fr),
      column-gutter: 2em,
      row-gutter: 5.5pt,
      ..entries.map(entry => (
        get(entry, "period"),
        [
          #get(entry, "role"), #maybe-link(
            get(entry, "organization"),
            get(entry, "url"),
          )
        ],
      )).flatten(),
    )
  ]
}

#let reference-list(entries) = {
  block(above: 8pt)[
    #for entry in entries {
      block(below: 9pt)[
        #text(weight: "bold")[#get(entry, "name")],
        #get(entry, "title"), #get(entry, "institution") —
        #maybe-link(get(entry, "email"), "mailto:" + get(entry, "email"))
      ]
    }
  ]
}

#let simple-event-entry(event, bold-venue: true) = {
  let presentation = get(event, "cv", default: (:))
  let title = first-of(
    presentation,
    ("label",),
    default: first-of(event, ("event", "name"), default: ""),
  )
  let talk-title = get(presentation, "description", default: get(event, "title"))
  let location = get(presentation, "location", default: get(event, "location"))
  let year = date-year(get(event, "date"))
  let destination = first-of(event, ("eventUrl", "url"))
  block(below: 4.5pt)[
    #if bold-venue {
      text(weight: "bold")[#maybe-link(title, destination)]
    } else {
      maybe-link(title, destination)
    }#if talk-title != none { [, #talk-title] }#if location != none and location != "" { [. #location] }#if year != "" { [. #year] }.
  ]
}

#let simple-event-list(ids, bold-venue: true) = {
  for id in as-array(ids) {
    let event = event-by-id(events, id)
    if event != none {
      simple-event-entry(event, bold-venue: bold-venue)
    }
  }
}

#let publication-categories = {
  let order = as-array(get(presentation, "publicationCategoryOrder"))
  let labels = get(presentation, "publicationCategoryLabels", default: (:))
  order.map(id => (
    id: id,
    title: get(labels, id, default: id),
    prefix: upper(id.slice(0, 1)),
  ))
}

#let current-positions = positions.filter(
  entry => get(entry, "ongoing", default: false),
)
#let industrial-positions = positions.filter(
  entry => not get(entry, "ongoing", default: false),
)
#let dissemination = get(presentation, "dissemination", default: (:))

#let name = get(profile, "name", default: "Gabriele Sarti")
#let emails = as-array(get(profile, "emails"))
#let footer-email = if emails.len() > 0 { emails.first() } else { "" }
#let updated = get(
  presentation,
  "updated",
  default: datetime.today().display("[month repr:long] [day], [year]"),
)

#show: body => cv-document(
  body,
  name: name,
  email: footer-email,
  updated: updated,
)

#cv-header(profile, career)

#let title = section-label("currentPosition", "Current Position")
#break-before(title)
#cv-heading(title)
#for entry in current-positions {
  timeline-entry(
    entry,
    title-override: position-title(entry),
    description-override: linked-description(entry),
  )
}

#let title = section-label("education", "Education")
#break-before(title)
#cv-heading(title)
#for entry in education {
  timeline-entry(entry, description-override: education-description(entry))
}

#let title = section-label("experience", "Experience")
#break-before(title)
#cv-heading(title)
#cv-subheading(section-label("industrialExperience", "Industrial Experience"))
#for entry in industrial-positions {
  timeline-entry(
    entry,
    title-override: position-title(entry),
    description-override: linked-description(entry),
  )
}
#cv-subheading(section-label("academicVisiting", "Academic Visiting"))
#for entry in visits {
  visit-entry(entry)
}

#let title = section-label("teachingAndAdvising", "Teaching and Advising")
#break-before(title)
#cv-heading(title)
#cv-subheading(section-label("classes", "Classes"))
#teaching-list(teaching)
#cv-subheading(section-label("phdStudents", "Ph.D. Students"))
#advising-list(advising, "phd")
#cv-subheading(section-label("mscStudents", "MSc. Students"))
#advising-list(advising, "msc")
#cv-subheading(section-label("bscStudents", "BSc. Students"))
#advising-list(advising, "bsc")

#let title = section-label("awards", "Awards")
#break-before(title)
#cv-heading(title)
#compact-list(awards, gap: 5.5pt)

#let title = section-label("grants", "Scholarships and Grants")
#break-before(title)
#cv-heading(title)
#compact-list(grants, gap: 5.5pt)

#let title = section-label("publications", "Publications")
#break-before(title)
#cv-heading(title)
#publication-section(publications, publication-categories, awards: awards)

#let title = section-label("service", "Professional Service")
#break-before(title)
#cv-heading(title)
#service-list(service)

#let title = section-label("dissemination", "Dissemination Activities")
#break-before(title)
#cv-heading(title)
#cv-subheading(section-label("invitedLectures", "Invited Lectures"))
#event-groups(get(dissemination, "invitedLectures"), events)
#cv-subheading(section-label("academicSeminars", "Academic Seminars"))
#event-groups(get(dissemination, "academicSeminars"), events)
#cv-subheading(section-label("otherPresentations", "Other Presentations"))
#simple-event-list(get(dissemination, "otherPresentations"), bold-venue: false)
#cv-subheading(section-label("scienceCommunication", "Science Communication"))
#simple-event-list(get(dissemination, "scienceCommunication"), bold-venue: false)
#cv-subheading(section-label("industrialSeminars", "Industrial Seminars"))
#simple-event-list(get(dissemination, "industrialSeminars"), bold-venue: false)

#let title = section-label("press", "Press Coverage")
#break-before(title)
#cv-heading(title)
#press-list(press)

#let title = section-label("engagements", "Mentorship and Social Engagements")
#break-before(title)
#cv-heading(title)
#engagement-list(engagements)

#let title = section-label("references", "Academic References")
#break-before(title)
#cv-heading(title)
#reference-list(references)
