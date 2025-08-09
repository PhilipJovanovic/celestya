import AuthContextProvider from "./contextProvider";
import LogoutComponent from "./Logout";
/* import { authContext } from "./useAuth"; */

export const AuthProvider = AuthContextProvider;
export const Logout = LogoutComponent;
/* export const useAuth = authContext; */
/* export const APIWrapper = useAPIWrapperContext; */

export { useAuth } from "./useAuth";
export { APIWrapper } from "./useAPIWrapper";
