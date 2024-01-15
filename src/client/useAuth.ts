import { useContext } from "react";
import { AuthContext } from "./contextProvider";

const useAuthContext = () => {
    return useContext(AuthContext);
};

export default useAuthContext;
