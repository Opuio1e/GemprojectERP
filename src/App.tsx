import { Navigate, Route, Routes } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import InventoryPage from './pages/InventoryPage';
import InvoicePage from './pages/InvoicePage';
import MemoPage from './pages/MemoPage';
import ProductionPage from './pages/ProductionPage';
import CashbookPage from './pages/CashbookPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
const App = () => {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/memos" replace />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/memos" element={<MemoPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/cashbook" element={<CashbookPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </PageLayout>
  );
};

export default App;
