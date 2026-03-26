import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "signin" | "signup" | "forgot";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) { setError("Please enter your email address."); return; }

    if (mode === "forgot") {
      setIsLoading(true);
      const { error } = await resetPassword(email.trim());
      setIsLoading(false);
      if (error) { setError(error.message); }
      else { Alert.alert("Check your email", "We sent you a password reset link.", [{ text: "OK", onPress: () => setMode("signin") }]); }
      return;
    }

    if (!password) { setError("Please enter your password."); return; }
    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }

    setIsLoading(true);
    if (mode === "signin") {
      const { error } = await signIn(email.trim(), password);
      setIsLoading(false);
      if (error) { setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message); }
      else { router.replace("/(tabs)"); }
    } else {
      const { error } = await signUp(email.trim(), password);
      setIsLoading(false);
      if (error) { setError(error.message); }
      else { Alert.alert("Welcome to Fork & Compass", "Check your email to confirm your account.", [{ text: "OK", onPress: () => setMode("signin") }]); }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brandName}>Fork & Compass</Text>
          <Text style={styles.tagline}>
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Start your culinary journey" : "Reset your password"}
          </Text>
        </View>

        {mode !== "forgot" && (
          <View style={styles.segmentControl}>
            <Pressable style={[styles.segmentBtn, mode === "signin" && styles.segmentBtnActive]} onPress={() => { setMode("signin"); setError(null); }}>
              <Text style={[styles.segmentText, mode === "signin" && styles.segmentTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable style={[styles.segmentBtn, mode === "signup" && styles.segmentBtnActive]} onPress={() => { setMode("signup"); setError(null); }}>
              <Text style={[styles.segmentText, mode === "signup" && styles.segmentTextActive]}>Create Account</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={Colors.light.secondary} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} returnKeyType={mode === "forgot" ? "done" : "next"} onSubmitEditing={mode === "forgot" ? handleSubmit : undefined} />
          </View>

          {mode !== "forgot" && (
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} placeholderTextColor={Colors.light.secondary} secureTextEntry autoComplete={mode === "signup" ? "new-password" : "current-password"} returnKeyType={mode === "signup" ? "next" : "done"} onSubmitEditing={mode === "signin" ? handleSubmit : undefined} />
            </View>
          )}

          {mode === "signup" && (
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" placeholderTextColor={Colors.light.secondary} secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={handleSubmit} />
            </View>
          )}

          {error && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }, isLoading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={Colors.light.onPrimary} /> : (
              <Text style={styles.submitText}>{mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}</Text>
            )}
          </Pressable>

          {mode === "signin" && (
            <Pressable onPress={() => { setMode("forgot"); setError(null); }} style={styles.linkBtn}>
              <Text style={styles.linkText}>Forgot your password?</Text>
            </Pressable>
          )}
          {mode === "forgot" && (
            <Pressable onPress={() => { setMode("signin"); setError(null); }} style={styles.linkBtn}>
              <Text style={styles.linkText}>Back to sign in</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.skipBtn}>
          <Text style={styles.skipText}>Continue without an account</Text>
        </Pressable>

        <Text style={styles.legal}>By creating an account you agree to our Terms of Service and Privacy Policy.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.surface },
  content: { paddingHorizontal: 24 },
  header: { marginBottom: 32 },
  brandName: { fontFamily: "NotoSerif_700Bold", fontSize: 32, color: Colors.light.primary, marginBottom: 6 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 17, color: Colors.light.secondary },
  segmentControl: { flexDirection: "row", backgroundColor: Colors.light.surfaceContainerLow, borderRadius: 12, padding: 3, marginBottom: 28 },
  segmentBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segmentBtnActive: { backgroundColor: Colors.light.surface, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  segmentText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.light.secondary },
  segmentTextActive: { color: Colors.light.onSurface, fontFamily: "Inter_600SemiBold" },
  form: { gap: 16, marginBottom: 24 },
  inputWrap: { gap: 6 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.onSurface },
  input: { height: 52, backgroundColor: Colors.light.surfaceContainerLow, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.outlineVariant, paddingHorizontal: 16, fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.light.onSurface },
  errorWrap: { backgroundColor: "rgba(186,26,26,0.08)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "rgba(186,26,26,0.2)" },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.error, lineHeight: 20 },
  submitBtn: { height: 52, backgroundColor: Colors.light.primary, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: Colors.light.onPrimary },
  linkBtn: { alignItems: "center", paddingVertical: 8, minHeight: 44, justifyContent: "center" },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.primary, textDecorationLine: "underline" },
  skipBtn: { alignItems: "center", paddingVertical: 14, minHeight: 44, justifyContent: "center", marginBottom: 16 },
  skipText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.secondary },
  legal: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.secondary, textAlign: "center", lineHeight: 16 },
});
