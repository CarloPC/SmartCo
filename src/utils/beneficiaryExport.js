import * as XLSX from 'xlsx'
import { BENEFICIARY_STATUS_LABELS } from '../services/foodAidService'

const EXPORT_COLUMNS = [
  { key: 'name',                label: 'Resident Name' },
  { key: 'purok',                label: 'Purok' },
  { key: 'assistanceTypeLabel', label: 'Assistance Type' },
  { key: 'statusLabel',          label: 'Status' },
  { key: 'dateReceived',        label: 'Date Received' },
  { key: 'remarks',              label: 'Remarks' },
]

function normalizeRows(beneficiaries) {
  return (beneficiaries || []).map(b => ({
    name: b.name || '',
    purok: b.purok || '',
    assistanceTypeLabel: (b.assistanceType === 'Others' && b.assistanceTypeOther) ? b.assistanceTypeOther : (b.assistanceType || 'Food Assistance'),
    statusLabel: BENEFICIARY_STATUS_LABELS[b.status] || b.status || '',
    dateReceived: b.dateReceived || '',
    remarks: b.remarks || '',
  }))
}

function escapeCSV(val) {
  const s = String(val ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// beneficiaries: flat array of beneficiary objects (already merged/filtered
// by the caller for "all", "per schedule", or "per purok" scope).
export function exportBeneficiariesToCSV(beneficiaries, filename = 'beneficiaries.csv') {
  const rows = normalizeRows(beneficiaries)
  const header = EXPORT_COLUMNS.map(c => c.label).join(',')
  const lines = rows.map(r => EXPORT_COLUMNS.map(c => escapeCSV(r[c.key])).join(','))
  // Leading BOM so Excel opens UTF-8 correctly (Filipino names with ñ etc.)
  downloadBlob('\uFEFF' + [header, ...lines].join('\n'), filename, 'text/csv;charset=utf-8;')
}

export function exportBeneficiariesToExcel(beneficiaries, filename = 'beneficiaries.xlsx') {
  const rows = normalizeRows(beneficiaries)
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS.map(c => c.key), skipHeader: true })
  XLSX.utils.sheet_add_aoa(worksheet, [EXPORT_COLUMNS.map(c => c.label)], { origin: 'A1' })
  worksheet['!cols'] = EXPORT_COLUMNS.map(() => ({ wch: 22 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiaries')
  XLSX.writeFile(workbook, filename)
}