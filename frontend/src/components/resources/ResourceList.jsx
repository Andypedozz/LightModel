import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';

export default function ResourceList({ 
  resourceName, 
  resourceDef, 
  items, 
  onDelete,
  onRefresh 
}) {
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Estrai i campi da mostrare in tabella (escludi campi lunghi)
  const displayFields = resourceDef.fields
    ?.filter(f => !['richtext', 'text'].includes(f.type))
    .slice(0, 5) || [];

  const handleDelete = async (item) => {
    try {
      await onDelete(item.id);
      setToast({
        show: true,
        type: 'success',
        message: 'Elemento eliminato con successo'
      });
      onRefresh();
    } catch (error) {
      setToast({
        show: true,
        type: 'error',
        message: 'Errore durante l\'eliminazione'
      });
    }
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined) return '-';
    
    switch (field.type) {
      case 'boolean':
        return value ? '✓' : '✗';
      case 'date':
        return new Date(value).toLocaleDateString('it-IT');
      case 'datetime':
        return new Date(value).toLocaleString('it-IT');
      case 'relation':
        return value ? `ID: ${value}` : '-';
      default:
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 50) + '...';
        }
        return String(value);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayFields.map(field => (
                <th
                  key={field.name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {field.label || field.name}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {displayFields.map(field => (
                  <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(item[field.name], field)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`/content/${resourceName}/${item.id}`}
                      className="text-primary-600 hover:text-primary-900"
                      title="Modifica"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => setDeleteDialog({ isOpen: true, item })}
                      className="text-red-600 hover:text-red-900"
                      title="Elimina"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={displayFields.length + 1}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  Nessun contenuto trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={() => handleDelete(deleteDialog.item)}
        title="Elimina elemento"
        message="Sei sicuro di voler eliminare questo elemento? Questa operazione non può essere annullata."
      />

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
}