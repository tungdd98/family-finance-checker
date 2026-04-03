import { getExternalCoinPrices } from "@/lib/services/coin";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getExternalCoinPrices();
  return Response.json({ success: true, data });
}
