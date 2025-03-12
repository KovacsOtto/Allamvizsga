import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const HotelDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const check_in = searchParams.get("check_in");
  const check_out = searchParams.get("check_out");
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const room_qty = searchParams.get("room_qty");

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/hotels/details/${id}`, {
          params: { check_in, check_out, adults, children, room_qty },
        });

        if (res.data.status && res.data.data) {
          setHotel(res.data.data);
        } else {
          console.error("Invalid API response:", res.data);
        }
      } catch (err) {
        console.error("Failed to fetch hotel details:", err);
      }
    };

    const fetchHotelPhotos = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/hotels/photos/${id}`);
        if (res.data.status && res.data.data.length > 0) {
          setPhotos(res.data.data);
        } else {
          console.error("Invalid photo response:", res.data);
        }
      } catch (err) {
        console.error("Failed to fetch hotel photos:", err);
      }
      setLoading(false);
    };

    fetchHotelDetails();
    fetchHotelPhotos();
  }, [id, check_in, check_out, adults, children, room_qty]);

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (!hotel) return <p className="text-center text-lg">Hotel not found</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{hotel.hotel_name || "No Name Available"}</h1>

      {photos.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-2 row-span-2">
            <img
              src={photos[0].url}
              alt="Main Hotel"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {photos.slice(1, 5).map((photo, index) => (
            <div key={index} className="relative">
              <img src={photo.url} alt={`Hotel ${index}`} className="w-full h-full object-cover rounded-lg" />
            </div>
          ))}

          {photos.length > 5 && (
            <div className="relative">
              <img
                src={photos[5].url}
                alt="More Photos"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <p className="text-white text-lg font-bold">+{photos.length - 5} photos</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>No Images Available</p>
      )}

      <p className="text-lg mt-4">⭐ {hotel.review_nr || "No rating"} reviews</p>
      <p className="text-lg text-green-600 font-bold">
        {hotel.product_price_breakdown?.gross_amount?.value || "No Price"} {hotel.currency_code}
      </p>
      <p className="text-gray-700">{hotel.address || "No address available"}</p>

      {hotel.property_highlight_strip && (
        <ul className="mt-4">
          {hotel.property_highlight_strip.map((highlight, index) => (
            <li key={index} className="text-sm text-gray-600">✔ {highlight.name}</li>
          ))}
        </ul>
      )}

      <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="mt-4 block text-blue-500 underline">
        View on Booking.com
      </a>
    </div>
  );
};

export default HotelDetail;
