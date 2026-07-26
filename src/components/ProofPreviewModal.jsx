
import { X, ExternalLink } from 'lucide-react'

// Full-screen preview for a Role Upgrade Request's supporting document.
// Renders images directly; PDFs are shown in an <iframe> so admins/residents
// can review them without leaving the page. Always offers an "open in new
// tab" fallback in case inline preview is blocked (e.g. some mobile PDF
// viewers).
const ProofPreviewModal = ({ url, fileName, isDarkMode, onClose }) => {
  if (!url) return null

  const isPdf = (fileName || url).toLowerCase().includes('.pdf')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <p className={`text-sm font-medium truncate pr-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {fileName || 'Submitted document'}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-lg transition ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`flex-1 flex items-center justify-center overflow-auto ${
          isDarkMode ? 'bg-black/40' : 'bg-gray-50'
        }`}>
          {isPdf ? (
            <iframe src={url} title={fileName || 'Document preview'} className="w-full h-[75vh]" />
          ) : (
            <img
              src={url}
              alt={fileName || 'Submitted document'}
              className="max-w-full max-h-[75vh] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ProofPreviewModal
