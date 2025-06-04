import { useState, useEffect } from "react";

const convertToAED = (localPrice, currency, conversionRates) => {
  const rate = conversionRates[currency] || 1;
  const usd = localPrice / rate;
  return Math.round(usd / 0.27);
};

const convertFromAED = (aedPrice, currency, conversionRates) => {
  const usd = aedPrice * 0.27;
  const rate = conversionRates[currency] || 1;
  return Math.round(usd * rate);
};
const currencyMaxMap = {
  USD: 10000,
  EUR: 1000,
  LEI: 4500,
  HUF: 400000,
};


const FilterSidebar = ({ filters = [], onApplyFilters, currency, conversionRates }) => {
  const [selectedFilters, setSelectedFilters] = useState({});
  const [localMaxPrice, setLocalMaxPrice] = useState(1000);
  const [sliderMax, setSliderMax] = useState(1000);

  const defaultMax = currencyMaxMap[currency] || 3000;

  useEffect(() => {
    if (currency === "HUF") {
      setSliderMax(800000);
    } else if (currency === "LEI" || currency === "EUR") {
      setSliderMax(8000);
    } else {
      setSliderMax(1000);
    }
  }, [currency]);

  const handleCheckboxChange = (filterKey, value) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[filterKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues };
    });
  };

  const relevantTitles = [
    "Popular filters",
    "Review score",
    "Property type",
    "Distance from city centre"
  ];

  const filtered = filters.filter((f) => relevantTitles.includes(f.title));

  const handleApply = () => {
    const convertedFilters = { ...selectedFilters };

    if (localMaxPrice !== null) {
      const minAED = convertToAED(0, currency, conversionRates);
      const maxAED = convertToAED(localMaxPrice, currency, conversionRates);
      convertedFilters.price = [minAED, maxAED];
    }

    onApplyFilters(convertedFilters);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 text-blue-700">Filters</h2>

      {filtered.length === 0 ? (
        <p>No filters available.</p>
      ) : (
        filtered.map((filter) => (
          <div key={filter.title} className="mb-4">
            <p className="font-semibold text-gray-700">{filter.title}</p>

            {filter.options?.map((option) => (
              <label key={option.genericId} className="block text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedFilters[filter.field]?.includes(option.genericId) || false}
                  onChange={() => handleCheckboxChange(filter.field, option.genericId)}
                />
                {option.title} ({option.countNotAutoextended})
              </label>
            ))}
          </div>
        ))
      )}

      <div className="mb-4">
        <p className="font-semibold text-gray-700">Price range</p>
        <input
          type="range"
          min="0"
          max={defaultMax}
          value={selectedFilters.price?.[1] || defaultMax}
          onChange={(e) =>
            setSelectedFilters(prev => ({
              ...prev,
              price: [0, parseInt(e.target.value, 10)]
            }))
          }
        />
        <p className="text-sm text-gray-600 mt-1">
          Up to {selectedFilters.price?.[1] || defaultMax} {currency}
        </p>
      </div>

      <button
        onClick={handleApply}
        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
