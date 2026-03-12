import React, { useState, useEffect, useRef } from 'react';

// Componente Modal separato per evitare re-render che causano perdita di focus
const Modal = ({ isOpen, onClose, title, children, darkMode }) => {
  const modalRef = useRef(null);
  
  // Gestisce il focus quando la modale si apre
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, textarea, select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen]);

  // Gestisce la chiusura con tasto ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const modalBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className={`${modalBg} rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 ${modalBg} border-b ${borderColor} px-6 py-4 flex justify-between items-center`}>
          <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
          <button onClick={onClose} className={`${textMuted} hover:${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xl`}>
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const CMSHeadless = () => {
  // Stati principali
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [entities, setEntities] = useState([]);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [records, setRecords] = useState({});
  const [fields, setFields] = useState({});
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [media, setMedia] = useState([]);
  const [apiTokens, setApiTokens] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  
  const [activeTab, setActiveTab] = useState('entities');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // Stati per la creazione entità con campi dinamici
  const [entityFields, setEntityFields] = useState([]);
  const [newEntityData, setNewEntityData] = useState({
    name: '',
    slug: '',
    tableName: ''
  });

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Simulazione dati iniziali (in produzione verrebbero da API)
  useEffect(() => {
    const sampleEntities = [];
    setEntities(sampleEntities);

    const sampleFields = {};
    setFields(sampleFields);

    const sampleRecords = {};
    setRecords(sampleRecords);

    setUsers([
      { id: 1, email: 'admin@example.com', name: 'Admin User', roleId: 1, createdAt: '2024-01-01' },
      { id: 2, email: 'editor@example.com', name: 'Editor User', roleId: 2, createdAt: '2024-01-01' },
    ]);

    setRoles([
      { id: 1, name: 'Admin', description: 'Accesso completo' },
      { id: 2, name: 'Editor', description: 'Può modificare contenuti' },
      { id: 3, name: 'Viewer', description: 'Sola lettura' },
    ]);

    setMedia([
      { id: 1, filename: 'hero.jpg', mimeType: 'image/jpeg', size: 2048576, altText: 'Hero image', createdAt: '2024-01-15' },
      { id: 2, filename: 'document.pdf', mimeType: 'application/pdf', size: 1048576, createdAt: '2024-01-16' },
    ]);

    setApiTokens([
      { id: 1, name: 'Frontend App', tokenHash: 'sk_live_xxx', createdAt: '2024-01-01', expiresAt: '2025-01-01' },
    ]);

    setWebhooks([
      { id: 1, event: 'record.create', url: 'https://api.example.com/webhook', secret: 'whsec_xxx' },
    ]);

    setActivityLog([
      { id: 1, userId: 1, action: 'CREATE', entityId: 1, recordId: 1, createdAt: '2024-01-15T10:30:00' },
      { id: 2, userId: 1, action: 'UPDATE', entityId: 1, recordId: 2, createdAt: '2024-01-16T14:20:00' },
    ]);
  }, []);

  // Reset stati quando si chiude la modale
  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
    setSelectedEntity(null);
    setEntityFields([]);
    setNewEntityData({ name: '', slug: '', tableName: '' });
  };

  // Funzioni CRUD
  const handleCreateEntity = () => {
    setModalType('entity');
    setEditingItem(null);
    setNewEntityData({ name: '', slug: '', tableName: '' });
    setEntityFields([]);
    setShowModal(true);
  };

  const handleAddField = () => {
    setEntityFields([
      ...entityFields,
      {
        id: Date.now(),
        name: '',
        slug: '',
        type: 'text',
        required: false,
        unique: false
      }
    ]);
  };

  const handleRemoveField = (fieldId) => {
    setEntityFields(entityFields.filter(f => f.id !== fieldId));
  };

  const handleFieldChange = (fieldId, key, value) => {
    setEntityFields(entityFields.map(f => 
      f.id === fieldId ? { ...f, [key]: value } : f
    ));
  };

  const handleSaveEntity = () => {
    if (!newEntityData.name || !newEntityData.slug) return;

    const newEntity = {
      id: entities.length + 1,
      ...newEntityData,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setEntities([...entities, newEntity]);

    const newFields = {};
    newFields[newEntity.id] = entityFields.map((f, index) => ({
      id: Date.now() + index,
      entityId: newEntity.id,
      name: f.name,
      slug: f.slug || f.name.toLowerCase().replace(/\s+/g, '_'),
      type: f.type,
      required: f.required,
      uniqueField: f.unique,
      position: index + 1
    }));

    setFields({ ...fields, ...newFields });
    setRecords({ ...records, [newEntity.id]: [] });
    handleCloseModal();
  };

  const handleCreateRecord = (entity) => {
    setSelectedEntity(entity);
    setModalType('record');
    setEditingItem(null);
    
    const defaultData = {};
    if (fields[entity.id]) {
      fields[entity.id].forEach(field => {
        if (field.defaultValue) {
          defaultData[field.slug] = field.type === 'boolean' ? field.defaultValue === 'true' : field.defaultValue;
        }
      });
    }
    setFormData(defaultData);
    setShowModal(true);
  };

  const handleEditRecord = (entity, record) => {
    setSelectedEntity(entity);
    setModalType('record');
    setEditingItem(record);
    setFormData(record.dataJson);
    setShowModal(true);
  };

  const handleSaveRecord = () => {
    if (!selectedEntity) return;

    if (editingItem) {
      const updatedRecords = { ...records };
      updatedRecords[selectedEntity.id] = updatedRecords[selectedEntity.id].map(r => 
        r.id === editingItem.id 
          ? { ...r, dataJson: formData, updatedAt: new Date().toISOString().split('T')[0] }
          : r
      );
      setRecords(updatedRecords);
    } else {
      const newRecord = {
        id: Math.max(...(records[selectedEntity.id]?.map(r => r.id) || [0])) + 1,
        entityId: selectedEntity.id,
        dataJson: formData,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'draft',
      };
      
      setRecords({
        ...records,
        [selectedEntity.id]: [...(records[selectedEntity.id] || []), newRecord],
      });
    }
    
    handleCloseModal();
  };

  const handleDeleteRecord = (entityId, recordId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo record?')) {
      const updatedRecords = { ...records };
      updatedRecords[entityId] = updatedRecords[entityId].filter(r => r.id !== recordId);
      setRecords(updatedRecords);
    }
  };

  // Render campo form in base al tipo
  const renderFormField = (field) => {
    const value = formData[field.slug] || '';
    const inputClass = darkMode 
      ? 'w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
      : 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
            required={field.required}
          />
        );
      
      case 'textarea':
      case 'richtext':
        return (
          <textarea
            rows="4"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
            required={field.required}
          />
        );
      
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.checked })}
              className="rounded text-blue-500"
            />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sì</span>
          </label>
        );
      
      case 'media':
        return (
          <div className={`border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg p-4 text-center`}>
            <button type="button" className={`${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} px-4 py-2 rounded-lg text-sm`}>
              Seleziona Media
            </button>
            {value && <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>File selezionato: {value}</p>}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.slug]: e.target.value })}
            className={inputClass}
          />
        );
    }
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'entities', label: 'Entità', icon: '📊', count: entities.length },
    { id: 'content', label: 'Contenuti', icon: '📄' },
    { id: 'media', label: 'Media', icon: '🖼️', count: media.length },
    { id: 'users', label: 'Utenti & Ruoli', icon: '👥' },
    { id: 'api', label: 'API & Webhooks', icon: '🔌' },
    { id: 'activity', label: 'Attività', icon: '📋' },
    { id: 'settings', label: 'Impostazioni', icon: '⚙️' },
  ];

  // Badge component with dark mode support
  const Badge = ({ type, value }) => {
    const colors = {
      status: {
        published: darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
        draft: darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
        archived: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800',
      },
      role: {
        Admin: darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800',
        Editor: darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
        Viewer: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800',
      },
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[type]?.[value] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
        {value}
      </span>
    );
  };

  // Theme classes
  const bgMain = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const bgSidebar = darkMode ? 'bg-gray-800' : 'bg-white';
  const bgContent = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className={`h-screen ${bgMain} ${textPrimary} flex overflow-hidden`}>
      {/* Sidebar - fissa */}
      <aside 
        className={`${bgSidebar} ${borderColor} transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} border-r flex flex-col h-screen sticky top-0`}
        style={{ height: '100vh' }}
      >
        {/* Logo area */}
        <div className={`p-4 border-b ${borderColor} flex items-center justify-between shrink-0`}>
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📝</span>
              <span className="font-bold text-lg">LightModel</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <span className="text-2xl">📝</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1 rounded ${hoverBg} shrink-0`}
          >
            <span className="text-xl">{sidebarCollapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Navigation - scrollabile se necessario */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 transition-colors ${
                activeTab === item.id
                  ? darkMode 
                    ? 'bg-blue-900 text-blue-300 border-l-4 border-blue-500'
                    : 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                  : `${textSecondary} ${hoverBg}`
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} px-2 py-0.5 rounded-full text-xs`}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User section - fissa in basso */}
        <div className={`p-4 border-t ${borderColor} shrink-0`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
              A
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Admin User</p>
                  <p className={`text-xs ${textSecondary} truncate`}>admin@example.com</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded ${hoverBg} shrink-0`}
                >
                  <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area - scrollabile */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header fisso */}
        <header className={`${bgSidebar} ${borderColor} border-b sticky top-0 z-30 shrink-0`}>
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-semibold ${textPrimary}`}>
                {navItems.find(item => item.id === activeTab)?.label}
              </h2>
              {activeTab !== 'settings' && activeTab !== 'activity' && (
                <button
                  onClick={() => {
                    if (activeTab === 'entities') handleCreateEntity();
                    else if (activeTab === 'content' && entities.length > 0) {
                      handleCreateRecord(entities[0]);
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center space-x-2 shrink-0"
                >
                  <span>+</span>
                  <span>Nuovo</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - scrollabile */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Entities Tab */}
          {activeTab === 'entities' && (
            <div>
              <div className="grid gap-4">
                {entities.map(entity => (
                  <div key={entity.id} className={`${bgContent} border ${borderColor} rounded-lg p-4`}>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className={`font-semibold text-lg ${textPrimary}`}>{entity.name}</h3>
                        <p className={`text-sm ${textSecondary}`}>Slug: {entity.slug}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Modifica
                        </button>
                        <button className="text-red-600 hover:text-red-800 text-sm">
                          Elimina
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className={`text-sm font-medium ${textSecondary} mb-2`}>Campi:</h4>
                      <div className="flex flex-wrap gap-2">
                        {fields[entity.id]?.map(field => (
                          <span
                            key={field.id}
                            className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded text-xs`}
                          >
                            {field.name} ({field.type})
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`border-t ${borderColor} pt-4 mt-4`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className={`text-sm font-medium ${textSecondary}`}>
                          Records ({records[entity.id]?.length || 0})
                        </h4>
                        <button
                          onClick={() => handleCreateRecord(entity)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <span>+ Nuovo record</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {records[entity.id]?.map(record => (
                          <div
                            key={record.id}
                            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg flex justify-between items-center`}
                          >
                            <div>
                              <p className={`font-medium ${textPrimary}`}>
                                {Object.values(record.dataJson)[0] || `Record #${record.id}`}
                              </p>
                              <p className={`text-xs ${textSecondary}`}>
                                Creato: {record.createdAt}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditRecord(entity, record)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Modifica
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(entity.id, record.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {entities.map(entity => (
                <div key={entity.id} className={`${bgContent} border ${borderColor} rounded-lg p-4`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-semibold text-lg ${textPrimary}`}>{entity.name}</h3>
                    <button
                      onClick={() => handleCreateRecord(entity)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y ${borderColor}">
                      <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${textSecondary} uppercase`}>ID</th>
                          {fields[entity.id]?.slice(0, 3).map(field => (
                            <th key={field.id} className={`px-4 py-2 text-left text-xs font-medium ${textSecondary} uppercase`}>
                              {field.name}
                            </th>
                          ))}
                          <th className={`px-4 py-2 text-left text-xs font-medium ${textSecondary} uppercase`}>Stato</th>
                          <th className={`px-4 py-2 text-right text-xs font-medium ${textSecondary} uppercase`}>Azioni</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${borderColor}`}>
                        {records[entity.id]?.map(record => (
                          <tr key={record.id}>
                            <td className={`px-4 py-2 text-sm ${textPrimary}`}>{record.id}</td>
                            {fields[entity.id]?.slice(0, 3).map(field => (
                              <td key={field.id} className={`px-4 py-2 text-sm ${textPrimary}`}>
                                {String(record.dataJson[field.slug] || '-').substring(0, 30)}
                                {record.dataJson[field.slug]?.length > 30 && '...'}
                              </td>
                            ))}
                            <td className="px-4 py-2">
                              <Badge type="status" value={record.status || 'draft'} />
                            </td>
                            <td className="px-4 py-2 text-right space-x-2">
                              <button
                                onClick={() => handleEditRecord(entity, record)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Modifica
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(entity.id, record.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Elimina
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map(item => (
                <div key={item.id} className={`${bgContent} border ${borderColor} rounded-lg p-4`}>
                  <div className={`aspect-video ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg mb-3 flex items-center justify-center`}>
                    {item.mimeType.startsWith('image/') ? (
                      <span className="text-4xl">🖼️</span>
                    ) : (
                      <span className="text-4xl">📄</span>
                    )}
                  </div>
                  <p className={`font-medium truncate ${textPrimary}`}>{item.filename}</p>
                  <p className={`text-xs ${textSecondary}`}>
                    {(item.size / 1024 / 1024).toFixed(2)} MB • {item.mimeType}
                  </p>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Dettagli
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users & Roles Tab */}
          {activeTab === 'users' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Users List */}
              <div>
                <h3 className={`font-semibold mb-4 ${textPrimary}`}>Utenti</h3>
                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user.id} className={`${bgContent} border ${borderColor} rounded-lg p-4`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${textPrimary}`}>{user.name}</p>
                          <p className={`text-sm ${textSecondary}`}>{user.email}</p>
                        </div>
                        <Badge type="role" value={roles.find(r => r.id === user.roleId)?.name || 'Unknown'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roles List */}
              <div>
                <h3 className={`font-semibold mb-4 ${textPrimary}`}>Ruoli</h3>
                <div className="space-y-3">
                  {roles.map(role => (
                    <div key={role.id} className={`${bgContent} border ${borderColor} rounded-lg p-4`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium ${textPrimary}`}>{role.name}</p>
                          <p className={`text-sm ${textSecondary}`}>{role.description}</p>
                        </div>
                        <div className={`text-sm ${textSecondary}`}>
                          {users.filter(u => u.roleId === role.id).length} utenti
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API & Webhooks Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* API Tokens */}
              <div>
                <h3 className={`font-semibold mb-4 ${textPrimary}`}>API Tokens</h3>
                {apiTokens.map(token => (
                  <div key={token.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg mb-2`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`font-medium ${textPrimary}`}>{token.name}</p>
                        <code className={`text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white'} px-2 py-1 rounded border ${borderColor}`}>
                          {token.tokenHash.substring(0, 20)}...
                        </code>
                      </div>
                      <div className={`text-sm ${textSecondary}`}>
                        Scade: {token.expiresAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Webhooks */}
              <div>
                <h3 className={`font-semibold mb-4 ${textPrimary}`}>Webhooks</h3>
                {webhooks.map(webhook => (
                  <div key={webhook.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg mb-2`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`font-medium ${textPrimary}`}>Event: {webhook.event}</p>
                        <p className={`text-sm ${textSecondary}`}>{webhook.url}</p>
                      </div>
                      <span className={`${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'} px-2 py-1 rounded text-xs`}>
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activityLog.map(log => (
                <div key={log.id} className={`border-l-4 border-blue-500 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4`}>
                  <div className="flex justify-between">
                    <div>
                      <p className={`font-medium ${textPrimary}`}>
                        {log.action} - {entities.find(e => e.id === log.entityId)?.name} #{log.recordId}
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Utente: {users.find(u => u.id === log.userId)?.name}
                      </p>
                    </div>
                    <p className={`text-xs ${textSecondary}`}>
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className={`border-b ${borderColor} pb-6`}>
                <h3 className={`font-medium mb-4 ${textPrimary}`}>Impostazioni Generali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      Nome Sito
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border ${borderColor} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'} rounded-lg`}
                      defaultValue="Il mio CMS"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      URL Base
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border ${borderColor} ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'} rounded-lg`}
                      defaultValue="https://api.example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`font-medium mb-4 ${textPrimary}`}>Preferenze</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded text-blue-500" defaultChecked />
                    <span className={`text-sm ${textSecondary}`}>Notifiche email per nuove attività</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded text-blue-500" />
                    <span className={`text-sm ${textSecondary}`}>Backup automatici giornalieri</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded text-blue-500" defaultChecked />
                    <span className={`text-sm ${textSecondary}`}>Registrazione log dettagliati</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={
          modalType === 'entity' 
            ? (editingItem ? 'Modifica Entità' : 'Nuova Entità')
            : (editingItem ? 'Modifica Record' : 'Nuovo Record')
        }
        darkMode={darkMode}
      >
        {modalType === 'entity' ? (
          <div className="space-y-6">
            {/* Dati base entità */}
            <div className="space-y-4">
              <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Informazioni Base</h4>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
                  Nome Entità
                </label>
                <input
                  type="text"
                  value={newEntityData.name}
                  onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                  className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="es. Articoli"
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
                  Slug
                </label>
                <input
                  type="text"
                  value={newEntityData.slug}
                  onChange={(e) => setNewEntityData({ ...newEntityData, slug: e.target.value })}
                  className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="es. articles"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
                  Nome Tabella
                </label>
                <input
                  type="text"
                  value={newEntityData.tableName}
                  onChange={(e) => setNewEntityData({ ...newEntityData, tableName: e.target.value })}
                  className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="es. articles"
                />
              </div>
            </div>

            {/* Gestione campi */}
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Campi dell'Entità</h4>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>Aggiungi Campo</span>
                </button>
              </div>

              <div className="space-y-3">
                {entityFields.map((field, index) => (
                  <div key={field.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Campo {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Rimuovi
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nome campo"
                        value={field.name}
                        onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                        className={`px-2 py-1 text-sm border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      <input
                        type="text"
                        placeholder="Slug"
                        value={field.slug}
                        onChange={(e) => handleFieldChange(field.id, 'slug', e.target.value)}
                        className={`px-2 py-1 text-sm border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                        className={`px-2 py-1 text-sm border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      >
                        <option value="text">Testo</option>
                        <option value="textarea">Area di testo</option>
                        <option value="richtext">Rich Text</option>
                        <option value="number">Numero</option>
                        <option value="boolean">Boolean</option>
                        <option value="media">Media</option>
                        <option value="date">Data</option>
                        <option value="email">Email</option>
                        <option value="url">URL</option>
                      </select>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                            className="rounded text-blue-500"
                          />
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Obbligatorio</span>
                        </label>
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={field.unique}
                            onChange={(e) => handleFieldChange(field.id, 'unique', e.target.checked)}
                            className="rounded text-blue-500"
                          />
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unico</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                {entityFields.length === 0 && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
                    Nessun campo aggiunto. Clicca "Aggiungi Campo" per iniziare.
                  </p>
                )}
              </div>
            </div>

            <div className={`flex justify-end space-x-3 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={handleCloseModal}
                className={`px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} rounded-lg text-sm`}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveEntity}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                Crea Entità
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedEntity && fields[selectedEntity.id]?.map(field => (
              <div key={field.id}>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderFormField(field)}
                {field.type === 'relation' && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    Relazione con entità: {field.configJson?.targetEntity}
                  </p>
                )}
              </div>
            ))}

            <div className={`flex justify-end space-x-3 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={handleCloseModal}
                className={`px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} rounded-lg text-sm`}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                {editingItem ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CMSHeadless;