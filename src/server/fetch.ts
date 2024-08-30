import { IConfig, IServerSideRequestOptions } from "../types";
import getSessionServerside from "./session";

export const serverSideFetch = async (
    url: string,
    options: IServerSideRequestOptions,
    config: IConfig
) => {
    const session = await getSessionServerside();

    const opts: RequestInit = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session.token?.jwt,
        },
    };

    if (options.body) opts.body = JSON.stringify(options.body);

    const response: Response = await fetch(`${config.apiUrl}${url}`, opts);

    const res = await response.json();

    return res;
    //return Response.json(res);
};
