import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { resourcesApi } from '../../services/api';
import ResourceList from '../../components/resources/ResourceList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

export default function ContentList() {
  const { resourceName } = useParams();
  const [resourceDef, setResourceDef] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (resourceName) {
      loadData();
    }
  }, [resourceName]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carica definizione risorsa
      const def = await resourcesApi.getDefinition(resourceName.replace(/s$/, ''));
      setResourceDef(def);
      
      // Carica contenuti
      const content = await resourcesApi.getAllContent(resourceName);
      setItems(content);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setToast({
        show: true,
        type: 'error',
        message: 'Errore nel caricamento dei contenuti'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await resourcesApi.deleteContent(resourceName, id);
  };

  if (!resourceName) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Seleziona una risorsa dal menu</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (!resourceDef) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Risorsa non trovata</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {resourceDef.displayName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestisci i contenuti di {resourceDef.displayName}
          </p>
        </div>
        <Link
          to={`/content/${resourceName}/new`}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuovo {resourceDef.name}
        </Link>
      </div>

      <div className="card">
        <ResourceList
          resourceName={resourceName}
          resourceDef={resourceDef}
          items={items}
          onDelete={handleDelete}
          onRefresh={loadData}
        />
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