import { IConfig, IServerSideRequestOptions } from "../types";
import { getSession } from "./session";

export const serverSideFetch = async ({
  url,
  method = "GET",
  config,
  body,
  ...options
}: {
  url: string;
  method?: "GET" | "POST" | "DELETE";
  body?: object;
  config: IConfig;
} & Omit<RequestInit, "body" | "method">) => {
  const session = await getSession();

  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.token?.jwt,
      ...options.headers,
    },
    ...options,
  };

  try {
    if (body) opts.body = JSON.stringify(body);
  } catch (e) {
    console.log("Error stringifying body: ", e);
  }

  const response: Response = await fetch(`${config.apiUrl}${url}`, opts);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
