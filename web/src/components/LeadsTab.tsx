import { useState, useEffect } from 'react';
import { Search, Download, MapPin, ListFilter as Filter, ArrowUpDown, FileText } from 'lucide-react';
import { Lead, Area, Source } from '../types';
import { fetchLeads, fetchAreas, fetchSources, getExportUrl } from '../api';

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'issueDate' | 'estValue' | 'lotAcres' | 'yearBuilt' | 'status'>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [county, setCounty] = useState('');
  const [town, setTown] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
    loadAreas();
    loadSources();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const filters: any = {};
      if (search) filters.search = search;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (county) filters.county = county;
      if (town) filters.town = town;
      if (source) filters.source = source;
      if (status) filters.status = status;

      const result = await fetchLeads(filters);
      setLeads(result.data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAreas() {
    try {
      const data = await fetchAreas();
      setAreas(data);
    } catch (error) {
      console.error('Failed to load areas:', error);
    }
  }

  async function loadSources() {
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  }

  function handleSearch() {
    loadData();
  }

  function handleExport() {
    const filters: any = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (county) filters.county = county;
    if (town) filters.town = town;
    if (source) filters.source = source;

    const url = getExportUrl(filters);
    window.open(url, '_blank');
  }

  async function runAll() {
    try {
      const res = await fetch('/api/gh-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': '__SET_IN_NETLIFY__',
        },
        body: JSON.stringify({}),
      });
      const j = await res.json().catch(() => ({}));
      console.log(j);
      alert(JSON.stringify(j, null, 2));
    } catch (error) {
      console.error('Failed to run full update:', error);
      alert('Failed to trigger update: ' + error);
    }
  }

  const counties = areas.filter(a => a.level === 'county' && a.active);
  const towns = areas.filter(a => a.level === 'town' && a.active && (!county || a.parentCounty === county));

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case 'issueDate':
        aVal = a.issueDate || '';
        bVal = b.issueDate || '';
        break;
      case 'estValue':
        aVal = a.estValue || 0;
        bVal = b.estValue || 0;
        break;
      case 'lotAcres':
        aVal = a.lotAcres || 0;
        bVal = b.lotAcres || 0;
        break;
      case 'yearBuilt':
        aVal = a.yearBuilt || 0;
        bVal = b.yearBuilt || 0;
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 sticky top-0 z-10">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search counties, towns, statuses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium border border-gray-300"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={runAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Run Database Update
          </button>

          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Search
          </button>

          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="issueDate">Issue Date</option>
                <option value="estValue">Estimated Value</option>
                <option value="lotAcres">Lot Size (Acres)</option>
                <option value="yearBuilt">Year Built</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Counties</option>
                {counties.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Towns</option>
                {towns.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="ISSUED">ISSUED</option>
                <option value="FINAL">FINAL</option>
                <option value="CO">CO</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-gray-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading permit leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">No leads found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Town</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">County</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Permit Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Builder</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lot Acres</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Est Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{lead.street}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lead.city}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.county || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'FINAL' ? 'bg-green-100 text-green-800' :
                        lead.status === 'CO' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.issueDate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.permitType || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.contractorName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.lotAcres?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lead.estValue ? `$${lead.estValue.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.rawAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
