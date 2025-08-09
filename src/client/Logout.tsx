"use client";

import { useAuth } from ".";
import { IChildProps } from "../types/internal";

export type LogoutProps = React.FC<React.ComponentProps<"div"> & IChildProps>;

const LogoutComponent: LogoutProps = ({ children, ...props }) => {
  const { logout } = useAuth();

  const handleLogout = async (e: any) => {
    e.preventDefault();
    await logout();
  };

  return (
    <div onClick={handleLogout} {...props}>
      {children}
    </div>
  );
};

export default LogoutComponent;
