export function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook Endpoints</h2>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-sm text-gray-900 mb-1">FireCrawl Ingestion</div>
            <code className="text-xs text-gray-600 block">POST /api/ingest/firecrawl</code>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-sm text-gray-900 mb-1">Supabase Ingestion</div>
            <code className="text-xs text-gray-600 block">POST /api/ingest/Supabase</code>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-sm text-gray-900 mb-1">GitHub Ingestion</div>
            <code className="text-xs text-gray-600 block">POST /api/ingest/GitHub</code>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database</span>
            <span className="font-medium text-gray-900">PostgreSQL (Supabase)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Backend</span>
            <span className="font-medium text-gray-900">Node.js + Fastify</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Frontend</span>
            <span className="font-medium text-gray-900">React + TypeScript</span>
          </div>
        </div>
      </div>
    </div>
  );
}
