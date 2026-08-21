
import { Routes, Route } from 'react-router-dom';
import Dashboard from './app/pages/Dashboard';
import BriefingApp from './interno/pages/Briefing';
import Login from './app/pages/Login';
import ProtectedRoute from './shared/components/ProtectedRoute';

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
