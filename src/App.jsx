import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Contact from './pages/Contact';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminPetUpload from './pages/AdminPetUpload';
import AdminUsers from './pages/AdminUsers';
import PartnershipManagement from './pages/PartnershipManagement';
import PetDashboard from './pages/PetDashboard';
import ShelterDashboard from './pages/ShelterDashboard';
import ShelterDetail from './pages/ShelterDetail';
import ShelterDirectory from './pages/ShelterDirectory';
import ShelterPortal from './pages/ShelterPortal';
import ShelterSyncDashboard from './pages/ShelterSyncDashboard';
import RescueAIAssistant from './pages/RescueAIAssistant';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import UserDirectory from './pages/UserDirectory';
import TermsAndConditions from './pages/TermsAndConditions';
import RescueOnboarding from './pages/RescueOnboarding';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Contact" element={<LayoutWrapper currentPageName="Contact"><Contact /></LayoutWrapper>} />
      <Route path="/AdminAnalytics" element={<LayoutWrapper currentPageName="AdminAnalytics"><AdminAnalytics /></LayoutWrapper>} />
      <Route path="/AdminPetUpload" element={<LayoutWrapper currentPageName="AdminPetUpload"><AdminPetUpload /></LayoutWrapper>} />
      <Route path="/AdminUsers" element={<LayoutWrapper currentPageName="AdminUsers"><AdminUsers /></LayoutWrapper>} />
      <Route path="/PartnershipManagement" element={<LayoutWrapper currentPageName="PartnershipManagement"><PartnershipManagement /></LayoutWrapper>} />
      <Route path="/PetDashboard" element={<LayoutWrapper currentPageName="PetDashboard"><PetDashboard /></LayoutWrapper>} />
      <Route path="/ShelterDashboard" element={<LayoutWrapper currentPageName="ShelterDashboard"><ShelterDashboard /></LayoutWrapper>} />
      <Route path="/ShelterDetail" element={<LayoutWrapper currentPageName="ShelterDetail"><ShelterDetail /></LayoutWrapper>} />
      <Route path="/ShelterDirectory" element={<LayoutWrapper currentPageName="ShelterDirectory"><ShelterDirectory /></LayoutWrapper>} />
      <Route path="/ShelterPortal" element={<LayoutWrapper currentPageName="ShelterPortal"><ShelterPortal /></LayoutWrapper>} />
      <Route path="/ShelterSyncDashboard" element={<LayoutWrapper currentPageName="ShelterSyncDashboard"><ShelterSyncDashboard /></LayoutWrapper>} />
      <Route path="/RescueAIAssistant" element={<LayoutWrapper currentPageName="RescueAIAssistant"><RescueAIAssistant /></LayoutWrapper>} />
      <Route path="/UserProfile" element={<LayoutWrapper currentPageName="UserProfile"><UserProfile /></LayoutWrapper>} />
      <Route path="/AdminDashboard" element={<LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper>} />
      <Route path="/UserDirectory" element={<LayoutWrapper currentPageName="UserDirectory"><UserDirectory /></LayoutWrapper>} />
      <Route path="/TermsAndConditions" element={<LayoutWrapper currentPageName="TermsAndConditions"><TermsAndConditions /></LayoutWrapper>} />
      <Route path="/RescueOnboarding" element={<LayoutWrapper currentPageName="RescueOnboarding"><RescueOnboarding /></LayoutWrapper>} />
      <Route path="/Login" element={<Login />} />
      <Route path="/ResetPassword" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App