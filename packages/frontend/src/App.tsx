import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import BuyerOrdersPage from './pages/BuyerOrdersPage';
import FarmerOrdersPage from './pages/FarmerOrdersPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route
          path="/cart"
          element={
            <ProtectedRoute roles={['buyer']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={['buyer']}>
              <BuyerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/orders"
          element={
            <ProtectedRoute roles={['farmer']}>
              <FarmerOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
