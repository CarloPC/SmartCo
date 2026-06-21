const exportService = {
  exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    this.downloadFile(csvContent, filename, 'text/csv')
  },

  exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2)
    this.downloadFile(jsonContent, filename, 'application/json')
  },

  exportToPDF(data, filename, title) {
    // Note: This requires jsPDF library. For now, we'll create a simple implementation
    const content = this.generatePDFContent(data, title)
    this.downloadFile(content, filename, 'text/html')
  },

  generatePDFContent(data, title) {
    const headers = Object.keys(data[0] || {})
    const rows = data.map(row => headers.map(h => row[h] || ''))
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #007bff; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    return html
  },

  downloadFile(content, filename, type) {
    const element = document.createElement('a')
    element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
}

export default exportService
