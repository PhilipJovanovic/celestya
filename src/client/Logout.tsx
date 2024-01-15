'use client'

import { IChildProps } from "../types";
/* import { useAuth } from "./useAuth"; */

export type LogoutProps = React.FC<React.ComponentProps<'div'> & IChildProps>

const LogoutComponent: LogoutProps = ({ children, ...props }) => {
    //const { logout } = useAuth()

    const handleLogout = async (e: any) => {
        e.preventDefault()

        //const l = await logout()

        //console.log("logout: ", l)
        console.log("test")
    }

    return (
        <div onClick={handleLogout} {...props}>
            {children}
        </div>
    )
}

export default LogoutComponent