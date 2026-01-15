export async function getTicksByRpc(poolId: string) {
  const url = "https://api-sui.cetus.zone/router_v2/ticks"
  const response = await fetch(
    `${url}?address=${poolId}&limit=512&offset=-443636`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
  const data = await response.json()
  console.log(data)

  const liquidity = data
  return data
}
