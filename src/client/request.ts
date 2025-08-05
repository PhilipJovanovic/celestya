export async function gFetch({
  url,
  options,
}: {
  url: string | URL;
  options?: object;
}) {
  const response: Response = await fetch(url, {
    method: "GET",
    ...options,
  });

  return await response.json();
}

export async function pFetch({
  url,
  body,
  options,
}: {
  url: string | URL;
  body: object;
  options?: object;
}) {
  const response: Response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });

  return await response.json();
}

export async function dFetch({
  url,
  options,
}: {
  url: string | URL;
  options?: object;
}) {
  const response: Response = await fetch(url, {
    method: "DELETE",
    ...options,
  });

  return await response.json();
}
