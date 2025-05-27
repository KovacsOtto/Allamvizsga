import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";


const exchangeRates = {
  EUR: 1,
  LEI: 4.5,
  HUF: 398.58
};

const HotelDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [description, setHotelDescription] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "USD");
  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const check_in = searchParams.get("check_in");
  const check_out = searchParams.get("check_out");
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const room_qty = searchParams.get("room_qty");

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

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
    const fetchHotelDescription = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/hotels/description/${id}`);
        console.log("Description Response:", response.data);
        if (response.data.success) {
          setHotelDescription(response.data.description);
        } else {
          console.error("Invalid description response:", response.data);
        }
      } catch (error) {
        console.error("Failed to fetch hotel description:", error);
      }
    };

    fetchHotelDetails();
    fetchHotelPhotos();
    fetchHotelDescription();
  }, [id, check_in, check_out, adults, children, room_qty]);


  useEffect(() => {
    if (hotel?.city || hotel?.city_name || hotel?.city_name_translated) {
      const cityQuery = hotel.city || hotel.city_name || hotel.city_name_translated;
      console.log("Város a lekéréshez:", cityQuery);
  
      axios.get("http://localhost:5000/api/attractions/by-city", {
        params: { city: cityQuery }
      })
        .then(res => {
          console.log("Látnivalók:", res.data.data);
          setAttractions(res.data.data);
        })
        .catch(err => console.error("Attraction fetch failed", err));
    }
  }, [hotel]);
  
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 border-solid"></div>
      </div>
    );
  }
  
  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 border-solid"></div>
      </div>
    );
  }
  
  const convertPrice = (amount) => {
    return (amount * exchangeRates[currency]).toFixed(2);
  };

  return (
    <>
      <Navbar setCurrency={setCurrency} />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">{hotel.hotel_name || "No Name Available"}</h1>
        <p className="text-gray-700">{hotel.address || "No address available"}</p>
        <div className="photos-container" >
          {photos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2 row-span-2 cursor-pointer" onClick={() => { setShowGallery(true); setSelectedIndex(0); }}>
                <img src={photos[0].url} alt="Main Hotel" className="w-full h-full object-cover rounded-lg" />
              </div>

              {photos.slice(1, 5).map((photo, index) => (
                <div key={index} className="cursor-pointer relative" onClick={() => { setShowGallery(true); setSelectedIndex(index + 1); }}>
                  <img src={photo.url} alt={`Hotel ${index}`} className="w-full h-full object-cover rounded-lg" />
                </div>
              ))}

              {photos.length > 5 && (
                <div className="relative cursor-pointer" onClick={() => setShowGallery(true)}>
                  <img src={photos[5].url} alt="More Photos" className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <p className="text-white text-lg font-bold">+{photos.length - 5} photos</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No Images Available</p>
          )}
        </div>
        <div className="info-box flex justify-between ">
        <div className="w-2/3">
            <div className="mb-4   rounded-lg">
              <h2 className="text-2xl font-semibold mb-2">About this hotel</h2>
              <p className="text-gray-700 p-1">{description || "No description available."}</p>
            </div>
            {hotel.property_highlight_strip && (
              <ul className="mt-4 p-4">
                {hotel.property_highlight_strip.map((highlight, index) => (
                  <li key={index} className="text-sm text-gray-600">✔ {highlight.name}</li>
                ))}
              </ul>
            )}
            
          </div>
          
          <div className="flex flex-col-reverse items-end justify-end w-1/3 ">
            <p className="text-lg mt-4">⭐ {hotel.review_nr || "No rating"} reviews</p>
            <p className="text-lg text-green-600 font-bold">
              {hotel.product_price_breakdown?.gross_amount?.value
                ? convertPrice(hotel.product_price_breakdown.gross_amount.value)
                : "No Price"} {currency}

            </p>
          </div>
          


        </div>
        {attractions.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Nearby Attractions</h2>
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {attractions.map((a, index) => (
                  <div key={index} className="min-w-[250px] bg-white rounded-lg shadow p-2">
                    <img src={a.primaryPhoto?.small} alt={a.name} className="w-full h-40 object-cover rounded" />
                    <h3 className="text-lg font-semibold mt-2">{a.name}</h3>
                    <p className="text-sm text-gray-500">{a.shortDescription}</p>
                    <p className="text-green-600 font-semibold mt-1">
                    {(a.representativePrice?.publicAmount * exchangeRates[currency]).toFixed(2)} {currency}
                  </p>                  </div>
                ))}
              </div>
            </div>
          )}

        <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="mt-4 block text-blue-500 underline">
          View on Booking.com
        </a>
        {showGallery && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="relative w-full max-w-4xl">
              <button
                className="absolute top-2 right-2 text-white text-3xl font-bold"
                onClick={() => setShowGallery(false)}
              >
                ✖
              </button>

              {selectedIndex > 0 && (
                <button
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl"
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                >
                  ◀
                </button>
              )}
              {selectedIndex < photos.length - 1 && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl"
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                >
                  ▶
                </button>
              )}

              <img
                src={photos[selectedIndex].url}
                alt={`Photo ${selectedIndex}`}
                className="w-full h-auto max-h-[80vh] mx-auto rounded-lg"
              />

              <div className="flex overflow-x-auto mt-4 space-x-2 p-2 bg-black bg-opacity-50 rounded-lg">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`Thumbnail ${index}`}
                    className={`w-20 h-20 object-cover rounded cursor-pointer ${index === selectedIndex ? "border-4 border-white" : ""}`}
                    onClick={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HotelDetail;
