import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_ROLE_KEY = "ummati_pending_role";

export type PendingRole = "INVESTOR" | "VISIONARY";

export async function getPendingRole(): Promise<PendingRole | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_ROLE_KEY);
    return (value === "INVESTOR" || value === "VISIONARY" ? value : null) as PendingRole | null;
  } catch {
    return null;
  }
}

export async function setPendingRole(role: PendingRole): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_ROLE_KEY, role);
  } catch {
    // Ignore
  }
}

export async function clearPendingRole(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_ROLE_KEY);
  } catch {
    // Ignore
  }
}
