import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import Login from './pages/Login';
import { Register } from './pages/Register';
import { ClientDashboard } from './pages/ClientDashboard';
import { ParcelList } from './pages/ParcelList';
import { CreateParcel } from './pages/CreateParcel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/client/parcels" element={<ParcelList />} />
        <Route path="/client/parcels/create" element={<CreateParcel />} />
      </Routes>
    </Router>
  );
}

export default App;