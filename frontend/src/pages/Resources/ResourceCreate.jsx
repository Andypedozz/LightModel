import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import FieldEditor from '../../components/resources/FieldEditor';
import { resourcesApi } from '../../services/api';

export default function ResourceCreate() {
  const navigate = useNavigate();
  const [resource, setResource] = useState({
    name: '',
    pluralName: '',
    displayName: '',
    fields: [],
  });
  const [saving, setSaving] = useState(false);

  const addField = () => {
    setResource({
      ...resource,
      fields: [
        ...resource.fields,
        {
          name: '',
          type: 'string',
          required: false,
          unique: false,
        },
      ],
    });
  };

  const updateField = (index, updatedField) => {
    const newFields = [...resource.fields];
    newFields[index] = updatedField;
    setResource({ ...resource, fields: newFields });
  };

  const deleteField = (index) => {
    setResource({
      ...resource,
      fields: resource.fields.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await resourcesApi.createDefinition(resource);
      navigate('/resources');
    } catch (error) {
      console.error('Errore durante creazione risorsa:', error);
      alert('Errore durante la creazione della risorsa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/resources')}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Nuova risorsa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome (singolare) *
              </label>
              <input
                type="text"
                required
                value={resource.name}
                onChange={(e) => setResource({
                  ...resource,
                  name: e.target.value.toLowerCase(),
                  pluralName: `${e.target.value.toLowerCase()}s`,
                  displayName: e.target.value,
                })}
                className="mt-1 input-field"
                placeholder="es. articolo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome (plurale)
              </label>
              <input
                type="text"
                value={resource.pluralName}
                onChange={(e) => setResource({ ...resource, pluralName: e.target.value.toLowerCase() })}
                className="mt-1 input-field"
                placeholder="es. articoli"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome visualizzato
              </label>
              <input
                type="text"
                value={resource.displayName}
                onChange={(e) => setResource({ ...resource, displayName: e.target.value })}
                className="mt-1 input-field"
                placeholder="es. Articolo"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Campi della risorsa</h2>
            <button
              type="button"
              onClick={addField}
              className="btn-secondary flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Aggiungi campo
            </button>
          </div>

          {resource.fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">Nessun campo definito</p>
              <button
                type="button"
                onClick={addField}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Aggiungi il primo campo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {resource.fields.map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  onChange={(updated) => updateField(index, updated)}
                  onDelete={() => deleteField(index)}
                  isNew={!field.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/resources')}
            className="btn-secondary"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving || resource.fields.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creazione...' : 'Crea risorsa'}
          </button>
        </div>
      </form>
    </div>
  );
}