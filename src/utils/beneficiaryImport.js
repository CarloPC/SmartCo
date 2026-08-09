import * as XLSX from 'xlsx'
import { PUROKS_ILIHAN } from '../constants/puroks'

// Reads a beneficiary list from a CSV, XLSX, or XLS file and returns
// normalized rows. Uses the already-installed `xlsx` (SheetJS) library for
// BOTH formats — SheetJS parses CSV text natively, so no extra dependency
// (like papaparse) is needed just to also support CSV.
//
// Accepted headers (case/spacing-insensitive, aliases supported):
//   Name*, Purok, Assistance Type, Remarks
// Only "Name" is required — barangay staff sheets rarely match a template
// exactly, so header matching is forgiving.
export function readBeneficiaryFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(normalizeRows(json))
      } catch (err) {
        reject(new Error('Could not parse this file. Make sure it\'s a valid CSV or Excel file with a header row.'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

const HEADER_ALIASES = {
  name:           ['name', 'residentname', 'resident', 'fullname', 'beneficiaryname'],
  purok:          ['purok', 'area', 'zone'],
  assistanceType: ['assistancetype', 'type', 'assistance'],
  remarks:        ['remarks', 'notes', 'comment', 'comments'],
}

function normalizeHeaderKey(key) {
  return String(key).toLowerCase().replace(/[^a-z]/g, '')
}

function normalizeRows(json) {
  let skipped = 0
  const allRows = json.map((row, i) => {
    const normalized = {}
    Object.entries(row).forEach(([k, v]) => { normalized[normalizeHeaderKey(k)] = v })

    const get = (field) => {
      for (const alias of HEADER_ALIASES[field]) {
        if (normalized[alias] !== undefined && String(normalized[alias]).trim() !== '') {
          return String(normalized[alias]).trim()
        }
      }
      return ''
    }

    return {
      // Sheet row number as the admin would see it in Excel (header = row 1,
      // so the first data row is row 2) — used to build human-readable
      // "Row 12 — Missing Name" style error/warning reports.
      rowNumber: i + 2,
      name: get('name'),
      purok: get('purok'),
      assistanceType: get('assistanceType'),
      remarks: get('remarks'),
    }
  })

  const rows = allRows.filter(r => {
    const keep = !!r.name
    if (!keep) skipped++
    return keep
  })

  return { rows, skipped, allRows }
}

// Validates parsed rows before anything is written to Firestore (Step 10 —
// Import Preview). Classifies each row as:
//   - 'error'   → blocking, excluded from import (missing name, or a
//                 duplicate of an existing/already-listed beneficiary —
//                 imports never silently create duplicate beneficiaries)
//   - 'warning' → non-blocking, still imported, but flagged for review
//                 (a Purok/Zone that doesn't match Barangay Ilihan's
//                 official list — could be a typo, but isn't necessarily
//                 wrong, since the Purok field is free text on the record)
//   - 'valid'   → no issues
//
// `existingBeneficiaries`: the target distribution's current beneficiary
// list (for duplicate detection against records already in Firestore).
// Duplicate matching is by resident name only (case/space-insensitive) —
// the only field the existing beneficiary schema has that reliably
// identifies a person (there's no contact number or resident ID field).
export function validateBeneficiaryRows(allRows, { existingBeneficiaries = [] } = {}) {
  const normalizeName = (n) => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ')
  const existingNames = new Set((existingBeneficiaries || []).map(b => normalizeName(b.name)))
  const seenInFile = new Set()

  const validated = allRows.map((row) => {
    const issues = []
    const name = normalizeName(row.name)

    if (!row.name) {
      issues.push({ severity: 'error', code: 'missingName', message: 'Missing Name' })
    } else if (existingNames.has(name) || seenInFile.has(name)) {
      issues.push({ severity: 'error', code: 'duplicate', message: 'Duplicate — already exists' })
    }

    if (row.purok && !PUROKS_ILIHAN.includes(row.purok)) {
      issues.push({ severity: 'warning', code: 'invalidPurok', message: 'Unrecognized Purok/Zone' })
    }

    if (row.name) seenInFile.add(name)

    const severity = issues.some(i => i.severity === 'error')
      ? 'error'
      : issues.some(i => i.severity === 'warning')
        ? 'warning'
        : 'valid'

    return { ...row, issues, severity }
  })

  const counts = {
    total: validated.length,
    valid: validated.filter(r => r.severity === 'valid').length,
    warning: validated.filter(r => r.severity === 'warning').length,
    error: validated.filter(r => r.severity === 'error').length,
  }

  // Rows that are safe to actually write to Firestore — errors excluded.
  const importable = validated.filter(r => r.severity !== 'error')

  return { validated, counts, importable }
}