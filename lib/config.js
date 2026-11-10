const term = (name, weight, ...aliases) => ({ name, weight, aliases: aliases.length ? aliases : [name.toLowerCase()] })

export const CLASSIFY = {
  strong: 35,
  weak: 18,
  margin: 12
}

export const MIN_TEXT_CHARS = 400

export const ROLES = {
  lca: {
    id: 'lca',
    name: 'LCA Consultant',
    short: 'LCA',
    color: 'lca',
    summary:
      'Onsite in Chennai. Needs 2 to 3 years of independent LCA work, hands-on GaBi or SimaPro, and ISO 14040/14044.',
    minYears: 2,
    titleRe: /\b(lca|life[\s-]?cycle|sustainability (consultant|analyst|associate)|environmental (consultant|analyst|engineer))\b/i,
    relevanceGroups: ['core', 'tools'],
    education: {
      strong: /environment|sustainab|energy|chemical|climate|ecolog|life[\s-]?cycle/i,
      ok: /engineering|mechanical|civil|materials|science|biotech|polymer|industrial|production|textile|technology/i
    },
    groups: [
      {
        key: 'core',
        label: 'LCA concepts and standards',
        max: 30,
        target: 12,
        kind: 'terms',
        why: 'Life cycle assessment, inventory data, ISO 14040/14044, EPDs and footprinting language.',
        terms: [
          term('Life cycle assessment', 3, 'life cycle assessment', 'life cycle analysis', 'lca'),
          term('Life cycle inventory', 3, 'life cycle inventory', 'lci'),
          term('Impact assessment', 2, 'lcia', 'life cycle impact assessment', 'impact assessment'),
          term('ISO 14040', 3, 'iso 14040', 'iso14040'),
          term('ISO 14044', 3, 'iso 14044', 'iso14044'),
          term('EPD', 2, 'epd', 'environmental product declaration'),
          term('Carbon footprint', 2, 'carbon footprint', 'product carbon footprint', 'pcf', 'carbon footprinting'),
          term('GHG accounting', 1.5, 'ghg', 'greenhouse gas', 'ghg protocol'),
          term('Cradle-to-gate/grave', 2, 'cradle to gate', 'cradle to grave', 'cradle to cradle'),
          term('Hotspot / sensitivity analysis', 1, 'hotspot analysis', 'hot spot analysis', 'sensitivity analysis', 'contribution analysis'),
          term('Circular economy / ecodesign', 1, 'circular economy', 'ecodesign', 'eco design'),
          term('Water footprint', 1, 'water footprint'),
          term('Sustainability', 0.5, 'sustainability', 'sustainable')
        ]
      },
      {
        key: 'tools',
        label: 'LCA software',
        max: 20,
        target: 5,
        kind: 'terms',
        why: 'The JD asks for GaBi or SimaPro. Either one earns most of the points; other tools add a little.',
        terms: [
          term('GaBi', 4, 'gabi'),
          term('SimaPro', 4, 'simapro', 'sima pro'),
          term('openLCA', 2, 'openlca', 'open lca'),
          term('ecoinvent', 2, 'ecoinvent'),
          term('Umberto', 1, 'umberto'),
          term('Sphera', 1, 'sphera'),
          term('Brightway', 1, 'brightway')
        ]
      },
      {
        key: 'experience',
        label: 'Relevant LCA experience',
        max: 20,
        kind: 'experience',
        fullYears: 3,
        why: 'Dated roles that mention LCA work, merged so overlapping jobs are not double counted. Full marks at 3 years.'
      },
      {
        key: 'projects',
        label: 'LCA projects',
        max: 10,
        kind: 'projects',
        fullCount: 3,
        projectRe: /(\d+)\s*\+?\s*(?:lca|life[\s-]?cycle(?: assessment)?)\s+(?:projects|studies|assessments)/i,
        why: 'Jobs and projects that involve LCA work. The JD wants at least 3.'
      },
      {
        key: 'education',
        label: 'Education',
        max: 10,
        kind: 'education',
        why: 'A degree earns half. Environmental, energy or chemical fields earn the rest; other engineering and science fields earn some.'
      },
      {
        key: 'support',
        label: 'Supporting skills',
        max: 10,
        target: 5,
        kind: 'terms',
        why: 'Data collection and validation, benchmarking, logistics data, stakeholder handling, documentation.',
        terms: [
          term('Data collection', 1, 'data collection', 'data compilation'),
          term('Data validation', 1, 'data validation', 'data quality', 'quality control'),
          term('Benchmarking', 1, 'benchmarking', 'benchmark'),
          term('Stakeholder handling', 1, 'stakeholder', 'client management', 'client interaction', 'client communication'),
          term('Supply chain / logistics', 1, 'supply chain', 'logistics', 'transportation'),
          term('Documentation', 1, 'documentation', 'assumptions'),
          term('Report writing', 1, 'report writing', 'technical report', 'sustainability report'),
          term('ESG / BRSR', 1, 'esg', 'brsr', 'csr'),
          term('Excel', 0.5, 'excel')
        ]
      }
    ]
  },
  uiux: {
    id: 'uiux',
    name: 'UI/UX Intern',
    short: 'UI/UX',
    color: 'uiux',
    summary:
      'Remote design internship. Open to 0 to 1 year of experience, Figma and prototyping, and a good grasp of user psychology.',
    minYears: 0,
    titleRe: /\b(ux|ui|ui\/ux|ux\/ui|product design(er)?|graphic design(er)?|designer|design intern(ship)?|visual design(er)?)\b/i,
    relevanceGroups: ['tools', 'methods', 'visual'],
    education: {
      strong: /design|hci|human[\s-]?computer|fine arts|multimedia|animation|communication|psycholog|architect|visual|cognitive/i,
      ok: /computer|information technology|software|media|marketing|engineering|technology/i
    },
    groups: [
      {
        key: 'tools',
        label: 'Design tools',
        max: 20,
        target: 6,
        kind: 'terms',
        why: 'The JD names Figma and prototyping tools.',
        terms: [
          term('Figma', 5, 'figma'),
          term('Adobe XD', 3, 'adobe xd', 'xd'),
          term('Sketch', 2, 'sketch app', 'sketch'),
          term('Framer', 2, 'framer'),
          term('InVision', 1, 'invision'),
          term('Miro', 1, 'miro', 'figjam'),
          term('Zeplin', 1, 'zeplin'),
          term('Axure / Balsamiq', 1, 'axure', 'balsamiq'),
          term('Prototyping tools', 2, 'prototyping tool', 'prototyping tools')
        ]
      },
      {
        key: 'methods',
        label: 'UX research and methods',
        max: 25,
        target: 14,
        kind: 'terms',
        why: 'User research, usability testing, wireframes, personas, journeys, human-centred design and user psychology.',
        terms: [
          term('User research', 3, 'user research', 'ux research', 'design research'),
          term('Usability testing', 3, 'usability testing', 'usability test', 'usability study', 'user testing'),
          term('User interviews / surveys', 2, 'user interview', 'user survey', 'stakeholder interview'),
          term('Wireframing', 2, 'wireframe', 'wireframing', 'low fidelity', 'lo-fi'),
          term('Prototyping', 2, 'prototype', 'prototyping'),
          term('Personas', 2, 'persona', 'user persona'),
          term('Journey mapping', 2, 'journey map', 'journey mapping', 'user journey', 'empathy map'),
          term('Information architecture', 2, 'information architecture', 'site map', 'sitemap'),
          term('User flows', 2, 'user flow', 'task flow'),
          term('Interaction design', 2, 'interaction design', 'microinteraction'),
          term('Design thinking', 2, 'design thinking'),
          term('Human-centred design', 2, 'human centered', 'human centred', 'user centered', 'user centred', 'human-centered'),
          term('Heuristic evaluation', 2, 'heuristic evaluation', 'heuristic analysis'),
          term('User psychology', 2, 'user psychology', 'psychology', 'cognitive', 'behavioural', 'behavioral', 'user behaviour', 'user behavior'),
          term('Accessibility', 1.5, 'accessibility', 'wcag'),
          term('A/B testing', 1, 'a/b test', 'ab testing', 'a b test'),
          term('UX/UI', 1, 'ux', 'ui/ux', 'ux/ui', 'user experience')
        ]
      },
      {
        key: 'visual',
        label: 'Visual and UI design',
        max: 15,
        target: 8,
        kind: 'terms',
        why: 'Visual design, typography, colour, design systems, responsive layouts, hi-fi mockups.',
        terms: [
          term('Visual design', 3, 'visual design', 'ui design', 'interface design'),
          term('Typography', 2, 'typography', 'typeface'),
          term('Colour theory', 2, 'color theory', 'colour theory', 'colour palette', 'color palette'),
          term('Design systems', 3, 'design system', 'component library', 'style guide'),
          term('Responsive design', 2, 'responsive design', 'responsive layout', 'mobile first', 'mobile-first'),
          term('High-fidelity mockups', 2, 'high fidelity', 'high-fidelity', 'hi-fi', 'mockup'),
          term('Adobe suite', 1, 'photoshop', 'illustrator', 'after effects', 'creative cloud'),
          term('Branding', 1, 'branding', 'brand identity', 'logo design'),
          term('Web / app design', 1, 'web design', 'app design', 'mobile app design', 'website design'),
          term('Layout and grids', 1, 'layout', 'grid system')
        ]
      },
      {
        key: 'portfolio',
        label: 'Portfolio and case studies',
        max: 10,
        target: 6,
        kind: 'terms',
        why: 'Links to Behance, Dribbble, a portfolio or Figma prototypes, and written-up case studies.',
        terms: [
          term('Behance', 4, 'behance'),
          term('Dribbble', 4, 'dribbble'),
          term('Portfolio', 3, 'portfolio'),
          term('Case study', 3, 'case study', 'case studies'),
          term('Figma link', 3, 'figma.com'),
          term('Medium / Notion write-up', 1, 'medium.com', 'notion.site')
        ]
      },
      {
        key: 'projects',
        label: 'Design projects',
        max: 10,
        kind: 'projects',
        fullCount: 3,
        why: 'Projects and internships that show design work. Full marks at 3.'
      },
      {
        key: 'experience',
        label: 'Design experience',
        max: 10,
        kind: 'experience',
        fullYears: 0.5,
        why: 'The JD is open to 0 to 1 year, so six months of design work earns full marks. More experience is not penalised.'
      },
      {
        key: 'education',
        label: 'Education',
        max: 5,
        kind: 'education',
        why: 'A degree earns a little. Design, HCI, psychology or communication fields earn the rest.'
      },
      {
        key: 'mission',
        label: 'Sustainability interest',
        max: 5,
        target: 2,
        kind: 'terms',
        why: 'The product is aimed at the sustainability sector.',
        terms: [
          term('Sustainability', 1, 'sustainability', 'sustainable'),
          term('Climate / environment', 1, 'climate', 'environment', 'green'),
          term('Social impact', 1, 'social impact', 'ngo', 'non profit', 'nonprofit')
        ]
      }
    ]
  }
}

export const ROLE_IDS = Object.keys(ROLES)

export const LABELS = {
  lca: 'LCA',
  uiux: 'UI/UX',
  both: 'Both',
  unsure: 'Neither / uncertain'
}
