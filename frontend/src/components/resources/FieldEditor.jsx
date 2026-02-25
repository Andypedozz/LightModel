import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const fieldTypes = [
  { value: 'string', label: 'Testo (breve)' },
  { value: 'text', label: 'Testo (lungo)' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'integer', label: 'Numero intero' },
  { value: 'boolean', label: 'Booleano (si/no)' },
  { value: 'date', label: 'Data' },
  { value: 'datetime', label: 'Data e ora' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'uid', label: 'UID (slug)' },
  { value: 'relation', label: 'Relazione' },
];

export default function FieldEditor({ field, onChange, onDelete, isNew }) {
  const [isOpen, setIsOpen] = useState(isNew);

  const handleChange = (key, value) => {
    onChange({ ...field, [key]: value });
  };

  if (!isOpen) {
    return (
      <div className="border rounded-lg p-4 mb-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
           onClick={() => setIsOpen(true)}>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium">{field.name || 'Nuovo campo'}</span>
            <span className="ml-2 text-sm text-gray-500">({field.type})</span>
            {field.required && (
              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Obbligatorio</span>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-red-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome campo</label>
          <input
            type="text"
            value={field.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="mt-1 input-field"
            placeholder="es. titolo, autore, etc."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            value={field.type || 'string'}
            onChange={(e) => handleChange('type', e.target.value)}
            className="mt-1 input-field"
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Label (opzionale)</label>
          <input
            type="text"
            value={field.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="mt-1 input-field"
            placeholder="Titolo, Autore..."
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => handleChange('required', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Obbligatorio</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.unique || false}
              onChange={(e) => handleChange('unique', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Unico</span>
          </label>
        </div>

        {/* Campi specifici per tipo */}
        {field.type === 'string' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lunghezza massima</label>
              <input
                type="number"
                value={field.maxLength || 255}
                onChange={(e) => handleChange('maxLength', parseInt(e.target.value))}
                className="mt-1 input-field"
              />
            </div>
          </>
        )}

        {field.type === 'uid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Genera da campo</label>
            <input
              type="text"
              value={field.targetField || ''}
              onChange={(e) => handleChange('targetField', e.target.value)}
              className="mt-1 input-field"
              placeholder="es. titolo"
            />
          </div>
        )}

        {field.type === 'relation' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Risorsa collegata</label>
            <input
              type="text"
              value={field.target || ''}
              onChange={(e) => handleChange('target', e.target.value)}
              className="mt-1 input-field"
              placeholder="es. users, articles"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="btn-secondary text-sm"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}