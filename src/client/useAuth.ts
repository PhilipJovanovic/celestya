import { useContext } from "react";
import { AuthContext } from "./contextProvider";

export const useAuthContext = () => {
  return useContext(AuthContext);
};
