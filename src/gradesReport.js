// Turns the ScoDoc payloads relayed by the notes9 passerelle into what the
// "Mes notes" page renders. Pure data: no browser or @university import, so
// the tests run it straight in Node.
//
// Payload shapes (ScoDoc 9 BUT bulletin, wrapped by the passerelle):
// - first connection: { auth, config, semestres, relevé, absences, totauxAbsences? }
// - one semester:     { relevé, absences, totauxAbsences?, config? }
// In a BUT relevé, evaluation notes are already on /20 and note.min/moy/max
// are promo stats; ScoDoc leaves module averages empty (only UE averages are
// official), so the page shows an indicative module average it computes.

export const GRADE_SCALE = 20

const EVALUATION_TYPE_LABELS = {
  1: 'Rattrapage',
  2: 'Session 2',
  3: 'Bonus',
}

const SPECIAL_GRADE_LABELS = {
  '~': { kind: 'pending', label: 'En attente' },
  ATT: { kind: 'pending', label: 'En attente' },
  ABS: { kind: 'absent', label: 'Absent' },
  EXC: { kind: 'excused', label: 'Excusé' },
  NP: { kind: 'absent', label: 'Non présenté' },
}

export function parseGradeNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const text = String(value ?? '').trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return null
  }

  return Number(text)
}

// What a raw ScoDoc note value means: a number, or one of its codes.
export function describeGrade(rawValue) {
  const number = parseGradeNumber(rawValue)
  if (number != null) {
    return { kind: 'number', value: number, label: formatGrade(number) }
  }

  const code = String(rawValue ?? '').trim()
  if (!code || code === '-' || code === 'NA') {
    return { kind: 'none', value: null, label: '—' }
  }

  const special = SPECIAL_GRADE_LABELS[code.toUpperCase()]
  return special
    ? { kind: special.kind, value: null, label: special.label }
    : { kind: 'other', value: null, label: code }
}

// 15.5 → "15,5", 14 → "14", 12.333 → "12,33" (French decimal comma).
export function formatGrade(value, maxDecimals = 2) {
  const number = parseGradeNumber(value)
  if (number == null) {
    return '—'
  }

  return number.toLocaleString('fr-FR', { maximumFractionDigits: maxDecimals, minimumFractionDigits: 0 })
}

function readStats(source) {
  if (!source || typeof source !== 'object') {
    return { value: parseGradeNumber(source), min: null, moy: null, max: null }
  }

  return {
    value: parseGradeNumber(source.value),
    min: parseGradeNumber(source.min),
    moy: parseGradeNumber(source.moy),
    max: parseGradeNumber(source.max),
  }
}

function readRank(value, total) {
  const rank = String(value ?? '').trim()
  const count = Number.parseInt(total, 10)
  if (!rank) {
    return null
  }

  // ScoDoc writes ex aequo ranks as "12 ex".
  return {
    value: rank.replace(/\s*ex$/i, ' ex æquo'),
    total: Number.isFinite(count) && count > 0 ? count : null,
  }
}

function readEcts(source) {
  const earned = parseGradeNumber(source?.acquis)
  const total = parseGradeNumber(source?.total)
  return earned == null && total == null ? null : { earned, total }
}

function readGroupNames(groups) {
  return (Array.isArray(groups) ? groups : [])
    .map((group) => String(group?.group_name ?? group?.nom ?? group ?? '').trim())
    .filter((name, index, names) => name && names.indexOf(name) === index)
}

function readGroupRanks(groups) {
  if (!groups || typeof groups !== 'object') {
    return []
  }

  return Object.entries(groups)
    .map(([key, entry]) => {
      const name = String(entry?.group_name ?? entry?.nom ?? key).trim()
      const rank = Array.isArray(entry) ? readRank(entry[0], entry[1]) : readRank(entry?.value, entry?.total)
      return rank ? { name, ...rank } : null
    })
    .filter(Boolean)
}

function readEvaluationDate(evaluation) {
  const date = evaluation?.date_debut ?? evaluation?.date ?? null
  return typeof date === 'string' && date ? date : null
}

function normalizeEvaluation(evaluation, index) {
  const type = Number(evaluation?.evaluation_type ?? 0)
  const weights = Object.entries(evaluation?.poids ?? {})
    .map(([ue, weight]) => ({ ue, weight: parseGradeNumber(weight) }))
    .filter((entry) => entry.weight != null && entry.weight > 0)

  return {
    id: String(evaluation?.id ?? `evaluation-${index}`),
    description: String(evaluation?.description ?? '').trim() || 'Évaluation',
    date: readEvaluationDate(evaluation),
    typeLabel: EVALUATION_TYPE_LABELS[type] ?? null,
    // Only normal evaluations with a UE weight move the averages.
    canSimulate: type === 0 && weights.length > 0,
    coef: parseGradeNumber(evaluation?.coef),
    grade: describeGrade(evaluation?.note?.value),
    promo: {
      min: parseGradeNumber(evaluation?.note?.min),
      moy: parseGradeNumber(evaluation?.note?.moy),
      max: parseGradeNumber(evaluation?.note?.max),
    },
    weights,
  }
}

// Coefficient-weighted mean of the graded "normal" evaluations: what the
// module would weigh if every UE counted it the same way. Indicative only.
export function computeIndicativeAverage(evaluations) {
  let weighted = 0
  let coefSum = 0

  for (const evaluation of evaluations) {
    if (evaluation.typeLabel || evaluation.grade.kind !== 'number') continue
    const coef = evaluation.coef ?? 1
    if (coef <= 0) continue
    weighted += evaluation.grade.value * coef
    coefSum += coef
  }

  return coefSum > 0 ? weighted / coefSum : null
}

function normalizeModules(section, kind, ueByCode) {
  return Object.entries(section ?? {}).map(([code, module]) => {
    const evaluations = (module?.evaluations ?? []).map(normalizeEvaluation)
    const officialAverage = parseGradeNumber(module?.moyenne?.value ?? module?.moyenne)
    const average = officialAverage ?? computeIndicativeAverage(evaluations)
    const sectionKey = kind === 'sae' ? 'saes' : 'ressources'
    const ueCoefs = Object.values(ueByCode)
      .map((ue) => {
        const link = ue.raw?.[sectionKey]?.[code]
        const coef = parseGradeNumber(link?.coef)
        return coef != null && coef > 0 ? { ue: ue.code, coef, color: ue.color } : null
      })
      .filter(Boolean)

    return {
      id: String(module?.id ?? code),
      code,
      title: String(module?.titre ?? code),
      kind,
      average,
      averageIsIndicative: officialAverage == null && average != null,
      evaluations,
      ueCoefs,
      gradedCount: evaluations.filter((evaluation) => evaluation.grade.kind === 'number').length,
      pendingCount: evaluations.filter((evaluation) => evaluation.grade.kind === 'pending').length,
    }
  })
}

function normalizeUeModules(ue, modulesByCode) {
  return ['ressources', 'saes'].flatMap((sectionKey) => (
    Object.entries(ue?.[sectionKey] ?? {}).map(([code, link]) => ({
      code,
      title: modulesByCode.get(code)?.title ?? code,
      kind: sectionKey === 'saes' ? 'sae' : 'resource',
      coef: parseGradeNumber(link?.coef),
      average: parseGradeNumber(link?.moyenne?.value ?? link?.moyenne),
    }))
  ))
}

function nonZero(value) {
  const number = parseGradeNumber(value)
  return number != null && number !== 0 ? number : null
}

function normalizeUes(ues) {
  return Object.entries(ues ?? {}).map(([code, ue]) => {
    const average = readStats(ue?.moyenne)

    return {
      code,
      title: String(ue?.titre ?? code),
      color: typeof ue?.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(ue.color) ? ue.color : null,
      average,
      rank: readRank(ue?.moyenne?.rang, ue?.moyenne?.total),
      ects: readEcts(ue?.ECTS),
      bonus: nonZero(ue?.bonus),
      malus: nonZero(ue?.malus),
      capitalized: Boolean(ue?.capitalise),
      raw: ue,
    }
  })
}

function readOption(options, key) {
  return options?.[key] !== false && options?.[key] !== 0
}

function readSituation(semestre) {
  const lines = []
  const yearCode = semestre?.decision_annee?.code
  if (yearCode) lines.push(`Décision annuelle : ${yearCode}`)
  const semesterCode = semestre?.decision?.code
  if (semesterCode) lines.push(`Décision du semestre : ${semesterCode}`)
  if (typeof semestre?.situation === 'string' && semestre.situation.trim()) {
    lines.push(htmlToPlainText(semestre.situation))
  }
  return lines
}

export function getReleveDepartment(releve) {
  const department = releve?.etudiant?.dept_acronym
    ?? String(releve?.etudiant?.photo_url ?? '').split('/')[2]
  return typeof department === 'string' && department.trim() ? department.trim() : null
}

function isDepartmentListed(list, department) {
  const entries = String(list ?? '').split(',').map((entry) => entry.trim()).filter(Boolean)
  return entries.length === 0 || (department != null && entries.includes(department))
}

// Mirrors the passerelle: a department list left empty means "everyone".
export function canDownloadReportPdf(config, department) {
  return Boolean(config?.releve_PDF) && isDepartmentListed(config?.liste_dep_publi_PDF, department)
}

function canShowAppreciations(config, department) {
  if (!config || config.liste_dep_affichage_appreciations == null) {
    return true
  }

  const entries = String(config.liste_dep_affichage_appreciations).split(',').map((entry) => entry.trim())
  return department != null && entries.includes(department)
}

export function buildGradesReport(releve, { config = null } = {}) {
  if (!releve || typeof releve !== 'object') {
    return { status: 'empty' }
  }

  if (releve.publie === false) {
    return { status: 'unpublished', message: htmlToPlainText(releve.message) || "Le relevé de ce semestre n'est pas publié." }
  }

  if (releve.type && releve.type !== 'BUT') {
    return { status: 'unsupported', type: releve.type }
  }

  const department = getReleveDepartment(releve)
  const options = releve.options ?? {}
  const semestre = releve.semestre ?? {}
  const ues = normalizeUes(releve.ues)
  const ueByCode = Object.fromEntries(ues.map((ue) => [ue.code, ue]))
  const resources = normalizeModules(releve.ressources, 'resource', ueByCode)
  const saes = normalizeModules(releve.saes, 'sae', ueByCode)
  const modulesByCode = new Map([...resources, ...saes].map((module) => [module.code, module]))
  const showRanks = readOption(options, 'show_rangs')
  const showUeRanks = showRanks && readOption(options, 'show_ue_rangs')

  const latest = [...resources, ...saes]
    .flatMap((module) => module.evaluations
      .filter((evaluation) => evaluation.date && evaluation.grade.kind === 'number')
      .map((evaluation) => ({ ...evaluation, moduleCode: module.code, moduleTitle: module.title, moduleKind: module.kind })))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6)

  const semesterAverage = readStats(semestre.notes)

  return {
    status: 'ok',
    department,
    student: {
      firstName: String(releve.etudiant?.prenom ?? '').trim() || null,
      lastName: String(releve.etudiant?.nom ?? '').trim() || null,
    },
    formation: {
      acronym: releve.formation?.acronyme ?? null,
      title: releve.formation?.titre ?? releve.formation?.titre_officiel ?? null,
    },
    semester: {
      number: semestre.numero ?? null,
      year: semestre.annee_universitaire ?? null,
      start: semestre.date_debut ?? null,
      end: semestre.date_fin ?? null,
      groups: readGroupNames(semestre.groupes),
    },
    publishedAt: releve.date ?? null,
    average: semesterAverage,
    showPromoStats: readOption(options, 'show_minmax') || readOption(options, 'show_moypromo'),
    rank: showRanks ? readRank(semestre.rang?.value, semestre.rang?.total) : null,
    groupRanks: showRanks ? readGroupRanks(semestre.rang?.groupes) : [],
    ects: readOption(options, 'show_ects') ? readEcts(semestre.ECTS) : null,
    absenceSummary: semestre.absences && readOption(options, 'show_abs')
      ? {
          unjustified: parseGradeNumber(semestre.absences.injustifie),
          total: parseGradeNumber(semestre.absences.total),
          unit: String(semestre.absences.metrique ?? '').trim() || null,
        }
      : null,
    situation: readSituation(semestre),
    ues: ues.map(({ raw, ...ue }) => ({
      ...ue,
      rank: showUeRanks ? ue.rank : null,
      modules: normalizeUeModules(raw, modulesByCode),
    })),
    resources,
    saes,
    latest,
    appreciations: canShowAppreciations(config, department)
      ? (Array.isArray(releve.appreciation) ? releve.appreciation : [])
          .map((entry) => htmlToPlainText(entry?.comment ?? entry))
          .filter(Boolean)
      : [],
  }
}

// What one evaluation counts for in ScoDoc's averages: a number, 0 for an
// unjustified absence, nothing for pending/excused.
function readCountedGrade(rawValue) {
  const grade = describeGrade(rawValue)
  if (grade.kind === 'number') return grade.value
  if (grade.kind === 'absent') return 0
  return null
}

// A module's average inside one UE: its normal evaluations weighted by
// coefficient × the evaluation's weight toward that UE (ScoDoc's BUT rule).
function computeModuleUeAverage(evaluations, ueCode, overrides) {
  let weighted = 0
  let weightSum = 0

  for (const evaluation of evaluations ?? []) {
    if (Number(evaluation?.evaluation_type ?? 0) !== 0) continue
    const ueWeight = parseGradeNumber(evaluation?.poids?.[ueCode])
    if (!ueWeight) continue
    const id = String(evaluation?.id ?? '')
    const value = id in overrides ? overrides[id] : readCountedGrade(evaluation?.note?.value)
    if (value == null) continue
    const weight = (parseGradeNumber(evaluation?.coef) ?? 1) * ueWeight
    weighted += value * weight
    weightSum += weight
  }

  return weightSum > 0 ? weighted / weightSum : null
}

// UE averages recomputed from the evaluations, with `overrides`
// (evaluation id → grade on /20) replacing real or missing grades.
export function computeUeAverages(releve, overrides = {}) {
  const averages = {}

  for (const [ueCode, ue] of Object.entries(releve?.ues ?? {})) {
    let weighted = 0
    let coefSum = 0

    for (const sectionKey of ['ressources', 'saes']) {
      for (const [moduleCode, link] of Object.entries(ue?.[sectionKey] ?? {})) {
        const moduleCoef = parseGradeNumber(link?.coef)
        if (!moduleCoef) continue
        const moduleAverage = computeModuleUeAverage(releve?.[sectionKey]?.[moduleCode]?.evaluations, ueCode, overrides)
        if (moduleAverage == null) continue
        weighted += moduleAverage * moduleCoef
        coefSum += moduleCoef
      }
    }

    averages[ueCode] = coefSum > 0 ? weighted / coefSum : null
  }

  return averages
}

function clampGrade(value) {
  return Math.min(GRADE_SCALE, Math.max(0, value))
}

// "What if" averages. The simulated change is applied on top of ScoDoc's
// official UE averages, so bonus, malus and ScoDoc's own rounding stay in;
// the general average moves with the UEs, weighted by their ECTS.
export function projectAverages(releve, overrides) {
  const baseline = computeUeAverages(releve)
  const simulated = computeUeAverages(releve, overrides)
  const ues = {}
  let weightedDelta = 0
  let weightedProjected = 0
  let weightSum = 0

  for (const [ueCode, ue] of Object.entries(releve?.ues ?? {})) {
    const official = parseGradeNumber(ue?.moyenne?.value)
    const simulatedValue = simulated[ueCode]
    let projected = official
    if (simulatedValue != null) {
      projected = clampGrade(official != null && baseline[ueCode] != null
        ? official + (simulatedValue - baseline[ueCode])
        : simulatedValue)
    }

    ues[ueCode] = { official, projected }
    if (projected == null) continue

    const weight = parseGradeNumber(ue?.ECTS?.total) || 1
    weightedDelta += (projected - (official ?? projected)) * weight
    weightedProjected += projected * weight
    weightSum += weight
  }

  const officialGeneral = parseGradeNumber(releve?.semestre?.notes?.value)
  let general = null
  if (weightSum > 0) {
    general = clampGrade(officialGeneral != null ? officialGeneral + weightedDelta / weightSum : weightedProjected / weightSum)
  }

  return { ues, general: { official: officialGeneral, projected: general } }
}

// "New since last visit": evaluations whose grade signature (id + value)
// isn't in `seenSignatures`. A semester never seen before has nothing new.
export function gradeSignature(evaluation) {
  return `${evaluation.id}:${evaluation.grade.kind === 'number' ? evaluation.grade.value : evaluation.grade.kind}`
}

export function findNewGrades(report, seenSignatures) {
  if (!Array.isArray(seenSignatures)) {
    return new Set()
  }

  const seen = new Set(seenSignatures)
  return new Set([...report.resources, ...report.saes]
    .flatMap((module) => module.evaluations)
    .filter((evaluation) => evaluation.grade.kind === 'number' && !seen.has(gradeSignature(evaluation)))
    .map((evaluation) => evaluation.id))
}

export function listGradeSignatures(report) {
  return [...report.resources, ...report.saes]
    .flatMap((module) => module.evaluations)
    .map(gradeSignature)
}

// Semester picker entries, newest first (ScoDoc lists them oldest first).
export function listGradesSemesters(semestres) {
  return (Array.isArray(semestres) ? semestres : [])
    .filter((semester) => semester?.formsemestre_id != null)
    .map((semester) => ({
      id: String(semester.formsemestre_id),
      number: semester.semestre_id ?? null,
      title: String(semester.titre ?? '').trim() || null,
      year: String(semester.annee_scolaire ?? '').trim() || null,
    }))
    .reverse()
}

// 13.5 → "13h30", as the passerelle writes absence hours.
export function formatHour(value) {
  const number = parseGradeNumber(value)
  if (number == null) {
    return ''
  }

  const hours = Math.floor(number)
  const minutes = Math.round((number - hours) * 60)
  return `${hours}h${String(minutes).padStart(2, '0')}`
}

// 2 → "2h", 1.5 → "1h30".
export function formatDuration(hours) {
  if (hours <= 0) return '0h'
  const formatted = formatHour(hours)
  return formatted.endsWith('h00') ? formatted.slice(0, -2) : formatted
}

function findModuleLabel(releve, subject) {
  if (Number.isInteger(subject)) {
    const entry = Object.entries({ ...releve?.ressources, ...releve?.saes })
      .find(([, module]) => module?.id === subject)
    return entry ? `${entry[0]} – ${entry[1].titre}` : null
  }

  const text = String(subject ?? '').trim()
  return text || null
}

function formatTeacher(value) {
  const name = String(value ?? '').split('@')[0].split('.').join(' ').trim()
  return name ? name.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()) : null
}

const ABSENCE_TOTAL_UNITS = {
  heure: (value) => `${formatGrade(value)}h`,
  demi: (value) => `${formatGrade(value)} demi-journée${value > 1 ? 's' : ''}`,
  journee: (value) => `${formatGrade(value)} journée${value > 1 ? 's' : ''}`,
  compte: (value) => formatGrade(value),
}

// The "Rapport d'absences": same visibility rules and totals as the passerelle.
export function buildAbsenceReport(payload, releve, config) {
  const department = getReleveDepartment(releve)
  if (config && (!config.afficher_absences || !isDepartmentListed(config.liste_dep_publi_absences, department))) {
    return { visible: false }
  }

  const totals = { justified: 0, unjustified: 0, late: 0 }
  const entries = []
  let spansSeveralDays = false

  for (const [date, list] of Object.entries(payload?.absences ?? {})) {
    for (const absence of Array.isArray(list) ? list : []) {
      if (!absence || absence.statut === 'present') continue

      const start = parseGradeNumber(absence.debut) ?? 0
      const end = parseGradeNumber(absence.fin) ?? start
      const justified = absence.justifie === true || absence.justifie === 'true'
      const status = justified ? 'justified' : absence.statut === 'retard' ? 'late' : 'unjustified'

      if (justified) totals.justified += end - start
      else if (status === 'late') totals.late += 1
      else totals.unjustified += end - start

      const endDate = absence.dateFin && absence.dateFin !== date ? absence.dateFin : null
      if (endDate) spansSeveralDays = true

      entries.push({
        id: `${date}-${start}-${entries.length}`,
        date,
        endDate,
        start: formatHour(start),
        startHours: start,
        end: formatHour(end),
        subject: findModuleLabel(releve, absence.matiereComplet),
        teacher: formatTeacher(absence.enseignant),
        status,
        // Lateness is counted in occurrences, not hours.
        hours: status === 'late' ? 0 : Math.max(0, end - start),
      })
    }
  }

  entries.sort((left, right) => right.date.localeCompare(left.date) || right.start.localeCompare(left.start))

  let totalLabels = {
    justified: formatDuration(totals.justified),
    unjustified: formatDuration(totals.unjustified),
    late: String(totals.late),
  }

  // ScoDoc's own totals, in the unit the passerelle is configured for.
  const scodocTotals = payload?.totauxAbsences?.absent
  const unit = config?.metrique_absences
  if (scodocTotals && ABSENCE_TOTAL_UNITS[unit]) {
    const justified = parseGradeNumber(scodocTotals.justifie?.[unit])
    const unjustified = parseGradeNumber(scodocTotals.non_justifie?.[unit])
    totalLabels = {
      ...totalLabels,
      ...(justified != null ? { justified: ABSENCE_TOTAL_UNITS[unit](justified) } : null),
      ...(unjustified != null ? { unjustified: ABSENCE_TOTAL_UNITS[unit](unjustified) } : null),
    }
  }

  return {
    visible: true,
    notice: htmlToPlainText(config?.message_rapport_absences) || null,
    entries,
    // Hour totals mean nothing once an absence spans several days.
    totals: spansSeveralDays && !scodocTotals ? null : totalLabels,
  }
}

// Absences have to be justified within this long of their start (ScoDoc
// passerelle default notice: 48 h).
export const JUSTIFICATION_WINDOW_HOURS = 48

// Hours left to justify an absence: positive while the window is open,
// negative once it has closed. Null when the date is unreadable.
export function hoursToJustify(entry, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry?.date ?? '')
  if (!match) {
    return null
  }

  const start = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0)
  start.setMinutes(Math.round((entry.startHours ?? 0) * 60))
  const deadline = start.getTime() + JUSTIFICATION_WINDOW_HOURS * 3600 * 1000
  return (deadline - now.getTime()) / 3600 / 1000
}

// The pre-filled mail to the department's secretariat. A mailto: link: the
// mail is written and sent from the student's own mail client, nothing goes
// through Tafac (and the link can't attach a file: the student adds it).
export function buildJustificationMail({ to, student, entries, semesterLabel = null, formatDate }) {
  const list = Array.isArray(entries) ? entries : [entries]
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(' ')
  const day = (entry) => formatDate?.(entry.date) ?? entry.date
  const lines = list.map((entry) => {
    const detail = [entry.subject, entry.teacher ? `(${entry.teacher})` : null].filter(Boolean).join(' ')
    return `- ${day(entry)}, ${entry.start} – ${entry.end}${detail ? ` · ${detail}` : ''}`
  })
  const subject = list.length === 1
    ? `Justificatif d'absence du ${day(list[0])}${name ? ` - ${name}` : ''}`
    : `Justificatif d'absences${name ? ` - ${name}` : ''}`
  const body = [
    'Bonjour,',
    '',
    list.length === 1
      ? "Je vous transmets un justificatif pour l'absence suivante :"
      : 'Je vous transmets un justificatif pour les absences suivantes :',
    ...lines,
    '',
    semesterLabel ? `Semestre : ${semesterLabel}` : null,
    '(justificatif en pièce jointe)',
    '',
    'Cordialement,',
    name,
  ].filter((line) => line != null).join('\n')

  return {
    to,
    subject,
    body,
    href: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  }
}

// Hours missed per subject (lateness left out), most missed first: where a
// department's absence malus would bite.
export function summarizeAbsencesBySubject(entries) {
  const bySubject = new Map()

  for (const entry of entries) {
    if (entry.status === 'late') continue
    const subject = entry.subject ?? 'Matière non précisée'
    const current = bySubject.get(subject) ?? { subject, hours: 0, unjustifiedHours: 0, count: 0 }
    current.hours += entry.hours
    current.count += 1
    if (entry.status === 'unjustified') current.unjustifiedHours += entry.hours
    bySubject.set(subject, current)
  }

  return [...bySubject.values()].sort((left, right) => right.hours - left.hours || left.subject.localeCompare(right.subject))
}

const HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  agrave: 'à',
  acirc: 'â',
  ccedil: 'ç',
  ocirc: 'ô',
  ucirc: 'û',
  ugrave: 'ù',
  icirc: 'î',
  euro: '€',
  rsquo: '’',
  laquo: '«',
  raquo: '»',
}

// ScoDoc messages and appreciations are HTML written by staff. The page shows
// them as text (line breaks kept) rather than injecting markup.
export function htmlToPlainText(html) {
  if (html == null) {
    return ''
  }

  return String(html)
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
      if (name[0] === '#') {
        const code = name[1].toLowerCase() === 'x' ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10)
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ''
      }
      return HTML_ENTITIES[name.toLowerCase()] ?? entity
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
