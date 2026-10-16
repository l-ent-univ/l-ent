import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDemoGradesPayload, buildDemoSemesterGradesPayload } from '../src/demoAccount.js'
import {
  buildAbsenceReport,
  buildGradesReport,
  buildJustificationMail,
  canDownloadReportPdf,
  computeIndicativeAverage,
  computeUeAverages,
  describeGrade,
  findNewGrades,
  formatDuration,
  formatGrade,
  formatHour,
  hoursToJustify,
  htmlToPlainText,
  listGradeSignatures,
  listGradesSemesters,
  projectAverages,
  summarizeAbsencesBySubject,
} from '../src/gradesReport.js'

test('describeGrade reads numbers and ScoDoc codes', () => {
  assert.deepEqual(describeGrade('15.50'), { kind: 'number', value: 15.5, label: '15,5' })
  assert.equal(describeGrade('12,25').value, 12.25)
  assert.equal(describeGrade('~').kind, 'pending')
  assert.equal(describeGrade('ABS').kind, 'absent')
  assert.equal(describeGrade('abs').kind, 'absent')
  assert.equal(describeGrade('EXC').kind, 'excused')
  assert.equal(describeGrade('').kind, 'none')
  assert.equal(describeGrade(null).kind, 'none')
  assert.deepEqual(describeGrade('DEF'), { kind: 'other', value: null, label: 'DEF' })
})

test('formatGrade uses a decimal comma and drops trailing zeros', () => {
  assert.equal(formatGrade('14.00'), '14')
  assert.equal(formatGrade(12.333), '12,33')
  assert.equal(formatGrade('n/a'), '—')
})

test('the indicative module average skips retakes and non-numeric notes', () => {
  const evaluation = (value, coef, typeLabel = null) => ({ grade: describeGrade(value), coef, typeLabel })
  assert.equal(computeIndicativeAverage([evaluation('10', 1), evaluation('16', 2)]), 14)
  assert.equal(computeIndicativeAverage([evaluation('10', 1), evaluation('ABS', 1), evaluation('20', 1, 'Rattrapage')]), 10)
  assert.equal(computeIndicativeAverage([evaluation('~', 1)]), null)
})

test('listGradesSemesters puts the newest semester first', () => {
  const semesters = listGradesSemesters(buildDemoGradesPayload().semestres)
  assert.deepEqual(semesters.map((semester) => semester.id), ['9105', '9104'])
  assert.deepEqual(semesters[0], { id: '9105', number: 5, title: 'BUT MMI', year: '2026/2027' })
})

test('buildGradesReport reads the semester, UEs and modules of a BUT relevé', () => {
  const payload = buildDemoGradesPayload()
  const report = buildGradesReport(payload['relevé'], { config: payload.config })

  assert.equal(report.status, 'ok')
  assert.equal(report.department, 'MMI')
  assert.equal(report.semester.number, 5)
  assert.deepEqual(report.semester.groups, ['TD B', 'TP 3'])
  assert.equal(report.average.value, 14.35)
  assert.equal(report.average.moy, 12.44)
  assert.deepEqual(report.rank, { value: '9', total: 84 })
  assert.deepEqual(report.ects, { earned: 0, total: 30 })

  const ue = report.ues.find((entry) => entry.code === 'UE5.3')
  assert.equal(ue.average.value, 15.96)
  assert.equal(ue.bonus, 0.1)
  assert.equal(ue.color, '#feb40b')
  assert.deepEqual(ue.modules.map((module) => [module.code, module.coef]), [['R5.11', 4], ['SAÉ 5.01', 4]])

  const ux = report.resources.find((module) => module.code === 'R5.07')
  // (14 × 1 + 17 × 2) / 3
  assert.equal(ux.average, 16)
  assert.equal(ux.averageIsIndicative, true)
  assert.deepEqual(ux.ueCoefs.map((entry) => [entry.ue, entry.coef]), [['UE5.1', 3], ['UE5.2', 2]])
  assert.deepEqual(ux.evaluations[1].weights, [{ ue: 'UE5.1', weight: 1 }, { ue: 'UE5.2', weight: 1 }])
  assert.deepEqual(ux.evaluations[1].promo, { min: 8, moy: 13.9, max: 19 })

  const english = report.resources.find((module) => module.code === 'R5.02')
  assert.equal(english.evaluations[2].typeLabel, 'Rattrapage')
  assert.equal(english.evaluations[2].coef, null)

  assert.equal(report.resources.find((module) => module.code === 'R5.04').pendingCount, 1)
  assert.deepEqual(report.latest.slice(0, 2).map((evaluation) => evaluation.description), ['Démo client', 'Accessibilité UI'])
  assert.ok(report.latest.every((evaluation) => evaluation.grade.kind === 'number'))
})

test('buildGradesReport honours ScoDoc display options and publication', () => {
  const releve = buildDemoGradesPayload()['relevé']
  const hidden = buildGradesReport({ ...releve, options: { show_rangs: false, show_ects: false } })
  assert.equal(hidden.rank, null)
  assert.equal(hidden.ects, null)
  assert.ok(hidden.ues.every((ue) => ue.rank === null))

  assert.deepEqual(
    buildGradesReport({ publie: false, message: '<b>Relevé</b> bloqué' }),
    { status: 'unpublished', message: 'Relevé bloqué' },
  )
  assert.equal(buildGradesReport({ type: 'DUT' }).status, 'unsupported')
  assert.equal(buildGradesReport(null).status, 'empty')
})

test('appreciations follow the passerelle department list', () => {
  const payload = buildDemoSemesterGradesPayload('9104')
  const releve = payload['relevé']
  assert.deepEqual(buildGradesReport(releve, { config: payload.config }).appreciations, ['Très bon semestre, travail régulier et sérieux.'])
  assert.deepEqual(buildGradesReport(releve, { config: { liste_dep_affichage_appreciations: 'INFO' } }).appreciations, [])
})

test('buildAbsenceReport lists absences newest first with passerelle totals', () => {
  const payload = buildDemoGradesPayload()
  const report = buildAbsenceReport(payload, payload['relevé'], payload.config)

  assert.equal(report.visible, true)
  assert.deepEqual(report.entries.map((entry) => [entry.date, entry.start, entry.status]), [
    ['2026-10-06', '14h00', 'justified'],
    ['2026-10-06', '10h15', 'late'],
    ['2026-09-29', '13h30', 'justified'],
    ['2026-09-25', '8h15', 'unjustified'],
  ])
  assert.equal(report.entries[0].subject, 'R5.11 – Développement Front')
  assert.equal(report.entries[1].subject, 'R5.02 - Anglais')
  assert.equal(report.entries[0].teacher, 'Thomas Lemoine')
  assert.deepEqual(report.totals, { justified: '4h', unjustified: '2h', late: '1' })

  assert.equal(buildAbsenceReport(payload, payload['relevé'], { ...payload.config, afficher_absences: false }).visible, false)
  assert.equal(buildAbsenceReport(payload, payload['relevé'], { ...payload.config, liste_dep_publi_absences: 'INFO,GEA' }).visible, false)
})

test('summarizeAbsencesBySubject adds up missed hours per subject', () => {
  const payload = buildDemoGradesPayload()
  const report = buildAbsenceReport(payload, payload['relevé'], payload.config)
  assert.deepEqual(report.entries.map((entry) => entry.hours), [2, 0, 2, 2])

  assert.deepEqual(summarizeAbsencesBySubject(report.entries), [
    { subject: 'R5.11 – Développement Front', hours: 4, unjustifiedHours: 2, count: 2 },
    { subject: 'SAÉ 5.01 – Prototype interactif', hours: 2, unjustifiedHours: 0, count: 1 },
  ])
  assert.equal(formatDuration(1.5), '1h30')
  assert.equal(formatDuration(4), '4h')
})

test('hoursToJustify counts 48 hours from the start of the absence', () => {
  const entry = { date: '2026-09-25', startHours: 8.25 }
  // Deadline: Sunday 27 Sept 08:15.
  assert.equal(hoursToJustify(entry, new Date(2026, 8, 25, 20, 15)), 36)
  assert.equal(hoursToJustify(entry, new Date(2026, 8, 27, 10, 15)), -2)
  assert.equal(hoursToJustify({ date: 'n/a' }), null)
})

test('buildJustificationMail writes a mailto: link for the secretariat', () => {
  const payload = buildDemoGradesPayload()
  const report = buildAbsenceReport(payload, payload['relevé'], payload.config)
  const entry = report.entries.find((candidate) => candidate.status === 'unjustified')
  const mail = buildJustificationMail({
    to: 'secretariat@exemple.fr',
    student: { firstName: 'Camille', lastName: 'MARTIN' },
    entries: entry,
    semesterLabel: 'S5 2026/2027',
    formatDate: (date) => date.split('-').reverse().join('/'),
  })

  assert.equal(mail.subject, "Justificatif d'absence du 25/09/2026 - Camille MARTIN")
  assert.match(mail.body, /- 25\/09\/2026, 8h15 – 10h15 · R5\.11 – Développement Front \(Thomas Lemoine\)/)
  assert.ok(mail.href.startsWith('mailto:secretariat@exemple.fr?subject='))
  assert.equal(decodeURIComponent(mail.href.split('&body=')[1]), mail.body)
})

test('buildAbsenceReport prefers ScoDoc totals in the configured unit', () => {
  const payload = {
    absences: {},
    totauxAbsences: { absent: { justifie: { demi: 3 }, non_justifie: { demi: 1 } } },
  }
  const report = buildAbsenceReport(payload, {}, { afficher_absences: true, metrique_absences: 'demi' })
  assert.equal(report.totals.justified, '3 demi-journées')
  assert.equal(report.totals.unjustified, '1 demi-journée')
})

test('PDF download follows the passerelle switches', () => {
  assert.equal(canDownloadReportPdf({ releve_PDF: true, liste_dep_publi_PDF: '' }, 'INFO'), true)
  assert.equal(canDownloadReportPdf({ releve_PDF: true, liste_dep_publi_PDF: 'MMI,GEA' }, 'INFO'), false)
  assert.equal(canDownloadReportPdf({ releve_PDF: false }, 'INFO'), false)
  assert.equal(canDownloadReportPdf(null, 'INFO'), false)
})

test('computeUeAverages follows module coefficients and evaluation weights', () => {
  const releve = {
    ressources: {
      R1: {
        evaluations: [
          { id: 1, evaluation_type: 0, coef: '1', poids: { UE1: 1 }, note: { value: '10' } },
          { id: 2, evaluation_type: 0, coef: '3', poids: { UE1: 1, UE2: 1 }, note: { value: '14' } },
          { id: 3, evaluation_type: 0, coef: '1', poids: { UE1: 1 }, note: { value: '~' } },
          { id: 4, evaluation_type: 1, coef: null, poids: { UE1: 1 }, note: { value: '20' } },
        ],
      },
    },
    saes: { S1: { evaluations: [{ id: 5, evaluation_type: 0, coef: '1', poids: { UE1: 1 }, note: { value: 'ABS' } }] } },
    ues: {
      UE1: { ressources: { R1: { coef: 1 } }, saes: { S1: { coef: 1 } } },
      UE2: { ressources: { R1: { coef: 2 } } },
    },
  }

  // UE1: R1 = (10 + 42) / 4 = 13, S1 = 0 (ABS) → 6.5. UE2: R1 = 14.
  assert.deepEqual(computeUeAverages(releve), { UE1: 6.5, UE2: 14 })
  // The pending evaluation simulated at 18 (R1 = 70 / 5 = 14), the absence
  // replaced by 12 → UE1 = 13.
  assert.deepEqual(computeUeAverages(releve, { 3: 18, 5: 12 }), { UE1: 13, UE2: 14 })
})

test('projectAverages shifts the official averages by the simulated change', () => {
  const releve = buildDemoGradesPayload()['relevé']
  const unchanged = projectAverages(releve, {})
  assert.equal(unchanged.ues['UE5.1'].projected, 14.62)
  assert.equal(unchanged.general.projected, 14.35)

  // Soutenance de cadrage (R5.04, UE5.1 only) at 20.
  const projection = projectAverages(releve, { 70142: 20 })
  assert.ok(projection.ues['UE5.1'].projected > 14.62)
  assert.equal(projection.ues['UE5.2'].projected, 12.48)
  assert.equal(projection.ues['UE5.3'].projected, 15.96)
  assert.ok(projection.general.projected > 14.35)
})

test('findNewGrades only flags grades unseen in a semester already visited', () => {
  const report = buildGradesReport(buildDemoGradesPayload()['relevé'])
  assert.equal(findNewGrades(report, null).size, 0)

  const seen = listGradeSignatures(report).filter((signature) => !signature.startsWith('70112:'))
  assert.deepEqual([...findNewGrades(report, seen)], ['70112'])
  // A grade that changed counts as new again.
  const changed = listGradeSignatures(report).map((signature) => (signature.startsWith('70101:') ? '70101:9' : signature))
  assert.deepEqual([...findNewGrades(report, changed)], ['70101'])
})

test('formatHour and htmlToPlainText', () => {
  assert.equal(formatHour(13.5), '13h30')
  assert.equal(formatHour(8.25), '8h15')
  assert.equal(
    htmlToPlainText('<p>Jurys le <b>28&nbsp;janvier</b>.<br>Merci&#8239;!</p><script>alert(1)</script>'),
    'Jurys le 28 janvier.\nMerci !',
  )
})
