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
                  <Link
                  key={index}
                  to={`/hotel/${booking.hotel_id}?check_in=${new Date(booking.check_in_date).toISOString().slice(0,10)}&check_out=${new Date(booking.check_out_date).toISOString().slice(0,10)}&adults=${booking.num_adults}&children=${booking.num_children}&room_qty=${booking.num_rooms}`}
                  className="block"
                >

                    <div key={index} className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                      <img
                        src={booking.hotel_image_url || "https://via.placeholder.com/150"}
                        alt={booking.hotel_name}
                        className="w-28 h-28 object-cover rounded-lg mr-6"
                      />
                      <div>
                        <h3 className="text-xl font-bold">{booking.hotel_name}</h3>
                        <p className="text-gray-600 text-sm">{booking.hotel_address}</p>
                        <p className="text-sm text-gray-700">
                          {new Date(booking.check_in_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                          })} →{" "}
                          {new Date(booking.check_out_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                          })}
                        </p>
                        <p className="text-sm text-gray-700">
                          {booking.num_adults} adults · {booking.num_children} children · {booking.num_rooms} room(s)
                        </p>
                        <p className="text-green-700 font-semibold mt-1">
                          {booking.total_price} {booking.currency}
                        </p>
                      </div>
                    </div>
                  </Link>

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
    </>
  );
};

export default Profile;
