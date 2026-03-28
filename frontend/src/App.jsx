import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ConfirmModal from './components/ui/ConfirmModal';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import AddEditClient from './pages/AddEditClient';
import EstimateList from './pages/EstimateList';
import EstimateEditor from './pages/EstimateEditor';
import InvoiceList from './pages/InvoiceList';
import InvoiceEditor from './pages/InvoiceEditor';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/add" element={<AddEditClient />} />
              <Route path="/clients/:id/edit" element={<AddEditClient />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/estimates" element={<EstimateList />} />
              <Route path="/estimates/new" element={<EstimateEditor type="estimate" />} />
              <Route path="/estimates/:id" element={<EstimateEditor type="estimate" />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/new" element={<InvoiceEditor type="invoice" />} />
              <Route path="/invoices/:id" element={<InvoiceEditor type="invoice" />} />
            </Routes>
          </main>
        </div>
      </div>

      <ConfirmModal />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
