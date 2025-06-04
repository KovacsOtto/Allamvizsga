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
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);
  const [guests, setGuests] = useState({ adults: 1, children: 0, rooms: 1 });
  const [page, setPage] = useState(1);
  const [availableFilters, setAvailableFilters] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});

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

        const res = await axios.get("http://localhost:5000/api/hotels/filters", {
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
  
  
  
  const handleSearch = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/search?query=${value}`);
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
        const res = await axios.get("http://localhost:5000/api/hotels", {
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

        const availabilityRes = await axios.get("http://localhost:5000/api/hotels/available", {
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
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    }

    setLoading(false);
  };
  
  
  
  

  return (
    <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-3xl flex items-center gap-4 border-2 border-yellow-500">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Enter destination..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-6 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 bg-white shadow-md rounded-lg mt-1 max-h-40 overflow-y-auto z-50">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => {
                    setQuery(suggestion.name);
                    setDestId(suggestion.id);
                    setSuggestions([]);
                  }}
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-lg"
                >
                  {suggestion.name}, {suggestion.country}
                </li>
              ))}
            </ul>
          )}
        </div>
  
        <div
          className="relative flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer text-sm"
          onClick={() => setCalendarOpen(!calendarOpen)}
        >
          <span role="img" aria-label="calendar">📅</span>
          {`${format(dates[0].startDate, "MM/dd/yyyy")} — ${format(dates[0].endDate, "MM/dd/yyyy")}`}
        </div>
        {calendarOpen && (
          <div className="absolute top-14 left-[37%] mt-32 bg-white shadow-lg rounded-lg border border-gray-300 overflow-hidden">
            <DateRange
              locale={enGB}
              editableDateInputs={true}
              onChange={(item) => setDates([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dates}
              className="shadow-lg border border-gray-300 rounded-lg"
            />
          </div>
        )}
  
        <div
          className="relative flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer text-sm"
          onClick={() => setGuestOpen(!guestOpen)}
        >
          <span role="img" aria-label="guests">👤</span>
          {`${guests.adults} adults · ${guests.children} children · ${guests.rooms} room`}
        </div>
        {guestOpen && (
          <div className="absolute top-14 left-[55%] mt-32 bg-white p-4 shadow-lg rounded-lg border border-gray-300 z-50 w-64">
            {["adults", "children", "rooms"].map((type) => (
              <div key={type} className="flex justify-between items-center mb-2">
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 border border-gray-300 rounded" onClick={() => updateGuestCount(type, "decrease")}>-</button>
                  <span>{guests[type]}</span>
                  <button className="px-2 py-1 border border-gray-300 rounded" onClick={() => updateGuestCount(type, "increase")}>+</button>
                </div>
              </div>
            ))}
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg mt-2" onClick={() => setGuestOpen(false)}>Done</button>
          </div>
        )}
  
        <button
          className="px-6 py-2 bg-green-700 text-white rounded-lg"
          onClick={() => {
            setPage(1);
            handleHotelSearch();
          }}
        >
          Search
        </button>
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
                className="bg-white shadow-lg rounded-lg p-2 mb-4 flex items-center gap-4"
                onClick={() => {
                  const params = new URLSearchParams({
                    check_in: format(dates[0].startDate, "yyyy-MM-dd"),
                    check_out: format(dates[0].endDate, "yyyy-MM-dd"),
                    adults: guests.adults,
                    children: guests.children,
                    room_qty: guests.rooms,
                  }).toString();
                  navigate(`/hotel/${hotel.property.id}?${params}`);
                }}
              >
                <img
                  src={hotel.property.photoUrls?.[0] || "https://via.placeholder.com/150"}
                  alt={hotel.property.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex flex-1 justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{hotel.property.name}</h3>
                    <p className="text-sm text-gray-600">{hotel.property.wishlistName || "Location Unavailable"}</p>
                    {hotel.accessibilityLabel && (
                      <p className="text-xs text-gray-400 mt-1">{hotel.accessibilityLabel}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <p className="text-green-600 font-bold text-lg">
                      {convertPrice(hotel.property.priceBreakdown.grossPrice.value * getNights() * guests.rooms)} {currency}
                    </p>
                    <p className="text-sm text-gray-500">
                      ({guests.rooms} room{guests.rooms > 1 ? "s" : ""} · {getNights()} night{getNights() > 1 ? "s" : ""})
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      ⭐ {hotel.property.reviewScore} ({hotel.property.reviewCount} reviews)
                    </p>
                  </div>
                </div>
              </div>
            ))
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
