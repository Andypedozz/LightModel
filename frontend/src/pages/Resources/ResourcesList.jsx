import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { resourcesApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function ResourcesList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, resource: null });

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

  const handleDelete = async (resource) => {
    try {
      await resourcesApi.deleteDefinition(resource.name);
      await loadResources();
    } catch (error) {
      console.error('Errore durante eliminazione:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Risorse</h1>
        <Link to="/resources/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuova risorsa
        </Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <div key={resource.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{resource.displayName}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {resource.fields?.length || 0} campi · {resource.pluralName}
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/resources/${resource.name}/edit`}
                  className="text-gray-400 hover:text-primary-600"
                >
                  <PencilIcon className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => setDeleteDialog({ isOpen: true, resource })}
                  className="text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campi
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {resource.fields?.slice(0, 3).map((field) => (
                  <span
                    key={field.name}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {field.name}
                  </span>
                ))}
                {resource.fields?.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{resource.fields.length - 3} altri
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link
                to={`/content/${resource.pluralName}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Vedi contenuti →
              </Link>
            </div>
          </div>
        ))}

        {resources.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Nessuna risorsa definita.</p>
            <Link to="/resources/new" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
              Crea la tua prima risorsa
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, resource: null })}
        onConfirm={() => handleDelete(deleteDialog.resource)}
        title="Elimina risorsa"
        message={`Sei sicuro di voler eliminare la risorsa "${deleteDialog.resource?.displayName}"? Questa operazione eliminerà anche tutti i contenuti associati e non può essere annullata.`}
      />
    </div>
  );
}