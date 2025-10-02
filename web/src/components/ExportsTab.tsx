import { useState } from 'react';
import { Download } from 'lucide-react';
import { getExportUrl } from '../api';

export function ExportsTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minScore, setMinScore] = useState('');
  const [county, setCounty] = useState('');

  function handleExport(preset?: 'last7days' | 'last30days' | 'highScore') {
    let filters: any = {};

    if (preset === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filters.dateFrom = sevenDaysAgo.toISOString().split('T')[0];
    } else if (preset === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filters.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    } else if (preset === 'highScore') {
      filters.minScore = 7;
    } else {
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (minScore) filters.minScore = parseInt(minScore);
      if (county) filters.county = county;
    }

    const url = getExportUrl(filters);
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Download className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Exports</h2>
            <p className="text-sm text-gray-600">Download pre-configured reports</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('last7days')}
            className="flex items-center justify-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all group bg-white"
          >
            <Download className="w-5 h-5 text-gray-700" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Last 7 Days</div>
              <div className="text-sm text-gray-500">Recent leads</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('last30days')}
            className="flex items-center justify-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all group bg-white"
          >
            <Download className="w-5 h-5 text-gray-700" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Last 30 Days</div>
              <div className="text-sm text-gray-500">Monthly report</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('highScore')}
            className="flex items-center justify-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all group bg-white"
          >
            <Download className="w-5 h-5 text-gray-700" />
            <div className="text-left">
              <div className="font-medium text-gray-900">High Score Leads</div>
              <div className="text-sm text-gray-500">Score 7+</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Download className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Custom Export</h2>
            <p className="text-sm text-gray-600">Create a custom filtered export</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="0-10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g., Monmouth"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => handleExport()}
          className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Download className="w-4 h-4" />
          Export Custom CSV
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-medium text-gray-900 mb-2">CSV Format</h3>
        <p className="text-sm text-gray-700">
          Exports include: street, city, state, zip, county, town, score, status, issueDate, permitType,
          contractorName, lotAcres, estValue, source, and lastSeen.
        </p>
      </div>
    </div>
  );
}
