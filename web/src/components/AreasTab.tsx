import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Area } from '../types';
import { fetchAreas, updateArea } from '../api';

export function AreasTab() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAreas();
  }, []);

  async function loadAreas() {
    setLoading(true);
    try {
      const data = await fetchAreas();
      setAreas(data);
    } catch (error) {
      console.error('Failed to load areas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await updateArea(id, { active: !currentActive });
      loadAreas();
    } catch (error) {
      console.error('Failed to update area:', error);
    }
  }

  const counties = areas.filter(a => a.level === 'county');
  const towns = areas.filter(a => a.level === 'town');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <MapPin className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Service Counties</h2>
            <p className="text-sm text-gray-600">Manage county coverage areas</p>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {counties.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-400 transition-all bg-white"
              >
                <div>
                  <span className="font-medium text-gray-900">{area.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({area.state})</span>
                </div>
                <button
                  onClick={() => toggleActive(area.id, area.active)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    area.active
                      ? 'bg-gray-900 text-white hover:bg-black'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {area.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <MapPin className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Service Towns</h2>
            <p className="text-sm text-gray-600">Manage town coverage areas</p>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {towns.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-400 transition-all bg-white"
              >
                <div>
                  <span className="font-medium text-gray-900">{area.name}</span>
                  {area.parentCounty && (
                    <span className="text-xs text-gray-500 block">{area.parentCounty} County</span>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(area.id, area.active)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    area.active
                      ? 'bg-gray-900 text-white hover:bg-black'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {area.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
