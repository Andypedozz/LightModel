import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourcesApi } from '../../services/api';
import ResourceForm from '../../components/resources/ResourceForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ContentEdit() {
  const { resourceName, id } = useParams();
  const navigate = useNavigate();
  const [resourceDef, setResourceDef] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [resourceName, id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const def = await resourcesApi.getDefinition(resourceName.replace(/s$/, ''));
      setResourceDef(def);
      
      const content = await resourcesApi.getContent(resourceName, id);
      setInitialData(content);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await resourcesApi.updateContent(resourceName, id, formData);
      navigate(`/content/${resourceName}`);
    } catch (error) {
      setSaving(false);
      throw error;
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!resourceDef || !initialData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contenuto non trovato</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Modifica {resourceDef.name}
      </h1>

      <ResourceForm
        resourceName={resourceName}
        resourceDef={resourceDef}
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={saving}
      />
    </div>
  );
}