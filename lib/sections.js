const HEADINGS = {
  summary: /^(summary|professional summary|career summary|profile|professional profile|career objective|objective|about me|about)$/,
  experience: /^(work experience|professional experience|experience|employment history|employment|work history|internships?|internship experience|industrial experience|industry experience|relevant experience|industrial training|training|internships? (and|&) training|experience (and|&) internships?)$/,
  education: /^(education|academic background|academic qualifications?|educational qualifications?|education (and|&) training|academics|qualifications?)$/,
  skills: /^(skills|technical skills|key skills|core skills|core competencies|skills (and|&) tools|tools (and|&) technologies|tools|software skills|technical proficiency|areas of expertise|expertise|competencies|software)$/,
  projects: /^(projects?|academic projects?|personal projects?|key projects?|selected projects?|major projects?|project work|case studies|work samples|portfolio)$/,
  certifications: /^(certifications?|certificates?|courses|courses (and|&) certifications?|licenses (and|&) certifications?|training (and|&) certifications?|coursework)$/,
  other: /^(achievements?|awards?|honou?rs|awards (and|&) honou?rs|interests|hobbies|languages|references|declaration|extra[- ]?curricular( activities)?|volunteer(ing)?( experience)?|publications?|research|positions? of responsibility|leadership|activities|accomplishments)$/
}

function normaliseHeading(line) {
  let s = line.trim().replace(/[:\-_|\u2022]+$/g, '').trim()
  if (/^(?:[A-Za-z]\s){3,}[A-Za-z]$/.test(s)) s = s.replace(/\s/g, '')
  return s.toLowerCase().replace(/[^a-z&\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function headingKey(line) {
  const raw = line.trim()
  if (!raw || raw.length > 45) return null
  const norm = normaliseHeading(raw)
  if (!norm || norm.split(' ').length > 6) return null
  for (const [key, re] of Object.entries(HEADINGS)) {
    if (re.test(norm)) return key
  }
  return null
}

export function splitSections(text) {
  const lines = text.split('\n')
  const sections = { header: [] }
  let current = 'header'
  const found = []
  for (const line of lines) {
    const key = headingKey(line)
    if (key) {
      current = key
      if (!found.includes(key)) found.push(key)
      sections[current] = sections[current] || []
      continue
    }
    sections[current] = sections[current] || []
    sections[current].push(line)
  }
  return { sections, found, lines }
}
