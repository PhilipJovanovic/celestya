export async function pFetch({
    url,
    body,
}: {
    url: string | URL;
    body: object;
}) {
    const response: Response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    return data;
}

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

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    return data;
}
