import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext();

function safeParseUser() {
  const raw = localStorage.getItem("user");
  if (!raw || raw === "undefined") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(safeParseUser());

  // Supports:
  // 1) login({ token, user })
  // 2) login(token, user)
  const login = (arg1, arg2) => {
    const data =
      typeof arg1 === "object" && arg1?.token && arg1?.user
        ? arg1
        : { token: arg1, user: arg2 };

    if (!data?.token || !data?.user) {
      throw new Error("Invalid auth response (missing token/user).");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("verifyEmail");
    localStorage.removeItem("redirectAfterLogin");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
