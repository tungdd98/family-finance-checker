import { getExternalGoldPrices } from "@/lib/services/gold";

export const dynamic = "force-dynamic";

export async function GET() {
  const pricesArray = await getExternalGoldPrices();
  return Response.json({ success: true, data: pricesArray });
}
