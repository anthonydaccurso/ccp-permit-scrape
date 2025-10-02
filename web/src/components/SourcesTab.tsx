import { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { Source } from '../types';
import { fetchSources, updateSource } from '../api';

export function SourcesTab() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    setLoading(true);
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await updateSource(id, { active: !currentActive });
      loadSources();
    } catch (error) {
      console.error('Failed to update source:', error);
    }
  }

  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.type]) acc[source.type] = [];
    acc[source.type].push(source);
    return acc;
  }, {} as Record<string, Source[]>);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-gray-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading data sources...</p>
        </div>
      ) : (
        Object.entries(groupedSources).map(([type, typeSources]) => (
          <div key={type} className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Globe className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 capitalize">{type} Sources</h2>
                <p className="text-sm text-gray-600">{typeSources.length} configured source{typeSources.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="space-y-3">
              {typeSources.map((source) => (
                <div
                  key={source.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-400 transition-all gap-3 bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{source.name}</h3>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{source.url}</p>
                    {(source.county || source.town) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {source.town && `${source.town}, `}{source.county && `${source.county} County`}
                      </p>
                    )}
                    {source.lastRun && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-gray-500">
                          Last Run: {new Date(source.lastRun).toLocaleDateString()}
                        </span>
                        {source.lastStatus && (
                          <span className={`font-medium ${
                            source.lastStatus === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Status: {source.lastStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive(source.id, source.active)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      source.active
                        ? 'bg-gray-800 text-white hover:bg-gray-900'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {source.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
