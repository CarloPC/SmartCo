import * as XLSX from 'xlsx'

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
  const rows = json.map((row) => {
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
      name: get('name'),
      purok: get('purok'),
      assistanceType: get('assistanceType'),
      remarks: get('remarks'),
    }
  }).filter(r => {
    const keep = !!r.name
    if (!keep) skipped++
    return keep
  })

  return { rows, skipped }
}