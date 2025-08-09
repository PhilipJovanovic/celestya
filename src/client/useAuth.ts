import { useContext } from "react";
import { AuthContext } from "./contextProvider";

export const useAuth = () => {
  return useContext(AuthContext);
};
