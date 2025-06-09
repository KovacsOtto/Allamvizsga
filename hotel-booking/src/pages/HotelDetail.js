import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import SuccessPopup from "../components/SuccessPopup"; 
import { useNavigate } from "react-router-dom";

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
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const REVIEWS_PER_PAGE = 10;
  const [averageScore, setAverageScore] = useState(null);
  const [showAttractionModal, setShowAttractionModal] = useState(false);
  const [selectedAttractions, setSelectedAttractions] = useState([]);
  const [showAttractionSuccess, setShowAttractionSuccess] = useState(false);
  const [infoAttraction, setInfoAttraction] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAttractionGallery, setShowAttractionGallery] = useState(false);
  const [selectedAttractionIndex, setSelectedAttractionIndex] = useState(0);
  const recommendedPrice = location.state?.recommendedPrice || null;
  
  const searchParams = new URLSearchParams(location.search);
  const check_in = searchParams.get("check_in");
  const check_out = searchParams.get("check_out");
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const room_qty = searchParams.get("room_qty");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`https://backend-519v.onrender.com/api/hotels/reviews/${id}?page=${reviewPage}`);
        if (res.data.success && Array.isArray(res.data.reviews)) {
          setReviews(res.data.reviews);
          setReviewTotal(res.data.totalCount || 0);
          setAverageScore(res.data.averageScore || null);
        } else {
          setReviews([]);
          setReviewTotal(0);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setReviews([]);
      }
    };
    fetchReviews();
  }, [id, reviewPage]);
  
  
  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  useEffect(() => {

    const fetchHotelDetails = async () => {
      try {
        const res = await axios.get(`https://backend-519v.onrender.com/api/hotels/details/${id}`, {
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
        const res = await axios.get(`https://backend-519v.onrender.com/api/hotels/photos/${id}`);
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
        const response = await axios.get(`https://backend-519v.onrender.com/api/hotels/description/${id}`);
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
  }, [id, check_in, check_out, adults, children, room_qty, currency]);


  useEffect(() => {
    if (hotel?.city || hotel?.city_name || hotel?.city_name_translated) {
      const rawCity = hotel.city || hotel.city_name || hotel.city_name_translated;
      const cityQuery = rawCity.split(":")[0];
      console.log("Város a lekéréshez:", cityQuery);
  
      axios.get("https://backend-519v.onrender.com/api/attractions/by-city", {
        params: { city: cityQuery }
      })
        .then(res => {
          console.log("Látnivalók:", res.data.data);
          
          setAttractions(res.data.data);
        })
        .catch(err => console.error("Attraction fetch failed", err));
    }
    const handleAddToFavorites = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) return alert("Please log in to save favorites.");
    
      try {
        await axios.post("https://backend-519v.onrender.com/api/favorites", {
          user_id: user.id,
          hotel_id: id,
          hotel_name: hotel.hotel_name,
          hotel_address: hotel.address,
          hotel_image_url: photos?.[0]?.url || "",
        });
    
        alert("Hotel saved to favorites!");
      } catch (err) {
        console.error("Failed to add favorite:", err);
        alert("Failed to save favorite.");
      }
    };
    
  }, [hotel]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id || !hotel?.hotel_id) return;
  
    axios
      .get(`https://backend-519v.onrender.com/api/favorites/${user.id}`)
      .then((res) => {
        const isFav = res.data.some((fav) => fav.hotel_id == hotel.hotel_id);
        setIsFavorite(isFav);
      })
      .catch((err) => {
        console.error("Could not load favorites", err);
      });
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
  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
  const calculateTotalPrice = () => {
    const base = Number(hotel?.product_price_breakdown?.gross_amount?.value);
    if (!base || isNaN(base)) {
      console.warn("❗ Nem sikerült kinyerni az árat:", hotel?.product_price_breakdown);
      return null;
    }
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)) || 1;
    const hotelCost = base * room_qty * nights * exchangeRates[currency];
    const attractionCost = calculateAttractionTotal();

    return (hotelCost + attractionCost).toFixed(2);
  };
  const handleAttractionInfoClick = async (slug) => {
    try {
      const currencyCode = currency === "LEI" ? "RON" : currency;
      const res = await axios.get("https://backend-519v.onrender.com/api/attractions/details", {
        params: {
          slug,
          currency_code: currencyCode
        }
      });
      console.log("Slug:", slug);
      console.log("Axios full response:", res);
      console.log("Extracted data:", res.data?.data);
      if (res.data && res.data.data) {
        setInfoAttraction(res.data.data);
        setShowInfoModal(true);
      } else {
        alert("No details available.");
      }
    } catch (err) {
      console.error("Attraction details fetch failed:", err.response?.data || err.message || err);
    }
    
  };

  const calculateAttractionTotal = () => {
    return selectedAttractions.reduce((sum, attr) => {
      const price = attr.representativePrice?.publicAmount || 0;
      return sum + price;
    }, 0) * exchangeRates[currency];
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
            <div className="mt-4 flex flex-wrap gap-3">
            {hotel.property_highlight_strip.map((item, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 px-4 py-2 text-sm rounded-full border border-green-300"
              >
                ✔ {item.name}
              </span>
            ))}
          </div>

            
        </div>
          
        <div className="flex flex-col-reverse items-end justify-end w-1/3">
  

          <button
            onClick={async () => {
              const user = JSON.parse(localStorage.getItem("user"));
              if (!user?.id) return alert("Please log in to use favorites.");
            
              try {
                if (isFavorite) {
                  await axios.delete(`https://backend-519v.onrender.com/api/favorites/${user.id}/${id}`);
                  setIsFavorite(false);
                } else {
                  await axios.post("https://backend-519v.onrender.com/api/favorites", {
                    user_id: user.id,
                    hotel_id: id,
                    hotel_name: hotel.hotel_name,
                    hotel_address: hotel.address,
                    hotel_image_url: photos?.[0]?.url || ""
                  });
                  setIsFavorite(true);
                }
              } catch (err) {
                console.error("Favorite toggle error:", err);
                alert("Something went wrong.");
              }
            }}
            
            className="mt-4 transform hover:scale-110"
            title={isFavorite ? "Saved to Favorites" : "Add to Favorites"}
          >
            {isFavorite ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-green-600 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                        2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 
                        4.5 2.09C13.09 3.81 14.76 3 16.5 3 
                        19.58 3 22 5.42 22 8.5c0 
                        3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-green-600 stroke-current fill-transparent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
                    2 8.5 2 5.42 4.42 3 7.5 3c1.74 
                    0 3.41 0.81 4.5 2.09C13.09 
                    3.81 14.76 3 16.5 3 19.58 3 
                    22 5.42 22 8.5c0 3.78-3.4 
                    6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            )}
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow mt-4"
            onClick={() => setShowReservationModal(true)}
          >
            ReserV now
          </button>
          <p className="text-lg mt-4">
          ⭐ {averageScore ? averageScore.toFixed(1) : "–"} · {reviewTotal} reviews
         </p>
          <p className="text-lg text-green-600 font-bold">
          {calculateTotalPrice() || recommendedPrice || "–"} {currency}
          </p>
          <p className="text-sm text-gray-500">
            ({room_qty} room{room_qty > 1 ? "s" : ""})
          </p>
        </div>

          


        </div>
        {attractions.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Nearby Attractions</h2>
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {attractions.map((a, index) => (
                  <div key={index} className="relative min-w-[250px] bg-white rounded-lg shadow p-2">
                     <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAttractionInfoClick(a.slug);
                      }}
                      className="absolute top-2 right-2 text-blue-600 hover:text-blue-800"
                      title="More Info"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
                      </svg>
                    </button>
                    <img src={a.primaryPhoto?.small} alt={a.name} className="w-full h-40 object-cover object-center rounded" />
                    <h3 className="text-lg font-semibold mt-2">{a.name}</h3>
                    <p className="text-sm text-gray-500">{a.shortDescription}</p>
                    <p className="text-green-600 font-semibold mt-1">
                    {(a.representativePrice?.publicAmount * exchangeRates[currency]).toFixed(2)} {currency}
                  </p>                  
                  </div>
                ))}
              </div>
            </div>
          )}
          {reviews.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Hotel Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow">
                  <p className="font-semibold text-lg">{review.title}</p>
                  <p className="text-gray-700 mt-1">
                    👍 {review.pros || "–"}<br />
                    👎 {review.cons || "–"}
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-2 text-gray-500">
                    <img
                      src={review.author?.avatar}
                      alt="avatar"
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{review.author?.name || "Anonymous"}</span>
                    <span>⭐ {review.average_score?.toFixed(1) || "–"}/5</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setReviewPage((prev) => Math.max(prev - 1, 1))}
                disabled={reviewPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {reviewPage} of {Math.ceil(reviewTotal / REVIEWS_PER_PAGE)}
              </span>
              <button
                onClick={() =>
                  setReviewPage((prev) =>
                    prev < Math.ceil(reviewTotal / REVIEWS_PER_PAGE)
                      ? prev + 1
                      : prev
                  )
                }
                disabled={reviewPage >= Math.ceil(reviewTotal / REVIEWS_PER_PAGE)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
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
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
              onClick={() => setShowReservationModal(false)}
            >
              ✖
            </button>
            <h2 className="text-2xl font-semibold mb-4">  Confirm Reservation</h2>
            <div className="space-y-2 text-sm text-gray-800">
              <p><strong>Hotel:</strong> {hotel.hotel_name}</p>
              <p><strong>Address:</strong> {hotel.address}</p>
              <p><strong>Check-in:</strong> {check_in}</p>
              <p><strong>Check-out:</strong> {check_out}</p>
              <p><strong>Adults:</strong> {adults}</p>
              <p><strong>Children:</strong> {children}</p>
              <p><strong>Rooms:</strong> {room_qty}</p>
              <p><strong>Total Hotel Price:</strong> {(hotel?.product_price_breakdown?.gross_amount?.value * room_qty * nights * exchangeRates[currency]).toFixed(2)} {currency}</p>
              <p><strong>Activities Price:</strong> {calculateAttractionTotal().toFixed(2)} {currency}</p>
              <p><strong>Total Price:</strong> {calculateTotalPrice()} {currency}</p>
            </div>
            <button
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
              onClick={() => {
                const user = JSON.parse(localStorage.getItem("user"));
                if (!user) {
                  alert("You must be logged in to proceed to payment.");
                  return;
                }
                let country = hotel.country_trans || "";

                const bookingData = {
                  user_id: user.id,
                  hotel_id: hotel.hotel_id || id,
                  hotel_name: hotel.hotel_name,
                  hotel_address: `${hotel.address}${country ? `, ${country}` : ""}`,
                  check_in_date: check_in,
                  check_out_date: check_out,
                  num_adults: adults,
                  num_children: children,
                  num_rooms: room_qty,
                  total_price: parseFloat(calculateTotalPrice()),
                  currency,
                  hotel_image_url: photos?.[0]?.url || null,
                  activities: selectedAttractions.map((a) => ({
                    name: a.name,
                    price: a.representativePrice?.publicAmount,
                    image: a.primaryPhoto?.small,
                    slug: a.slug
                  }))
                };

                localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
                setShowReservationModal(false);
                navigate("/payment");
              }}
            >
              Continue to Payment
            </button>

            {showAttractionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
                  onClick={() => setShowAttractionModal(false)}
                >
                  ✖
                </button>
                <h2 className="text-2xl font-semibold mb-4">Select Activities</h2>

                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                  {attractions.map((attr, index) => (
                    <div
                      key={index}
                      className={`relative border p-4 rounded-lg cursor-pointer transition ${
                        selectedAttractions.includes(attr) ? "border-green-600 bg-green-50" : "border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedAttractions((prev) =>
                          prev.includes(attr)
                            ? prev.filter((a) => a !== attr)
                            : [...prev, attr]
                        );
                      }}
                    >
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAttractionInfoClick(attr.slug);
                      }}
                      className="absolute top-2 right-2 text-blue-600 hover:text-blue-800"
                      title="More Info"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
                      </svg>
                    </button>
                      <h3 className="font-semibold text-lg">{attr.name}</h3>
                      <p className="text-sm text-gray-600">{attr.shortDescription}</p>
                      {attr.primaryPhoto?.small && (
                        <img
                          src={attr.primaryPhoto.small}
                          alt={attr.name}
                          className="w-full h-32 object-cover rounded mt-2"
                        />
                      )}
                      <p className="text-green-700 font-semibold mt-2">
                        {(attr.representativePrice?.publicAmount * exchangeRates[currency]).toFixed(2)} {currency}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                  onClick={() => {
                    console.log("Selected attractions:", selectedAttractions);
                    setShowAttractionModal(false);
                    setShowAttractionSuccess(true);
                  }}
                >
                  Save Selected Activities
                </button>
              </div>
            </div>
          )}

            <button
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
            onClick={() => setShowAttractionModal(true)}
          >
            Add Activities to Your Booking
          </button>

          </div>
          
        </div>
      )}
      {showPopup && <SuccessPopup onClose={() => setShowPopup(false)} />}

      {showAttractionSuccess && (
        <SuccessPopup
          onClose={() => setShowAttractionSuccess(false)}
          message="Activities added to your booking"
        />
      )}
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

export default HotelDetail;
