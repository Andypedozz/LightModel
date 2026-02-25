import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourcesApi } from '../../services/api';
import ResourceForm from '../../components/resources/ResourceForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ContentCreate() {
  const { resourceName } = useParams();
  const navigate = useNavigate();
  const [resourceDef, setResourceDef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadResourceDef();
  }, [resourceName]);

  const loadResourceDef = async () => {
    try {
      const def = await resourcesApi.getDefinition(resourceName.replace(/s$/, ''));
      setResourceDef(def);
    } catch (error) {
      console.error('Errore nel caricamento definizione:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await resourcesApi.createContent(resourceName, formData);
      navigate(`/content/${resourceName}`);
    } catch (error) {
      setSaving(false);
      throw error;
    }
  };

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Nuovo {resourceDef.name}
      </h1>

      <ResourceForm
        resourceName={resourceName}
        resourceDef={resourceDef}
        onSubmit={handleSubmit}
        isLoading={saving}
      />
    </div>
  );
}