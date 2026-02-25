import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { resourcesApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await resourcesApi.getAllDefinitions();
      setResources(data);
    } catch (error) {
      console.error('Errore nel caricamento risorse:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Statistiche */}
        <div className="card">
          <div className="flex items-center">
            <div className="shrink-0 bg-primary-100 rounded-md p-3">
              <CubeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Risorse</h2>
              <p className="text-2xl font-semibold text-primary-600">{resources.length}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/resources" className="text-sm text-primary-600 hover:text-primary-700">
              Gestisci risorse →
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="shrink-0 bg-green-100 rounded-md p-3">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Contenuti totali</h2>
              <p className="text-2xl font-semibold text-green-600">-</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/content" className="text-sm text-green-600 hover:text-green-700">
              Vedi contenuti →
            </Link>
          </div>
        </div>
      </div>

      {/* Risorse recenti */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Le tue risorse</h2>
        <div className="mt-4 card">
          {resources.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <li key={resource.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{resource.displayName}</p>
                    <p className="text-sm text-gray-500">
                      {resource.fields?.length || 0} campi · 
                      {resource.pluralName}
                    </p>
                  </div>
                  <Link
                    to={`/content/${resource.pluralName}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Gestisci contenuti
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nessuna risorsa definita.{' '}
              <Link to="/resources/new" className="text-primary-600 hover:text-primary-700">
                Crea la tua prima risorsa
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}