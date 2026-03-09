import { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';

// Lazy-loaded pages
const OnboardingPage = lazy(() => import("@/pages/Onboarding"));
const AuthPage = lazy(() => import("@/pages/Auth"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const UploadPage = lazy(() => import("@/pages/Upload"));
const ProcessingPage = lazy(() => import("@/pages/Processing"));
const ResultsPage = lazy(() => import("@/pages/Results"));
const ChatPage = lazy(() => import("@/pages/Chat"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const HistoryPage = lazy(() => import("@/pages/History"));
const PitchPage = lazy(() => import("@/pages/Pitch"));
const LanguageSelection = lazy(() => import("@/pages/LanguageSelection"));
const HealthTrends = lazy(() => import("@/pages/HealthTrends"));
const ReportComparison = lazy(() => import("@/pages/ReportComparison"));
const MedicationTracker = lazy(() => import("@/pages/MedicationTracker"));
const NotificationsPage = lazy(() => import("@/pages/Notifications"));
const SubscriptionPage = lazy(() => import("@/pages/Subscription"));
const SettingsPrivacy = lazy(() => import("@/pages/SettingsPrivacy"));
const HelpSupport = lazy(() => import("@/pages/HelpSupport"));
const MedicalTimeline = lazy(() => import("@/pages/MedicalTimeline"));
const EmergencyAlerts = lazy(() => import("@/pages/EmergencyAlerts"));
const FamilyDashboard = lazy(() => import("@/pages/FamilyDashboard"));
const HealthProfilePage = lazy(() => import("@/pages/HealthProfile"));
const PrescriptionScannerPage = lazy(() => import("@/pages/PrescriptionScanner"));
const VoiceDoctorPage = lazy(() => import("@/pages/VoiceDoctor"));
const DailyCheckinPage = lazy(() => import("@/pages/DailyCheckin"));
const MedicationRemindersPage = lazy(() => import("@/pages/MedicationReminders"));
const HealthHabitsPage = lazy(() => import("@/pages/HealthHabits"));
const VaccinationTrackerPage = lazy(() => import("@/pages/VaccinationTracker"));
const EmergencyCardPage = lazy(() => import("@/pages/EmergencyCard"));
const SkinScannerPage = lazy(() => import("@/pages/SkinScanner"));
const PredictiveHealthPage = lazy(() => import("@/pages/PredictiveHealth"));
const DoctorDiscoveryPage = lazy(() => import("@/pages/DoctorDiscovery"));
const BookConsultationPage = lazy(() => import("@/pages/BookConsultation"));
const ConsultationHistoryPage = lazy(() => import("@/pages/ConsultationHistory"));
const WearableIntegrationPage = lazy(() => import("@/pages/WearableIntegration"));
const SymptomCheckerPage = lazy(() => import("@/pages/SymptomChecker"));
const MedicineScannerPage = lazy(() => import("@/pages/MedicineScanner"));
const HealthMapPage = lazy(() => import("@/pages/HealthMap"));
const MedicineMarketplacePage = lazy(() => import("@/pages/MedicineMarketplace"));
const InvestorDeckPage = lazy(() => import("@/pages/InvestorDeck"));
const PharmacyDashboardPage = lazy(() => import("@/pages/PharmacyDashboard"));
const ECGInterpreterPage = lazy(() => import("@/pages/ECGInterpreter"));
const XrayAnalysisPage = lazy(() => import("@/pages/XrayAnalysis"));
const MRIAnalysisPage = lazy(() => import("@/pages/MRIAnalysis"));
const TreatmentPlanPage = lazy(() => import("@/pages/TreatmentPlan"));
const AIAppointmentBookingPage = lazy(() => import("@/pages/AIAppointmentBooking"));
const AITriagePage = lazy(() => import("@/pages/AITriage"));
const TelemedicineConsultationPage = lazy(() => import("@/pages/TelemedicineConsultation"));
const CTScanAnalysisPage = lazy(() => import("@/pages/CTScanAnalysis"));
const MelanomaScreenerPage = lazy(() => import("@/pages/MelanomaScreener"));
const DoctorDashboardPage = lazy(() => import("@/pages/DoctorDashboard"));
const HospitalDashboardPage = lazy(() => import("@/pages/HospitalDashboard"));
const ChatComparisonPage = lazy(() => import("@/pages/ChatComparison"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const IndexRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/pitch" replace />;
};

const P = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>{children}</PageTransition>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/pitch" element={<P><PitchPage /></P>} />
        <Route path="/investor-deck" element={<P><InvestorDeckPage /></P>} />
        <Route path="/onboarding" element={<P><OnboardingPage /></P>} />
        <Route path="/auth" element={<P><AuthPage /></P>} />
        <Route path="/language" element={<P><LanguageSelection /></P>} />
        <Route path="/dashboard" element={<ProtectedRoute><P><DashboardPage /></P></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><P><UploadPage /></P></ProtectedRoute>} />
        <Route path="/processing/:id" element={<ProtectedRoute><P><ProcessingPage /></P></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><P><ResultsPage /></P></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><P><ChatPage /></P></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><P><ProfilePage /></P></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><P><HistoryPage /></P></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><P><MedicationTracker /></P></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><P><NotificationsPage /></P></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><P><SubscriptionPage /></P></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><P><SettingsPrivacy /></P></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><P><HelpSupport /></P></ProtectedRoute>} />
        <Route path="/trends" element={<ProtectedRoute><P><HealthTrends /></P></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><P><ReportComparison /></P></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><P><MedicalTimeline /></P></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><P><EmergencyAlerts /></P></ProtectedRoute>} />
        <Route path="/family" element={<ProtectedRoute><P><FamilyDashboard /></P></ProtectedRoute>} />
        <Route path="/health-profile" element={<ProtectedRoute><P><HealthProfilePage /></P></ProtectedRoute>} />
        <Route path="/prescription" element={<ProtectedRoute><P><PrescriptionScannerPage /></P></ProtectedRoute>} />
        <Route path="/voice-doctor" element={<ProtectedRoute><P><VoiceDoctorPage /></P></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><P><DailyCheckinPage /></P></ProtectedRoute>} />
        <Route path="/med-reminders" element={<ProtectedRoute><P><MedicationRemindersPage /></P></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><P><HealthHabitsPage /></P></ProtectedRoute>} />
        <Route path="/vaccinations" element={<ProtectedRoute><P><VaccinationTrackerPage /></P></ProtectedRoute>} />
        <Route path="/emergency-card" element={<ProtectedRoute><P><EmergencyCardPage /></P></ProtectedRoute>} />
        <Route path="/skin-scanner" element={<ProtectedRoute><P><SkinScannerPage /></P></ProtectedRoute>} />
        <Route path="/predictive" element={<ProtectedRoute><P><PredictiveHealthPage /></P></ProtectedRoute>} />
        <Route path="/doctors" element={<ProtectedRoute><P><DoctorDiscoveryPage /></P></ProtectedRoute>} />
        <Route path="/book-consultation/:doctorId" element={<ProtectedRoute><P><BookConsultationPage /></P></ProtectedRoute>} />
        <Route path="/consultations" element={<ProtectedRoute><P><ConsultationHistoryPage /></P></ProtectedRoute>} />
        <Route path="/wearables" element={<ProtectedRoute><P><WearableIntegrationPage /></P></ProtectedRoute>} />
        <Route path="/symptom-checker" element={<ProtectedRoute><P><SymptomCheckerPage /></P></ProtectedRoute>} />
        <Route path="/medicine-scanner" element={<ProtectedRoute><P><MedicineScannerPage /></P></ProtectedRoute>} />
        <Route path="/health-map" element={<ProtectedRoute><P><HealthMapPage /></P></ProtectedRoute>} />
        <Route path="/medicine-store" element={<ProtectedRoute><P><MedicineMarketplacePage /></P></ProtectedRoute>} />
        <Route path="/pharmacy-dashboard" element={<ProtectedRoute><P><PharmacyDashboardPage /></P></ProtectedRoute>} />
        <Route path="/ecg" element={<ProtectedRoute><P><ECGInterpreterPage /></P></ProtectedRoute>} />
        <Route path="/xray" element={<ProtectedRoute><P><XrayAnalysisPage /></P></ProtectedRoute>} />
        <Route path="/mri" element={<ProtectedRoute><P><MRIAnalysisPage /></P></ProtectedRoute>} />
        <Route path="/treatment-plan" element={<ProtectedRoute><P><TreatmentPlanPage /></P></ProtectedRoute>} />
        <Route path="/book-appointment" element={<ProtectedRoute><P><AIAppointmentBookingPage /></P></ProtectedRoute>} />
        <Route path="/triage" element={<ProtectedRoute><P><AITriagePage /></P></ProtectedRoute>} />
        <Route path="/telemedicine" element={<ProtectedRoute><P><TelemedicineConsultationPage /></P></ProtectedRoute>} />
        <Route path="/ct-scan" element={<ProtectedRoute><P><CTScanAnalysisPage /></P></ProtectedRoute>} />
        <Route path="/melanoma-screener" element={<ProtectedRoute><P><MelanomaScreenerPage /></P></ProtectedRoute>} />
        <Route path="/doctor-dashboard" element={<ProtectedRoute><P><DoctorDashboardPage /></P></ProtectedRoute>} />
        <Route path="/hospital-dashboard" element={<ProtectedRoute><P><HospitalDashboardPage /></P></ProtectedRoute>} />
        <Route path="*" element={<P><NotFound /></P>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
