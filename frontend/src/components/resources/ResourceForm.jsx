import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Toast from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ResourceForm({
  resourceName,
  resourceDef,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [relationOptions, setRelationOptions] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Carica opzioni per i campi relazione
    const loadRelationOptions = async () => {
      const relationFields = resourceDef.fields?.filter(f => f.type === 'relation') || [];
      
      for (const field of relationFields) {
        try {
          // Qui dovrai chiamare la tua API per ottenere le opzioni
          // const response = await resourcesApi.getAllContent(field.target);
          // setRelationOptions(prev => ({ ...prev, [field.name]: response }));
        } catch (error) {
          console.error(`Errore nel caricamento opzioni per ${field.name}:`, error);
        }
      }
    };

    if (resourceDef?.fields) {
      loadRelationOptions();
    }
  }, [resourceDef]);

  const validateField = (field, value) => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label || field.name} è obbligatorio`;
    }
    
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Inserisci un indirizzo email valido';
    }
    
    if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
      return 'Inserisci un URL valido (inizia con http:// o https://)';
    }
    
    if (field.type === 'string' && field.minLength && value?.length < field.minLength) {
      return `${field.label || field.name} deve essere almeno ${field.minLength} caratteri`;
    }
    
    if (field.type === 'string' && field.maxLength && value?.length > field.maxLength) {
      return `${field.label || field.name} non può superare ${field.maxLength} caratteri`;
    }
    
    return null;
  };

  const handleChange = (fieldName, value, fieldType) => {
    let processedValue = value;
    
    // Gestisci tipi speciali
    if (fieldType === 'integer') {
      processedValue = value === '' ? null : parseInt(value, 10);
    } else if (fieldType === 'boolean') {
      processedValue = value;
    } else if (fieldType === 'relation') {
      processedValue = value === '' ? null : value;
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: processedValue
    }));
    
    // Rimuovi errore per questo campo
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valida tutti i campi
    const newErrors = {};
    resourceDef.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({
        show: true,
        type: 'error',
        message: 'Correggi gli errori nel form'
      });
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      setToast({
        show: true,
        type: 'error',
        message: error.message || 'Errore durante il salvataggio'
      });
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] !== undefined ? formData[field.name] : field.default;
    const error = errors[field.name];
    
    const baseInputClass = `mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
      error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
    }`;

    switch (field.type) {
      case 'richtext':
        return (
          <textarea
            rows={6}
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
            placeholder={field.placeholder || ''}
          />
        );

      case 'text':
        return (
          <textarea
            rows={3}
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
            placeholder={field.placeholder || ''}
          />
        );

      case 'boolean':
        return (
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleChange(field.name, e.target.checked, field.type)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{field.label || field.name}</span>
            </label>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
            placeholder="nome@esempio.it"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
            placeholder="https://..."
          />
        );

      case 'integer':
        return (
          <input
            type="number"
            value={value !== null && value !== undefined ? value : ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
            step="1"
          />
        );

      case 'uid':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={`${baseInputClass} font-mono text-sm`}
            placeholder="slug-auto-generato"
          />
        );

      case 'relation':
        const options = relationOptions[field.name] || [];
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
          >
            <option value="">Seleziona {field.target}</option>
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name || opt.title || `ID: ${opt.id}`}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
            className={baseInputClass}
            placeholder={field.placeholder || ''}
          />
        );
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel || (() => navigate(-1))}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel || (() => navigate(-1))}
            className="btn-secondary"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="space-y-6">
          {resourceDef.fields?.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700">
                {field.label || field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {field.description && (
                <p className="mt-1 text-sm text-gray-500">{field.description}</p>
              )}
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </form>
  );
}