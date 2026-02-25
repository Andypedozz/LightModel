import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ResourcesList from './pages/Resources/ResourcesList';
import ResourceCreate from './pages/Resources/ResourceCreate';
import ResourceEdit from './pages/Resources/ResourceEdit';
import ContentList from './pages/Content/ContentList';
import ContentCreate from './pages/Content/ContentCreate';
import ContentEdit from './pages/Content/ContentEdit';
import Settings from './pages/Settings';

export default function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Risorse (Model Builder) */}
        <Route path="/resources" element={<ResourcesList />} />
        <Route path="/resources/new" element={<ResourceCreate />} />
        <Route path="/resources/:name/edit" element={<ResourceEdit />} />
        
        {/* Contenuti (CRUD dinamico) */}
        <Route path="/content" element={<ContentList />} />
        <Route path="/content/:resourceName" element={<ContentList />} />
        <Route path="/content/:resourceName/new" element={<ContentCreate />} />
        <Route path="/content/:resourceName/:id" element={<ContentEdit />} />
        
        {/* Impostazioni */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}