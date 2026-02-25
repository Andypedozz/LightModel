import { useState } from 'react';
import { 
  BellIcon, 
  LockClosedIcon, 
  ServerIcon,
  GlobeAltIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';
import Toast from '../components/common/Toast';

const tabs = [
  { name: 'Generali', icon: GlobeAltIcon },
  { name: 'API', icon: ServerIcon },
  { name: 'Utenti', icon: UsersIcon },
  { name: 'Sicurezza', icon: LockClosedIcon },
  { name: 'Notifiche', icon: BellIcon },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Generali');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const handleSave = async () => {
    setSaving(true);
    // Simula salvataggio
    setTimeout(() => {
      setSaving(false);
      setToast({
        show: true,
        type: 'success',
        message: 'Impostazioni salvate con successo'
      });
    }, 1000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Generali':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome del sito
              </label>
              <input
                type="text"
                defaultValue="Il mio CMS"
                className="mt-1 input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                URL del sito
              </label>
              <input
                type="url"
                defaultValue="https://miosito.it"
                className="mt-1 input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                rows={3}
                className="mt-1 input-field"
                defaultValue="Il mio CMS headless"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lingua predefinita
              </label>
              <select className="mt-1 input-field">
                <option value="it">Italiano</option>
                <option value="en">Inglese</option>
                <option value="fr">Francese</option>
                <option value="de">Tedesco</option>
              </select>
            </div>
          </div>
        );

      case 'API':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value="sk_live_1234567890abcdef"
                  readOnly
                  className="flex-1 input-field bg-gray-50 font-mono"
                />
                <button className="ml-3 btn-secondary">
                  Rigenera
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Endpoint API
              </label>
              <input
                type="text"
                value="https://api.miosito.it/v1"
                readOnly
                className="mt-1 input-field bg-gray-50 font-mono"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Abilita CORS
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Domini autorizzati (CORS)
              </label>
              <textarea
                rows={3}
                className="mt-1 input-field font-mono text-sm"
                defaultValue="https://miosito.it&#10;https://admin.miosito.it"
                placeholder="Uno per riga"
              />
            </div>
          </div>
        );

      case 'Utenti':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Utenti attivi</h3>
              <button className="btn-primary text-sm">Nuovo utente</button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ruolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Admin
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      admin@esempio.it
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Amministratore
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Attivo
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Sicurezza':
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Richiedi 2FA per tutti gli utenti
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Rate limiting attivo
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Limita le richieste API a 100 per minuto per IP
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sessione timeout (minuti)
              </label>
              <input
                type="number"
                defaultValue={120}
                className="mt-1 input-field w-32"
              />
            </div>
          </div>
        );

      case 'Notifiche':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email per notifiche
              </label>
              <input
                type="email"
                defaultValue="admin@esempio.it"
                className="mt-1 input-field"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Notifica alla creazione di nuovi contenuti
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Notifica all'approvazione di contenuti
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Report settimanale via email
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Impostazioni</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`
                  group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm
                  ${activeTab === tab.name
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.name
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}

          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Salva impostazioni'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}