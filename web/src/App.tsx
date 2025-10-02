import { useState } from 'react';
import { FileText, MapPin, Globe, Download, Settings, Waves } from 'lucide-react';
import { LeadsTab } from './components/LeadsTab';
import { AreasTab } from './components/AreasTab';
import { SourcesTab } from './components/SourcesTab';
import { ExportsTab } from './components/ExportsTab';
import { SettingsTab } from './components/SettingsTab';

type Tab = 'leads' | 'areas' | 'sources' | 'exports' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('leads');

  const tabs = [
    { id: 'leads' as Tab, label: 'Permit Leads', icon: FileText },
    { id: 'areas' as Tab, label: 'Service Areas', icon: MapPin },
    { id: 'sources' as Tab, label: 'Data Sources', icon: Globe },
    { id: 'exports' as Tab, label: 'Export Data', icon: Download },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src="/custom-pool-pros-logo.webp"
                  alt="Custom Pool Pros"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="border-l-2 border-gray-300 pl-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Custom Pool Pros</h1>
                <p className="text-sm text-gray-600 font-medium">Permit Lookup & Lead Intelligence</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <Waves className="w-4 h-4 text-blue-600" />
                <span className="text-blue-900 font-medium">Pool Construction Intelligence</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 font-semibold text-sm whitespace-nowrap transition-all relative group ${
                    activeTab === tab.id
                      ? 'text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    activeTab === tab.id ? 'text-blue-600' : ''
                  }`} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'areas' && <AreasTab />}
        {activeTab === 'sources' && <SourcesTab />}
        {activeTab === 'exports' && <ExportsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

export default App;
