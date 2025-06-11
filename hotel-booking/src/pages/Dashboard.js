import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { isLoggedIn, logout } from "../utils/auth";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import FilterSidebar from "../components/FilterSidebar";
import HotelMap from "../components/MapView";

const Dashboard = ({ currency, setCurrency }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [destId, setDestId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState([
    {
       startDate: new Date(),
       endDate: new Date(),
        key: "selection" 
    },
  ]);
  const [guests, setGuests] = useState({ adults: 1, children: 0, rooms: 1 });
  const [page, setPage] = useState(1);
  const [availableFilters, setAvailableFilters] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [recommendedHotels, setRecommendedHotels] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [fullHotelList, setFullHotelList] = useState([]);



  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!hasSearched && user?.id) {
      axios.get(`https://backend-519v.onrender.com/api/recommendations/${user.id}`)
        .then((res) => {
          console.log("Received recommendations:", res.data); 
          setRecommendedHotels(res.data.filter(h => h?.property?.id));
        })
        .catch((err) => console.error("Failed to load recommendations", err));
    }
  }, [hasSearched]);
  
  
  
  
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth");
    }
  }, [navigate]);
  useEffect(() => {
    if (destId) {
      setLoading(true);
      handleHotelSearch(activeFilters);
    }
  }, [page]);
  
  useEffect(() => {
  const savedSearch = localStorage.getItem("dashboardSearch");
  if (savedSearch) {
    const { query, destId, dates, guests } = JSON.parse(savedSearch);

    setQuery(query);
    setDestId(destId);

    const fixedDates = dates.map(d => ({
      ...d,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
    }));

    setDates(fixedDates);
    setGuests(guests);
  }
  }, []);
  useEffect(() => {
    if (!destId) return;

    const fetchFilters = async () => {
      try {
        const check_in = format(new Date(dates[0].startDate), "yyyy-MM-dd");
        const check_out = format(new Date(dates[0].endDate), "yyyy-MM-dd");

        const res = await axios.get("https://backend-519v.onrender.com/api/hotels/filters", {
          params: {
            dest_id: destId,
            search_type: "CITY",
            adults: guests.adults,
            children_age: guests.children > 0 ? Array(guests.children).fill(5).join(",") : "",
            room_qty: guests.rooms,
            arrival_date: check_in,       
            departure_date: check_out     
          },
        });


      console.log("Full filter API response:", res.data);
      setAvailableFilters(res.data.data?.filters || []);     
      } catch (err) {
        console.error("Failed to fetch filters", err);
      }
    };
    fetchFilters();
  }, [destId, guests]);
  
  const fetchAllHotelsForMap = async () => {
    if (!destId) return [];
  
    const check_in = format(new Date(dates[0].startDate), "yyyy-MM-dd");
    const check_out = format(new Date(dates[0].endDate), "yyyy-MM-dd");
  
    let collected = [];
    let currentPage = 1;
  
    while (true) {
      try {
        const res = await axios.get("https://backend-519v.onrender.com/api/hotels", {
          params: {
            dest_id: destId,
            check_in,
            check_out,
            adults: guests.adults,
            children: guests.children > 0 ? Array(guests.children).fill(5).join(",") : "",
            room_qty: guests.rooms,
            page_number: currentPage
          }
        });
  
        const batch = res.data?.data?.hotels || [];
        if (batch.length === 0) break;
  
        const hotelIds = batch.map(h => h?.property?.id).filter(Boolean);
        if (hotelIds.length === 0) break;
  
        const availabilityRes = await axios.get("https://backend-519v.onrender.com/api/hotels/available", {
          params: { hotelIds: hotelIds.join(","), check_in, check_out },
        });
  
        const availableIds = availabilityRes.data.available || [];
        const availableHotels = batch.filter(h => availableIds.includes(String(h.property.id)));
  
        collected.push(...availableHotels);
  
        const next = res.data?.data?.pagination?.next_page_number;
        if (!next) break;
  
        currentPage = next;
      } catch (err) {
        console.error("Failed to fetch hotels for map", err);
        break;
      }
    }
  
    console.log("Hotels collected for map:", collected.length);
    return collected;
  };
  
  
  const handleSearch = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`https://backend-519v.onrender.com/api/search?query=${value}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to fetch destinations");
    }
  };

  const updateGuestCount = (type, operation) => {
    setGuests((prev) => ({
      ...prev,
      [type]: operation === "increase"
        ? prev[type] + 1
        : Math.max(type === "rooms" ? 1 : 0, prev[type] - 1),  
    }));
  };
  const conversionRates = {
    USD: 1,
    EUR: 0.93,  
    HUF: 350,
    LEI: 4.5,
  };
  const convertPrice = (aedPrice) => {
      const usdPrice = aedPrice * 0.27; 
      const rate = conversionRates[currency] || 1;
      return (usdPrice * rate).toFixed(2);
    };
  const convertToAED = (localPrice) => {
    const rate = conversionRates[currency] || 1;
    const usd = localPrice / rate;
    const aed = usd / 0.27;
    return Math.round(aed);
  };
  const getNights = () => {
    const start = new Date(dates[0].startDate);
    const end = new Date(dates[0].endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  
  const handleHotelSearch = async (filters = activeFilters) => {
    setHasSearched(true);
    if (!destId) {
      alert("Please select a destination first.");
      return;
    }

    localStorage.setItem("dashboardSearch", JSON.stringify({
      query,
      destId,
      dates,
      guests,
    }));

    setLoading(true);
    const check_in = format(new Date(dates[0].startDate), "yyyy-MM-dd");
    const check_out = format(new Date(dates[0].endDate), "yyyy-MM-dd");

    const filterParams = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (key === "price" && values.length === 2) {
        filterParams.price_min = convertToAED(values[0]);
        filterParams.price_max = convertToAED(values[1]);
      } else if (Array.isArray(values) && values.length > 0) {
        const fieldMap = {
          "review_score": "review_score_bucket",
          "property_type": "property_type_id",
          "popular": "popular_amenities",
        };
        const mappedKey = fieldMap[key] || key;
        filterParams.categories_filter = (filterParams.categories_filter || []).concat(
          values.map(v => `${mappedKey}:${v}`)
        );
      }
    });

    if (filterParams.categories_filter) {
      filterParams.categories_filter = filterParams.categories_filter.join(",");
    }

    try {
      let collectedHotels = [];
      let currentPage = 1;
      const maxPages = 20;
      while (collectedHotels.length < page * 10&& currentPage <= maxPages) {
        const res = await axios.get("https://backend-519v.onrender.com/api/hotels", {
          params: {
            dest_id: destId,
            check_in,
            check_out,
            adults: guests.adults,
            children: guests.children > 0 ? Array(guests.children).fill(5).join(",") : "",
            room_qty: guests.rooms,
            page_number: currentPage,
            ...filterParams,
          },
        });

        const data = res.data?.data;
        if (!data?.hotels || data.hotels.length === 0) break;

        const hotelsBatch = data.hotels;
        const hotelIds = hotelsBatch.map(h => h?.property?.id).filter(Boolean);
        if (hotelIds.length === 0) break;

        const availabilityRes = await axios.get("https://backend-519v.onrender.com/api/hotels/available", {
          params: { hotelIds: hotelIds.join(","), check_in, check_out },
        });

        const availableIds = availabilityRes.data.available || [];
        let filteredHotels = hotelsBatch.filter(h => availableIds.includes(String(h.property.id)));

        const reviewFilter = filters.reviewscorebuckets;
        if (reviewFilter?.length > 0) {
          const minScore = Math.min(...reviewFilter.map(code => parseInt(code) / 10));
          filteredHotels = filteredHotels.filter(hotel => typeof hotel?.property?.reviewScore === "number" && hotel.property.reviewScore >= minScore);
        }

        collectedHotels.push(...filteredHotels);

        if (!data.pagination?.next_page_number) break;
        currentPage++;
      }

      const startIdx = (page - 1) * 10;
      const paginated = collectedHotels.slice(startIdx, startIdx + 10);
      setHotels(paginated);
      setFullHotelList(collectedHotels);
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    }

    setLoading(false);
  };
  
  useEffect(() => {
    if (!destId) return;
  
    fetchAllHotelsForMap()
      .then(fullHotelList => setFullHotelList(fullHotelList))
      .catch(console.error);
  }, [destId, guests, dates]);
  
  
  

  return (
    <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-6">
      <div className="relative w-full max-w-5xl h-[400px] mb-4 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 z-0">
        <HotelMap
            hotels={fullHotelList}
            currency={currency}
            getNights={getNights}
            convertPrice={convertPrice}
            navigate={navigate}
            guests={guests}
            dates={dates}
            withCards
          />        </div>
      </div>

      <div className="w-full max-w-5xl bg-white shadow-lg rounded-3xl px-6 py-4 flex flex-wrap items-center justify-between space-x-4 -mt-16 z-10 relative">
          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-semibold text-gray-600">Location</label>
            <input
              type="text"
              placeholder="Where are you going?"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full mt-1 px-2 py-1 text-sm text-gray-800 border-none focus:ring-0"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 bg-white border rounded shadow max-h-48 overflow-y-auto w-[200px]">
                {suggestions.map((sug) => (
                  <li
                    key={sug.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setQuery(sug.name);
                      setDestId(sug.id);
                      setSuggestions([]);
                    }}
                  >
                    {sug.name}, {sug.country}
                  </li>
                ))}
              </ul>
            )}
          </div>


        <div className="relative flex-1 min-w-[180px]">
          <label className="text-sm font-semibold text-gray-600">Check In – Out</label>
          <div
            className="mt-1 text-sm flex items-center gap-1 cursor-pointer"
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            {format(dates[0].startDate, "MM/dd/yyyy")} – {format(dates[0].endDate, "MM/dd/yyyy")}
          </div>

          {calendarOpen && (
            <div className="absolute top-14 z-50 bg-white shadow-lg border rounded-lg">
              <DateRange
                locale={enGB}
                editableDateInputs={true}
                onChange={(item) => setDates([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={dates}
              />
            </div>
          )}
        </div>


        <div className="relative flex-1 min-w-[180px]">
          <label className="text-sm font-semibold text-gray-600">Guests</label>
          <div
            className="mt-1 text-sm flex items-center gap-1 cursor-pointer"
            onClick={() => setGuestOpen(!guestOpen)}
          >
            {guests.adults} adults · {guests.children} children · {guests.rooms} room
          </div>

          {guestOpen && (
            <div className="absolute z-50 mt-2 bg-white border border-gray-300 shadow-lg rounded-lg p-4 w-64">
              {["adults", "children", "rooms"].map((type) => (
                <div key={type} className="flex justify-between items-center mb-2">
                  <span className="capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 border border-gray-300 rounded"
                      onClick={() => updateGuestCount(type, "decrease")}
                    >
                      −
                    </button>
                    <span>{guests[type]}</span>
                    <button
                      className="px-2 py-1 border border-gray-300 rounded"
                      onClick={() => updateGuestCount(type, "increase")}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="mt-2 w-full bg-blue-500 text-white rounded-lg py-1"
                onClick={() => setGuestOpen(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>
            <div>
            <button
              onClick={() => {
                setPage(1);
                handleHotelSearch();
              }}
              className="w-12 h-12 rounded-full bg-[#1baf65] text-white flex items-center justify-center hover:bg-green-600"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                />
              </svg>
            </button>
          </div>
        </div>


  
      <div className="flex w-full max-w-7xl mx-auto">
        <div >
            <FilterSidebar
              filters={availableFilters}
              currency={currency}
              conversionRates={conversionRates}
              onApplyFilters={(filters) => {
                setActiveFilters(filters);
                setPage(1);
                handleHotelSearch(filters);
              }}
            />
        </div>
  
        <div className="flex-1 p-1">
          {loading ? (
            <p className="text-blue-600 text-lg text-center">Loading hotels...</p>
          ) : hotels.length > 0 ? (
            hotels.map((hotel) => (
              <div
              key={hotel.property.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer max-w-3xl mx-auto mb-6"
              onClick={() => {
                const params = new URLSearchParams({
                  check_in: format(dates[0].startDate, "yyyy-MM-dd"),
                  check_out: format(dates[0].endDate, "yyyy-MM-dd"),
                  adults: guests.adults,
                  children: guests.children,
                  room_qty: guests.rooms,
                  currency
                }).toString();
                navigate(`/hotel/${hotel.property.id}?${params}`);
              }}
            >
            <img
                src={hotel.property.photoUrls?.[0] || "https://via.placeholder.com/150"}
                alt={hotel.property.name}
                className="w-full h-56 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-800">{hotel.property.name}</h3>
                  <span className="text-green-600 text-lg font-semibold">
                    {convertPrice(hotel.property.priceBreakdown.grossPrice.value * getNights() * guests.rooms)} {currency}
                    {hotel.accessibilityLabel?.toLowerCase().includes('free cancellation') && (
              <div className="text-green-500 text-xs font-medium">Free cancellation</div>
            )}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-2">{hotel.property.wishlistName || hotel.city}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{guests.rooms} room · {getNights()} night</span>
                  <span className="text-yellow-600 font-medium">⭐ {hotel.property.reviewScore} ({hotel.property.reviewCount})</span>
                </div>
              </div>
            </div>

            ))
          ) : recommendedHotels.length > 0 ?  (
              <div className="mt-10">
              <div className="flex justify-center mt-8">
              <div className="bg-white border border-yellow-300 shadow-md rounded-2xl px-6 py-4 flex items-center gap-3 max-w-2xl w-full mb-6">
                  <span className="text-2xl animate-pulse">🌟</span>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">
                    Recommended Hotels Based on Your Bookings
                  </h2>
                </div>
              </div>

              {recommendedHotels.map((hotel, index) => {
              const prop = hotel.property;
              if (!prop || !prop.id || !prop.name) return null;

              const price =
                prop?.priceBreakdown?.grossPrice?.value && getNights()
                  ? convertPrice(prop.priceBreakdown.grossPrice.value * getNights() * guests.rooms)
                  : "N/A";

                  return (
                    <div
                      key={prop.id || index}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer max-w-3xl mx-auto mb-4"
                      onClick={() => {
                        const params = new URLSearchParams({
                          check_in: format(dates[0].startDate, "yyyy-MM-dd"),
                          check_out: format(dates[0].endDate, "yyyy-MM-dd"),
                          adults: guests.adults,
                          children: guests.children,
                          room_qty: guests.rooms,
                        }).toString();
                        navigate(`/hotel/${prop.id}?${params}`, {
                          state: {
                            recommendedPrice: price,
                          },
                        });
                      }}
                    >
                      <img
                        src={prop.photoUrls?.[0] || "https://via.placeholder.com/150"}
                        alt={prop.name}
                        className="w-full h-56 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-800">{prop.name}</h3>
                          <span className="text-green-600 text-lg font-semibold">
                            {price} {currency}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{prop.wishlistName || prop.city || "Location unavailable"}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{guests.rooms} room · {getNights()} night</span>
                          {typeof prop.reviewScore === "number" && (
                            <span className="text-yellow-600 font-medium">
                              ⭐ {prop.reviewScore} ({prop.reviewCount} reviews)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
            })}



            </div>
          ) : (
            <p className="text-gray-500 text-lg text-center">No hotels found.</p>
          )}
  
          {hotels.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
                disabled={page === 1}
                onClick={() => {
                  setPage((prev) => prev - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Previous
              </button>
              <span className="text-lg font-semibold">{page}</span>
              <button
                className="px-4 py-2 bg-yellow-400 text-black rounded"
                onClick={() => {
                  setPage((prev) => prev + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  
};

export default Dashboard;
