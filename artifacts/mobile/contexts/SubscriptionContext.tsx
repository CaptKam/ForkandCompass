import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";

// Entitlement identifier — set this up in RevenueCat dashboard
// as "premium" once you create your products
const ENTITLEMENT_ID = "premium";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    if (!API_KEY) {
      console.warn("[RevenueCat] No API key found");
      return;
    }

    const init = async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
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

    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      checkPremiumStatus(info);
    });
  }, [userId]);

  const checkPremiumStatus = (info: CustomerInfo) => {
    // GATES ARE OPEN — isPremium is always true until you
    // decide what to gate and flip this to use entitlements:
    //
    // const hasPremium =
    //   typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    // setIsPremium(hasPremium);
    //
    // For now everyone is premium:
    setIsPremium(true);
  };

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      try {
        setIsLoading(true);
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(info);
        checkPremiumStatus(info);
        return true;
      } catch (e: any) {
        if (!e.userCancelled) {
          console.warn("[RevenueCat] Purchase error:", e);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
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
      value={{
        isPremium,
        isLoading,
        customerInfo,
        packages,
        purchasePackage,
        restorePurchases,
        refreshCustomerInfo,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
