import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Link } from "react-router-dom";

const Profile = ({ currency, setCurrency }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const savedSearch = JSON.parse(localStorage.getItem("dashboardSearch")) || {};
  const check_in = savedSearch.dates?.[0]?.startDate?.slice(0, 10) || "2025-06-26";
  const check_out = savedSearch.dates?.[0]?.endDate?.slice(0, 10) || "2025-06-29";
  const adults = savedSearch.guests?.adults || 2;
  const children = savedSearch.guests?.children || 0;
  const room_qty = savedSearch.guests?.rooms || 1;
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [attractionsMap, setAttractionsMap] = useState({});
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoAttraction, setInfoAttraction] = useState(null);
  const [selectedAttractionIndex, setSelectedAttractionIndex] = useState(0);
  const [showAttractionGallery, setShowAttractionGallery] = useState(false);

  useEffect(() => {
    if (activeTab === "bookings" && user?.id) {
      axios.get(`http://localhost:5000/api/bookings/${user.id}`)
        .then(res => setBookings(res.data))
        .catch(err => console.error("Failed to fetch bookings", err));
    }
  }, [activeTab, user?.id]);
  
  useEffect(() => {
    if (activeTab === "favorites" && user?.id) {
      axios
        .get(`http://localhost:5000/api/favorites/${user.id}`)
        .then((res) => {
          setFavorites(res.data);
        })
        .catch((err) => {
          console.error("Failed to load favorites", err);
        });
    }
  }, [activeTab, user?.id]);
  
  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Profile</h2>
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-700">Full name:</span> {user.full_name}</p>
              <p><span className="font-semibold text-gray-700">Email:</span> {user.email}</p>
              <p><span className="font-semibold text-gray-700">Account created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
            >
              Back to Dashboard
            </button>
          </div>
        );
        case "bookings":
          return (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Your Bookings</h2>
        
              {bookings.length === 0 ? (
                <p className="text-gray-600">You have no bookings yet.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center">
                        <img
                          src={booking.hotel_image_url || "https://via.placeholder.com/150"}
                          alt={booking.hotel_name}
                          className="w-28 h-28 object-cover rounded-lg mr-6"
                        />
                        <div className="flex-grow">
                          <Link
                            to={`/hotel/${booking.hotel_id}?check_in=${new Date(
                              booking.check_in_date
                            )
                              .toISOString()
                              .slice(0, 10)}&check_out=${new Date(
                              booking.check_out_date
                            )
                              .toISOString()
                              .slice(0, 10)}&adults=${booking.num_adults}&children=${
                              booking.num_children
                            }&room_qty=${booking.num_rooms}`}
                            className="block"
                          >
                            <h3 className="text-xl font-bold">{booking.hotel_name}</h3>
                          </Link>
                          <p className="text-gray-600 text-sm">{booking.hotel_address}</p>
                          <p className="text-sm text-gray-700">
                            {new Date(booking.check_in_date).toLocaleDateString()} →{" "}
                            {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-700">
                            {booking.num_adults} adults · {booking.num_children} children ·{" "}
                            {booking.num_rooms} room(s)
                          </p>
                          <p className="text-green-700 font-semibold mt-1">
                            {booking.total_price} {booking.currency}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleAttractions(booking.id)}
                          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {expandedBookingId === booking.id ? "Hide Activities" : "Show Activities"}
                        </button>
                      </div>
        
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          expandedBookingId === booking.id
                            ? "max-h-[1000px] mt-4 border-t pt-2"
                            : "max-h-0"
                        }`}
                      >
                        {expandedBookingId === booking.id && attractionsMap[booking.id] && (
                          <>
                            <h4 className="text-md font-semibold mb-2">Booked Activities</h4>
                            {attractionsMap[booking.id].length === 0 ? (
                              <p className="text-sm text-gray-500">No activities booked.</p>
                            ) : (
                              <ul className="space-y-2">
                                {attractionsMap[booking.id].map((attr, i) => (
                                   <li
                                   key={i}
                                   className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                                   onClick={() => handleAttractionInfoClick(attr.slug)}
                                    >
                                    {attr.image_url && (
                                      <img
                                        src={attr.image_url}
                                        alt="attraction"
                                        className="w-10 h-10 rounded object-cover"
                                      />
                                    )}
                                    <div>
                                      <p className="font-semibold">{attr.attraction_name}</p>
                                      <p className="text-xs text-gray-500">
                                        {attr.attraction_description}
                                      </p>
                                      <p className="text-green-600 text-xs">
                                        {attr.price} {attr.currency}
                                      </p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        
      case "favorites":
        return (
          <div>
          <h2 className="text-2xl font-semibold mb-4">Favorites</h2>
          {favorites.length === 0 ? (
          <p className="text-gray-600">You haven't saved any hotels yet.</p>
        ) : (
          <div className="space-y-4">
            
            {favorites.map((fav, index) => (
              <Link
                to={`/hotel/${fav.hotel_id}?check_in=${check_in}&check_out=${check_out}&adults=${adults}&children=${children}&room_qty=${room_qty}`}
                className="block"
              >
              <div
                key={index}
                className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm border"
              >
                <img
                  src={fav.hotel_image_url}
                  alt={fav.hotel_name}
                  className="w-24 h-24 object-cover rounded mr-4"
                />
                <div>
                  <h3 className="font-bold">{fav.hotel_name}</h3>
                  <p className="text-sm text-gray-600">{fav.hotel_address}</p>
                </div>
              </div>
              </Link>

            ))}
          </div>
        )}

        </div>

        );
      default:
        return null;
    }
  };
  const toggleAttractions = async (bookingId) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }
  
    try {
      const res = await axios.get(`http://localhost:5000/api/booking-attractions/${bookingId}`);
      setAttractionsMap((prev) => ({ ...prev, [bookingId]: res.data }));
      setExpandedBookingId(bookingId);
    } catch (err) {
      console.error("Failed to fetch attractions", err);
    }
  };
  const handleAttractionInfoClick = async (slug) => {
    try {
      const currencyCode = currency === "LEI" ? "RON" : currency;
      const res = await axios.get("http://localhost:5000/api/attractions/details", {
        params: { slug, currency_code: currencyCode }
      });
      if (res.data?.data) {
        setInfoAttraction(res.data.data);
        setShowInfoModal(true);
      } else {
        alert("No details available.");
      }
    } catch (err) {
      console.error("Attraction details fetch failed:", err.response?.data || err.message || err);
      alert("Something went wrong.");
    }
  };
  
  return (
    <>
      <Navbar currency={currency} setCurrency={setCurrency} />
      <div className="max-w-6xl mx-auto flex mt-10 px-4">
        <div className="w-1/4 pr-6 border-r border-gray-300">
          <ul className="space-y-6 text-lg">
            <li>
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left transition-all ${activeTab === "profile" ? "font-bold text-green-700" : "text-gray-700 hover:text-green-600"}`}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`w-full text-left transition-all ${activeTab === "bookings" ? "font-bold text-green-700" : "text-gray-700 hover:text-green-600"}`}
              >
                Your Bookings
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`w-full text-left transition-all ${activeTab === "favorites" ? "font-bold text-green-700" : "text-gray-700 hover:text-green-600"}`}
              >
                Favorites
              </button>
            </li>
          </ul>
        </div>

        <div className="w-3/4 pl-8 bg-white p-8 rounded-lg shadow-lg">
          {renderContent()}
              </div>
            </div>
            {showInfoModal && infoAttraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setShowInfoModal(false)}
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-2">{infoAttraction.name}</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line mb-4">
              {infoAttraction.description}
            </p>
            {infoAttraction.additionalInfo && (
              <p className="text-sm text-gray-600 italic whitespace-pre-line mb-4">
                {infoAttraction.additionalInfo}
              </p>
            )}
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {infoAttraction.photos?.slice(0, 5).map((photo, i) => (
                <img
                  key={i}
                  src={photo.small}
                  alt="Attraction"
                  className="w-24 h-24 object-cover rounded cursor-pointer"
                  onClick={() => {
                    setSelectedAttractionIndex(i);
                    setShowAttractionGallery(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {showAttractionGallery && infoAttraction?.photos?.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl">
            <button
              className="absolute top-2 right-2 text-white text-3xl font-bold"
              onClick={() => setShowAttractionGallery(false)}
            >
              ✖
            </button>

            {selectedAttractionIndex > 0 && (
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl"
                onClick={() => setSelectedAttractionIndex((prev) => prev - 1)}
              >
                ◀
              </button>
            )}
            {selectedAttractionIndex < infoAttraction.photos.length - 1 && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl"
                onClick={() => setSelectedAttractionIndex((prev) => prev + 1)}
              >
                ▶
              </button>
            )}

            <img
              src={infoAttraction.photos[selectedAttractionIndex]?.medium || infoAttraction.photos[selectedAttractionIndex]?.small}
              alt={`Attraction ${selectedAttractionIndex}`}
              className="w-full h-auto max-h-[80vh] mx-auto rounded-lg"
            />

            <div className="flex overflow-x-auto mt-4 space-x-2 p-2 bg-black bg-opacity-50 rounded-lg">
              {infoAttraction.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo.small}
                  alt={`Thumbnail ${index}`}
                  className={`w-20 h-20 object-cover rounded cursor-pointer ${index === selectedAttractionIndex ? "border-4 border-white" : ""}`}
                  onClick={() => setSelectedAttractionIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Profile;
