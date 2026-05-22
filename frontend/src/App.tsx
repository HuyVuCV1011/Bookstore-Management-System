import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BooksPage } from './pages/BooksPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CartPage } from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { CategoryManagement } from './pages/admin/CategoryManagement';
import { AuthorManagement } from './pages/admin/AuthorManagement';
import { PublisherManagement } from './pages/admin/PublisherManagement';
import { BookManagement } from './pages/admin/BookManagement';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { StaffManagement } from './pages/admin/StaffManagement';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CatalogStatistics } from './pages/admin/CatalogStatistics';
import { PopularBooksAnalytics } from './pages/admin/PopularBooksAnalytics';
import { CdcMonitoring } from './pages/admin/CdcMonitoring';
import { ReviewManagement } from './pages/admin/ReviewManagement';
import { SessionManagementPage } from './pages/admin/SessionManagementPage';
import { InteractionEventsPage } from './pages/admin/InteractionEventsPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { InventoryPage } from './pages/staff/InventoryPage';
import { SupplierListPage } from './pages/staff/SupplierListPage';
import { TransactionHistoryPage } from './pages/staff/TransactionHistoryPage';
import { InventoryReorderDashboard } from './pages/staff/InventoryReorderDashboard';
import { PurchaseOrderManagementPage } from './pages/staff/PurchaseOrderManagementPage';
import { CustomerOrdersPage } from './pages/staff/CustomerOrdersPage';
import { PurchaseOrderFormPage } from './pages/staff/PurchaseOrderFormPage';
import { PurchaseOrderDetailPage } from './pages/staff/PurchaseOrderDetailPage';
import { ReceiveGoodsPage } from './pages/staff/ReceiveGoodsPage';
import { FastSearchPage } from './pages/FastSearchPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  // Clean up old localStorage session on first mount
  useEffect(() => {
    const oldSessionKey = 'bookstore_session_id';
    const oldSession = localStorage.getItem(oldSessionKey);
    if (oldSession) {
      localStorage.removeItem(oldSessionKey);
      console.log('[Migration] Removed old localStorage session ID');
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public browsing - accessible to guests */}
            <Route path="/" element={<BooksPage />} />
            <Route path="/books" element={<Navigate to="/" replace />} />
            <Route path="/books/:isbn" element={<BookDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/demo/fast-search" element={<FastSearchPage />} />

            {/* Protected – requires authentication */}
            <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

            {/* Protected – STAFF + ADMIN only */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected – ADMIN only */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <CategoryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/authors"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AuthorManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/publishers"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PublisherManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/books"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <BookManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <StaffManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <ReviewManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/catalog-statistics"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <CatalogStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/popular-books"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PopularBooksAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cdc-monitoring"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <CdcMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sessions"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <SessionManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/interaction-events"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <InteractionEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/inventory"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/suppliers"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <SupplierListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/transactions"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <TransactionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/analytics/inventory-reorder"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <InventoryReorderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/purchase-orders"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <PurchaseOrderManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/customer-orders"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <CustomerOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/purchase-orders/create"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <PurchaseOrderFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/purchase-orders/:id"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <PurchaseOrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/purchase-orders/:id/edit"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <PurchaseOrderFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/purchase-orders/:id/receive"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <ReceiveGoodsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
