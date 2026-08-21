
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BriefingApp from './pages/Briefing';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/briefing" element={<BriefingApp />} />
    </Routes>
  );
}

export default App;
