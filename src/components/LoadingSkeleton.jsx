const LoadingSkeleton = ({ variant = 'card', count = 1, className = '' }) => {
  const getSkeletonClass = () => {
    const baseClass = 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 animate-pulse'
    
    switch (variant) {
      case 'card':
        return `${baseClass} rounded-2xl h-32 w-full`
      case 'chart':
        return `${baseClass} rounded-2xl h-64 w-full`
      case 'stat':
        return `${baseClass} rounded-xl h-24 w-full`
      case 'line':
        return `${baseClass} rounded-lg h-4 w-full mb-3`
      case 'circle':
        return `${baseClass} rounded-full h-12 w-12`
      default:
        return `${baseClass} rounded-lg h-6 w-full`
    }
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${getSkeletonClass()} ${i > 0 ? 'mt-3' : ''}`} />
      ))}
    </div>
  )
}

export default LoadingSkeleton
