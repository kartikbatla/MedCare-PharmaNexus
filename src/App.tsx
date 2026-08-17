import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth, type Portal } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RetailerProvider, useRetailers } from './context/RetailerContext';
import { MigrationProvider } from './context/MigrationContext';
import { ControlTowerProvider } from './context/ControlTowerContext';
import { retailerCanOrder } from './data/retailers';
import AppShell from './components/layout/AppShell';
import RetailerLayout from './components/layout/RetailerLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Skeleton, SkeletonCard, SkeletonTable } from './components/ui/Skeleton';
import type { ReactNode } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DemandInventory = lazy(() => import('./pages/DemandInventory'));
const Replenishment = lazy(() => import('./pages/Replenishment'));
const ExpiryManagement = lazy(() => import('./pages/ExpiryManagement'));
const MaterialRequests = lazy(() => import('./pages/MaterialRequests'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const PaymentApproval = lazy(() => import('./pages/PaymentApproval'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ScenarioSimulator = lazy(() => import('./pages/ScenarioSimulator'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Help = lazy(() => import('./pages/Help'));
const Profile = lazy(() => import('./pages/Profile'));
const Retailers = lazy(() => import('./pages/Retailers'));
const RetailerOnboard = lazy(() => import('./pages/RetailerOnboard'));
const RetailerApplication = lazy(() => import('./pages/RetailerApplication'));
const MigrationPage = lazy(() => import('./pages/Migration'));
const Migrations = lazy(() => import('./pages/Migrations'));

const RetailerApplicationStatus = lazy(() => import('./pages/retailer/RetailerApplicationStatus'));

const RetailerDashboard = lazy(() => import('./pages/retailer/RetailerDashboard'));
const RetailerCatalog = lazy(() => import('./pages/retailer/RetailerCatalog'));
const RetailerProductDetail = lazy(() => import('./pages/retailer/RetailerProductDetail'));
const RetailerCart = lazy(() => import('./pages/retailer/RetailerCart'));
const RetailerCheckout = lazy(() => import('./pages/retailer/RetailerCheckout'));
const RetailerConfirmation = lazy(() => import('./pages/retailer/RetailerConfirmation'));
const RetailerOrders = lazy(() => import('./pages/retailer/RetailerOrders'));
const RetailerProfile = lazy(() => import('./pages/retailer/RetailerProfile'));
const RetailerNotifications = lazy(() => import('./pages/retailer/RetailerNotifications'));
const RetailerCategories = lazy(() => import('./pages/retailer/RetailerCategories'));
const RetailerQuickReorder = lazy(() => import('./pages/retailer/RetailerQuickReorder'));
const RetailerPayments = lazy(() => import('./pages/retailer/RetailerPayments'));
const RetailerAiAssistant = lazy(() => import('./pages/retailer/RetailerAiAssistant'));
const RetailerHelp = lazy(() => import('./pages/retailer/RetailerHelp'));

function PageLoader() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
      <SkeletonTable />
    </div>
  );
}

function RequireAuth({ portal, children }: { portal: Portal; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.portal !== portal) return <Navigate to={portal === 'retailer' ? '/retailer' : '/'} replace />;
  return <>{children}</>;
}

function RetailerGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { retailerById } = useRetailers();
  const r = user?.storeId ? retailerById(user.storeId) : undefined;
  if (!retailerCanOrder(r)) return <Navigate to="/retailer/application" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <RequireAuth portal="admin">
            <AppShell />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/demand-inventory"
          element={
            <Suspense fallback={<PageLoader />}>
              <DemandInventory />
            </Suspense>
          }
        />
        <Route path="/medicine-catalogue" element={<Navigate to="/demand-inventory" replace />} />
        <Route path="/medicine-catalogue/:id" element={<Navigate to="/demand-inventory" replace />} />
        <Route
          path="/replenishment"
          element={
            <Suspense fallback={<PageLoader />}>
              <Replenishment />
            </Suspense>
          }
        />
        <Route
          path="/expiry"
          element={
            <Suspense fallback={<PageLoader />}>
              <ExpiryManagement />
            </Suspense>
          }
        />
        <Route
          path="/material-requests"
          element={
            <Suspense fallback={<PageLoader />}>
              <MaterialRequests />
            </Suspense>
          }
        />
        <Route
          path="/suppliers"
          element={
            <Suspense fallback={<PageLoader />}>
              <Suppliers />
            </Suspense>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <Suspense fallback={<PageLoader />}>
              <PurchaseOrders />
            </Suspense>
          }
        />
        <Route
          path="/invoice-processing"
          element={<Navigate to="/purchase-orders" replace />}
        />
        <Route
          path="/matching"
          element={<Navigate to="/purchase-orders" replace />}
        />
        <Route
          path="/payments"
          element={
            <Suspense fallback={<PageLoader />}>
              <PaymentApproval />
            </Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<PageLoader />}>
              <Analytics />
            </Suspense>
          }
        />
        <Route
          path="/simulator"
          element={
            <Suspense fallback={<PageLoader />}>
              <ScenarioSimulator />
            </Suspense>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <Suspense fallback={<PageLoader />}>
              <AIAssistant />
            </Suspense>
          }
        />
        <Route
          path="/notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <Notifications />
            </Suspense>
          }
        />
        <Route
          path="/help"
          element={
            <Suspense fallback={<PageLoader />}>
              <Help />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/retailers"
          element={
            <Suspense fallback={<PageLoader />}>
              <Retailers />
            </Suspense>
          }
        />
        <Route
          path="/retailers/onboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerOnboard />
            </Suspense>
          }
        />
        <Route
          path="/retailers/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerApplication />
            </Suspense>
          }
        />
        <Route
          path="/retailers/:id/migration"
          element={
            <Suspense fallback={<PageLoader />}>
              <MigrationPage />
            </Suspense>
          }
        />
        <Route
          path="/migrations"
          element={
            <Suspense fallback={<PageLoader />}>
              <Migrations />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route
        path="/retailer"
        element={
          <RequireAuth portal="retailer">
            <RetailerGate>
              <RetailerLayout />
            </RetailerGate>
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerDashboard />
            </Suspense>
          }
        />
        <Route
          path="medicines"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerCatalog />
            </Suspense>
          }
        />
        <Route
          path="medicines/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerProductDetail />
            </Suspense>
          }
        />
        <Route
          path="categories"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerCategories />
            </Suspense>
          }
        />
        <Route
          path="quick-reorder"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerQuickReorder />
            </Suspense>
          }
        />
        <Route
          path="payments"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerPayments />
            </Suspense>
          }
        />
        <Route
          path="ai-assistant"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerAiAssistant />
            </Suspense>
          }
        />
        <Route
          path="cart"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerCart />
            </Suspense>
          }
        />
        <Route
          path="checkout"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerCheckout />
            </Suspense>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerOrders />
            </Suspense>
          }
        />
        <Route
          path="orders/confirm/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerConfirmation />
            </Suspense>
          }
        />
        <Route
          path="notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerNotifications />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerProfile />
            </Suspense>
          }
        />
        <Route
          path="help"
          element={
            <Suspense fallback={<PageLoader />}>
              <RetailerHelp />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/retailer" replace />} />
      </Route>

      <Route
        path="/retailer/application"
        element={
          <RequireAuth portal="retailer">
            <Suspense fallback={<PageLoader />}>
              <RetailerApplicationStatus />
            </Suspense>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RetailerProvider>
          <MigrationProvider>
            <CartProvider>
              <ControlTowerProvider>
                <HashRouter>
                  <AppRoutes />
                </HashRouter>
              </ControlTowerProvider>
            </CartProvider>
          </MigrationProvider>
        </RetailerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
