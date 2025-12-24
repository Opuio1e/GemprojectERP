import { Navigate, Route, Routes } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import MemoPage from './pages/MemoPage';
import CashbookPage from './pages/CashbookPage';

const App = () => {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/memos" replace />} />
        <Route path="/memos" element={<MemoPage />} />
        <Route path="/cashbook" element={<CashbookPage />} />
      </Routes>
    </PageLayout>
  );
};

export default App;
