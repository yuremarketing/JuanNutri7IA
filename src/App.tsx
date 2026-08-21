
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BriefingApp from './pages/Briefing';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/briefing" 
        element={
          <ProtectedRoute>
            <BriefingApp />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
