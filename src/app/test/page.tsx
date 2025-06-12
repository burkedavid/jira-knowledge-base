export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Next.js is Working!</h1>
        <p className="text-gray-600">This is a simple test page to verify routing works.</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  )
} 