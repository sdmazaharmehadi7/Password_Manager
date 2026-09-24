import { useState } from 'react';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Manager from './components/Manager';
import VaultAuth from './components/VaultAuth';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';

function App() {
  const [secretKey, setSecretKey] = useState(() => {
    return localStorage.getItem('passop_secret_key') || '';
  });

  const handleVaultAccess = (key) => {
    localStorage.setItem('passop_secret_key', key);
    setSecretKey(key);
  };

  const handleExitVault = () => {
    localStorage.removeItem('passop_secret_key');
    setSecretKey('');
  };

  return (
    <div className='min-h-screen flex flex-col justify-between overflow-y-auto hide-scrollbar bg-white'>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div>
        <Navbar secretKey={secretKey} onExitVault={handleExitVault} />
        <main className={`min-h-[80vh] flex flex-col ${secretKey ? 'justify-start py-4' : 'justify-center'}`}>
          {secretKey ? (
            <Manager secretKey={secretKey} onExitVault={handleExitVault} />
          ) : (
            <VaultAuth onVaultAccess={handleVaultAccess} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
