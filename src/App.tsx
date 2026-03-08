import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy-loaded pages
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const AuthPage = lazy(() => import("./pages/Auth"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const UploadPage = lazy(() => import("./pages/Upload"));
const ProcessingPage = lazy(() => import("./pages/Processing"));
const ResultsPage = lazy(() => import("./pages/Results"));
const ChatPage = lazy(() => import("./pages/Chat"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const HistoryPage = lazy(() => import("./pages/History"));
const PitchPage = lazy(() => import("./pages/Pitch"));
const LanguageSelection = lazy(() => import("./pages/LanguageSelection"));
const HealthTrends = lazy(() => import("./pages/HealthTrends"));
const ReportComparison = lazy(() => import("./pages/ReportComparison"));
const MedicationTracker = lazy(() => import("./pages/MedicationTracker"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const SubscriptionPage = lazy(() => import("./pages/Subscription"));
const SettingsPrivacy = lazy(() => import("./pages/SettingsPrivacy"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const MedicalTimeline = lazy(() => import("./pages/MedicalTimeline"));
const EmergencyAlerts = lazy(() => import("./pages/EmergencyAlerts"));
const FamilyDashboard = lazy(() => import("./pages/FamilyDashboard"));
const HealthProfilePage = lazy(() => import("./pages/HealthProfile"));
const PrescriptionScannerPage = lazy(() => import("./pages/PrescriptionScanner"));
const VoiceDoctorPage = lazy(() => import("./pages/VoiceDoctor"));
const DailyCheckinPage = lazy(() => import("./pages/DailyCheckin"));
const MedicationRemindersPage = lazy(() => import("./pages/MedicationReminders"));
const HealthHabitsPage = lazy(() => import("./pages/HealthHabits"));
const VaccinationTrackerPage = lazy(() => import("./pages/VaccinationTracker"));
const EmergencyCardPage = lazy(() => import("./pages/EmergencyCard"));
const SkinScannerPage = lazy(() => import("./pages/SkinScanner"));
const PredictiveHealthPage = lazy(() => import("./pages/PredictiveHealth"));
const DoctorDiscoveryPage = lazy(() => import("./pages/DoctorDiscovery"));
const BookConsultationPage = lazy(() => import("./pages/BookConsultation"));
const ConsultationHistoryPage = lazy(() => import("./pages/ConsultationHistory"));
const WearableIntegrationPage = lazy(() => import("./pages/WearableIntegration"));
const SymptomCheckerPage = lazy(() => import("./pages/SymptomChecker"));
const MedicineScannerPage = lazy(() => import("./pages/MedicineScanner"));
const HealthMapPage = lazy(() => import("./pages/HealthMap"));
const MedicineMarketplacePage = lazy(() => import("./pages/MedicineMarketplace"));
const InvestorDeckPage = lazy(() => import("./pages/InvestorDeck"));
const PharmacyDashboardPage = lazy(() => import("./pages/PharmacyDashboard"));
const ECGInterpreterPage = lazy(() => import("./pages/ECGInterpreter"));
const XrayAnalysisPage = lazy(() => import("./pages/XrayAnalysis"));
const MRIAnalysisPage = lazy(() => import("./pages/MRIAnalysis"));
const TreatmentPlanPage = lazy(() => import("./pages/TreatmentPlan"));
const AIAppointmentBookingPage = lazy(() => import("./pages/AIAppointmentBooking"));
const AITriagePage = lazy(() => import("./pages/AITriage"));
const TelemedicineConsultationPage = lazy(() => import("./pages/TelemedicineConsultation"));
const CTScanAnalysisPage = lazy(() => import("./pages/CTScanAnalysis"));
const MelanomaScreenerPage = lazy(() => import("./pages/MelanomaScreener"));
const DoctorDashboardPage = lazy(() => import("./pages/DoctorDashboard"));
const HospitalDashboardPage = lazy(() => import("./pages/HospitalDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/ecg" element={<ProtectedRoute><ECGInterpreterPage /></ProtectedRoute>} />
              <Route path="/xray" element={<ProtectedRoute><XrayAnalysisPage /></ProtectedRoute>} />
              <Route path="/mri" element={<ProtectedRoute><MRIAnalysisPage /></ProtectedRoute>} />
              <Route path="/treatment-plan" element={<ProtectedRoute><TreatmentPlanPage /></ProtectedRoute>} />
              <Route path="/book-appointment" element={<ProtectedRoute><AIAppointmentBookingPage /></ProtectedRoute>} />
              <Route path="/triage" element={<ProtectedRoute><AITriagePage /></ProtectedRoute>} />
              <Route path="/telemedicine" element={<ProtectedRoute><TelemedicineConsultationPage /></ProtectedRoute>} />
              <Route path="/ct-scan" element={<ProtectedRoute><CTScanAnalysisPage /></ProtectedRoute>} />
              <Route path="/melanoma-screener" element={<ProtectedRoute><MelanomaScreenerPage /></ProtectedRoute>} />
              <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboardPage /></ProtectedRoute>} />
              <Route path="/hospital-dashboard" element={<ProtectedRoute><HospitalDashboardPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
