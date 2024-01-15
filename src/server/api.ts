import { NextRequest } from "next/server";
import { IConfig, IRequestOptions } from "../types";

export default async function proxy(
    method: string,
    request: NextRequest,
    options: IRequestOptions,
    config: IConfig
) {
    return Response.json({
        data: "doesWork",
    });
}
