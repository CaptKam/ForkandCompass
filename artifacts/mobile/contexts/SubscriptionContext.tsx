import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";

// RevenueCat is native-only — never load on web
let Purchases: any = null;
let LOG_LEVEL_DEBUG: any = null;

if (Platform.OS !== "web") {
  try {
    const rc = require("react-native-purchases");
    Purchases = rc.default;
    LOG_LEVEL_DEBUG = rc.LOG_LEVEL?.DEBUG;
  } catch {
    console.warn("[RevenueCat] Native module not available — running in mock mode");
  }
}

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";
const ENTITLEMENT_ID = "premium";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: any;
  packages: any[];
  purchasePackage: (pkg: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: true,
  isLoading: false,
  customerInfo: null,
  packages: [],
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  refreshCustomerInfo: async () => {},
});

export function SubscriptionProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const [isPremium, setIsPremium] = useState(true); // TRUE = gates open
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    if (!Purchases || !API_KEY) {
      console.warn("[RevenueCat] Skipping init — no SDK or API key");
      return;
    }

    const init = async () => {
      try {
        if (__DEV__ && LOG_LEVEL_DEBUG) {
          Purchases.setLogLevel(LOG_LEVEL_DEBUG);
        }

        Purchases.configure({ apiKey: API_KEY });

        if (userId) {
          await Purchases.logIn(userId);
        }

        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        checkPremiumStatus(info);

        const offerings = await Purchases.getOfferings();
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.warn("[RevenueCat] Init error:", e);
      }
    };

    init();

    Purchases.addCustomerInfoUpdateListener?.((info: any) => {
      setCustomerInfo(info);
      checkPremiumStatus(info);
    });
  }, [userId]);

  const checkPremiumStatus = (info: any) => {
    // GATES ARE OPEN — isPremium is always true until you flip this:
    // const hasPremium = typeof info?.entitlements?.active?.[ENTITLEMENT_ID] !== "undefined";
    // setIsPremium(hasPremium);
    setIsPremium(true);
  };

  const purchasePackage = useCallback(async (pkg: any): Promise<boolean> => {
    if (!Purchases) return false;
    try {
      setIsLoading(true);
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      checkPremiumStatus(info);
      return true;
    } catch (e: any) {
      if (!e.userCancelled) console.warn("[RevenueCat] Purchase error:", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!Purchases) return false;
    try {
      setIsLoading(true);
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      checkPremiumStatus(info);
      return true;
    } catch (e) {
      console.warn("[RevenueCat] Restore error:", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    if (!Purchases) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      checkPremiumStatus(info);
    } catch (e) {
      console.warn("[RevenueCat] Refresh error:", e);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, isLoading, customerInfo, packages, purchasePackage, restorePurchases, refreshCustomerInfo }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
