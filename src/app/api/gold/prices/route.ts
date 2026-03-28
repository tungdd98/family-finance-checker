export async function GET() {
  try {
    const res = await fetch("https://www.vang.today/api/prices", {
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!res.ok) {
      return Response.json({ success: false, data: [] }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ success: false, data: [] }, { status: 502 });
  }
}
