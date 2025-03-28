addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const ip = url.searchParams.get("ip");
  const port = url.searchParams.get("port");

  // Validasi input
  if (!ip || !port) {
    return new Response(JSON.stringify({ error: "IP atau Port tidak valid" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }

  const apiURL = `https://proxy.ndeso.xyz/check?ip=${ip}:${port}`;

  try {
    const response = await fetch(apiURL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    return new Response(response.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Gagal mengambil data" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
