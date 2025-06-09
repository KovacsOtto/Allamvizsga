import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";
import { useEffect } from "react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const FitBounds = ({ hotels }) => {
  const map = useMap();

  useEffect(() => {
    if (!hotels || hotels.length === 0) return;
    const bounds = L.latLngBounds(hotels.map(h => [h.property.latitude, h.property.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [hotels, map]);

  return null;
};

const HotelMap = ({ hotels, currency, getNights, convertPrice, navigate, guests, dates }) => {
  if (!hotels || hotels.length === 0) return null;

  return (
    <MapContainer
      center={[48.8566, 2.3522]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />

      {hotels.map((hotel, i) => {
        const prop = hotel.property;
        const { latitude, longitude, name, photoUrls, reviewScore, reviewCount, priceBreakdown, id } = prop;
        if (!latitude || !longitude) return null;

        const price = priceBreakdown?.grossPrice?.value
          ? convertPrice(priceBreakdown.grossPrice.value * getNights() * guests.rooms)
          : "N/A";

        const params = new URLSearchParams({
          check_in: dates[0].startDate.toISOString().slice(0, 10),
          check_out: dates[0].endDate.toISOString().slice(0, 10),
          adults: guests.adults,
          children: guests.children,
          room_qty: guests.rooms,
        }).toString();

        return (
          <Marker key={i} position={[latitude, longitude]}>
            <Popup>
  <div className="w-[240px] rounded-xl shadow-lg">
    <img
      src={photoUrls?.[0] || "https://via.placeholder.com/240x130"}
      alt={name}
      className="w-full h-[120px] object-cover rounded-t-xl"
    />
    <div className="p-3 bg-white rounded-b-xl">
      <div className="text-sm font-semibold text-gray-800 truncate mb-1">{name}</div>
      <div className="text-green-600 font-bold text-base mb-1">{price} {currency}</div>

      {typeof reviewScore === "number" && (
        <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
          <span className="text-yellow-500 text-lg">★</span>
          <span className="font-semibold">{reviewScore}</span>
          <span>({reviewCount} reviews)</span>
        </div>
      )}

      <button
        onClick={() => navigate(`/hotel/${id}?${params}`)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 rounded-md transition"
      >
        Details
      </button>
    </div>
  </div>
</Popup>

          </Marker>
        );
      })}

      <FitBounds hotels={hotels} />
    </MapContainer>
  );
};

export default HotelMap;
