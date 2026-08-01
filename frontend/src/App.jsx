import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 text-slate-800 font-sans antialiased selection:bg-green-300/50">
        <Routes>
          <Route path="/" element={<div className="flex h-screen items-center justify-center"><h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">Ikigai 2.0</h1></div>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
