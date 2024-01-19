'use client'

import { IChildProps } from "../types/internal";
import useAuthContext from "./useAuth";

export type LogoutProps = React.FC<React.ComponentProps<'div'> & IChildProps>

const LogoutComponent: LogoutProps = ({ children, ...props }) => {
    const { logout } = useAuthContext()

    const handleLogout = async (e: any) => {
        e.preventDefault()
        await logout()
    }

    return (
        <div onClick={handleLogout} {...props}>
            {children}
        </div>
    )
}

export default LogoutComponent