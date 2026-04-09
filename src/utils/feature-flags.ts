/**
 * Feature Flags System
 * Controls which features are visible/enabled in the UI
 */

export type FeatureFlag = 
  | 'adminPanel'
  | 'pharmacy'
  | 'hospitalAdmin'
  | 'telemedicine'
  | 'wearables'
  | 'voiceDoctor'
  | 'predictiveHealth'
  | 'skinScanner'
  | 'melanoma'
  | 'symptomChecker'
  | 'treatmentPlan'
  | 'aiTriage'
  | 'familyHealth'
  | 'healthMap'
  | 'emergencyAlerts';

// Base features always enabled for users
const BASE_FEATURES: Record<FeatureFlag, boolean> = {
  // Core features
  adminPanel: false,
  pharmacy: false,
  hospitalAdmin: false,
  
  // Services
  telemedicine: true,
  wearables: false,
  familyHealth: false,
  healthMap: false,
  emergencyAlerts: true,
  
  // AI Features
  voiceDoctor: false,
  predictiveHealth: false,
  skinScanner: true,
  melanoma: true,
  symptomChecker: true,
  treatmentPlan: true,
  aiTriage: true,
};

// Create for development/testing
const DEV_OVERRIDES: Partial<Record<FeatureFlag, boolean>> = {
  // Uncomment to enable development features
  // adminPanel: true,
  // pharmacy: true,
  // hospitalAdmin: true,
  // voiceDoctor: true,
  // predictiveHealth: true,
  // wearables: true,
  // familyHealth: true,
  // healthMap: true,
};

class FeatureFlagsManager {
  private flags: Record<FeatureFlag, boolean>;

  constructor() {
    this.flags = { ...BASE_FEATURES };
    
    // Apply dev overrides in development
    if (import.meta.env.DEV) {
      this.flags = { ...this.flags, ...DEV_OVERRIDES };
    }
  }

  isEnabled(feature: FeatureFlag): boolean {
    return this.flags[feature] ?? false;
  }

  enable(feature: FeatureFlag): void {
    this.flags[feature] = true;
  }

  disable(feature: FeatureFlag): void {
    this.flags[feature] = false;
  }

  toggle(feature: FeatureFlag): void {
    this.flags[feature] = !this.flags[feature];
  }

  getFlags(): Record<FeatureFlag, boolean> {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagsManager();
