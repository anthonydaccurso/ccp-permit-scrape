import { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

export function SettingsTab() {
  const adminToken = 'secure-admin-token-12345';
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Token
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Key className="w-4 h-4 text-gray-400" />
              <code className={`flex-1 text-sm font-mono text-gray-900 ${!showToken ? 'blur-sm select-none' : ''}`}>
                {adminToken}
              </code>
              <button
                onClick={() => setShowToken(!showToken)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4 text-gray-600" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Use this token in the <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">x-admin-token</code> header
              when calling ingestion webhooks.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Webhook Endpoints</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm text-gray-900 mb-1">FireCrawl Ingestion</div>
                <code className="text-xs text-gray-600 block">POST /api/ingest/firecrawl</code>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm text-gray-900 mb-1">n8n Ingestion</div>
                <code className="text-xs text-gray-600 block">POST /api/ingest/n8n</code>
              </div>
            </div>
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
