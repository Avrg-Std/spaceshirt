import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lon = request.nextUrl.searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=14&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SpaceShirt/1.0 (checkout-location)',
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocode failed')
    }

    const data = await response.json()
    const address = data.address || {}
    const parts = [
      address.road,
      address.neighbourhood || address.suburb || address.village,
      address.city || address.town || address.state,
      address.country,
    ].filter(Boolean)

    return NextResponse.json({
      location: parts.length > 0 ? parts.join(', ') : data.display_name || `${lat}, ${lon}`,
    })
  } catch {
    return NextResponse.json(
      { location: `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}` },
      { status: 200 }
    )
  }
}
