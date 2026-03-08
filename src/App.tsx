import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import OnboardingPage from "./pages/Onboarding";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import UploadPage from "./pages/Upload";
import ProcessingPage from "./pages/Processing";
import ResultsPage from "./pages/Results";
import ChatPage from "./pages/Chat";
import ProfilePage from "./pages/Profile";
import HistoryPage from "./pages/History";
import PitchPage from "./pages/Pitch";
import LanguageSelection from "./pages/LanguageSelection";
import HealthTrends from "./pages/HealthTrends";
import ReportComparison from "./pages/ReportComparison";
import MedicationTracker from "./pages/MedicationTracker";
import NotificationsPage from "./pages/Notifications";
import SubscriptionPage from "./pages/Subscription";
import SettingsPrivacy from "./pages/SettingsPrivacy";
import HelpSupport from "./pages/HelpSupport";
import MedicalTimeline from "./pages/MedicalTimeline";
import EmergencyAlerts from "./pages/EmergencyAlerts";
import FamilyDashboard from "./pages/FamilyDashboard";
import HealthProfilePage from "./pages/HealthProfile";
import PrescriptionScannerPage from "./pages/PrescriptionScanner";
import VoiceDoctorPage from "./pages/VoiceDoctor";
import DailyCheckinPage from "./pages/DailyCheckin";
import MedicationRemindersPage from "./pages/MedicationReminders";
import HealthHabitsPage from "./pages/HealthHabits";
import VaccinationTrackerPage from "./pages/VaccinationTracker";
import EmergencyCardPage from "./pages/EmergencyCard";
import SkinScannerPage from "./pages/SkinScanner";
import PredictiveHealthPage from "./pages/PredictiveHealth";
import DoctorDiscoveryPage from "./pages/DoctorDiscovery";
import BookConsultationPage from "./pages/BookConsultation";
import ConsultationHistoryPage from "./pages/ConsultationHistory";
import WearableIntegrationPage from "./pages/WearableIntegration";
import SymptomCheckerPage from "./pages/SymptomChecker";
import MedicineScannerPage from "./pages/MedicineScanner";
import HealthMapPage from "./pages/HealthMap";
import MedicineMarketplacePage from "./pages/MedicineMarketplace";
import InvestorDeckPage from "./pages/InvestorDeck";
import PharmacyDashboardPage from "./pages/PharmacyDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const IndexRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/pitch" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/pitch" element={<PitchPage />} />
            <Route path="/investor-deck" element={<InvestorDeckPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/language" element={<LanguageSelection />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/processing/:id" element={<ProtectedRoute><ProcessingPage /></ProtectedRoute>} />
            <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/medications" element={<ProtectedRoute><MedicationTracker /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPrivacy /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
            <Route path="/trends" element={<ProtectedRoute><HealthTrends /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><ReportComparison /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><MedicalTimeline /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><EmergencyAlerts /></ProtectedRoute>} />
            <Route path="/family" element={<ProtectedRoute><FamilyDashboard /></ProtectedRoute>} />
            <Route path="/health-profile" element={<ProtectedRoute><HealthProfilePage /></ProtectedRoute>} />
            <Route path="/prescription" element={<ProtectedRoute><PrescriptionScannerPage /></ProtectedRoute>} />
            <Route path="/voice-doctor" element={<ProtectedRoute><VoiceDoctorPage /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><DailyCheckinPage /></ProtectedRoute>} />
            <Route path="/med-reminders" element={<ProtectedRoute><MedicationRemindersPage /></ProtectedRoute>} />
            <Route path="/habits" element={<ProtectedRoute><HealthHabitsPage /></ProtectedRoute>} />
            <Route path="/vaccinations" element={<ProtectedRoute><VaccinationTrackerPage /></ProtectedRoute>} />
            <Route path="/emergency-card" element={<ProtectedRoute><EmergencyCardPage /></ProtectedRoute>} />
            <Route path="/skin-scanner" element={<ProtectedRoute><SkinScannerPage /></ProtectedRoute>} />
            <Route path="/predictive" element={<ProtectedRoute><PredictiveHealthPage /></ProtectedRoute>} />
            <Route path="/doctors" element={<ProtectedRoute><DoctorDiscoveryPage /></ProtectedRoute>} />
            <Route path="/book-consultation/:doctorId" element={<ProtectedRoute><BookConsultationPage /></ProtectedRoute>} />
            <Route path="/consultations" element={<ProtectedRoute><ConsultationHistoryPage /></ProtectedRoute>} />
            <Route path="/wearables" element={<ProtectedRoute><WearableIntegrationPage /></ProtectedRoute>} />
            <Route path="/symptom-checker" element={<ProtectedRoute><SymptomCheckerPage /></ProtectedRoute>} />
            <Route path="/medicine-scanner" element={<ProtectedRoute><MedicineScannerPage /></ProtectedRoute>} />
            <Route path="/health-map" element={<ProtectedRoute><HealthMapPage /></ProtectedRoute>} />
            <Route path="/medicine-store" element={<ProtectedRoute><MedicineMarketplacePage /></ProtectedRoute>} />
            <Route path="/pharmacy-dashboard" element={<ProtectedRoute><PharmacyDashboardPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
