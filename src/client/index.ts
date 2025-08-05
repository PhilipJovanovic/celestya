import AuthContextProvider from "./contextProvider";
import LogoutComponent from "./Logout";
import useAPIWrapperContext from "./useAPIWrapper";
import useAuthContext from "./useAuth";

export const AuthProvider = AuthContextProvider;
export const Logout = LogoutComponent;
export const useAuth = useAuthContext;
export const APIWrapper = useAPIWrapperContext;
