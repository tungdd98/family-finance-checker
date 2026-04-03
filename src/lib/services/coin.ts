export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export async function getExternalCoinPrices(): Promise<CoinPrice[]> {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false",
      {
        headers: apiKey ? { "x-cg-demo-api-key": apiKey } : {},
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data as CoinPrice[]).map((item) => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      image: item.image,
      current_price: item.current_price,
      price_change_percentage_24h: item.price_change_percentage_24h ?? 0,
    }));
  } catch {
    return [];
  }
}
