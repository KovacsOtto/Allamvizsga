import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "EUR");

  useEffect(() => {
    const stored = localStorage.getItem("pendingBooking");
    if (stored) {
      setBooking(JSON.parse(stored));
    } else {
      alert("No pending booking found.");
      navigate("/");
    }
    
      
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
    const userObj = JSON.parse(storedUser);
    setCardName(userObj.full_name  || "");
    }
  }, [navigate]);
  
  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);
  const exchangeRates = {
    EUR: 1,
    LEI: 4.5,
    HUF: 398.58
  };
  if (!booking) return null;

  const displayTotal = booking
  ? (booking.total_price * exchangeRates[currency]).toFixed(2)
  : "0.00"; 

if (!booking) return null;
   
  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill in all payment details.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });

      if (res.ok) {
        alert("Payment successful!");
        localStorage.removeItem("pendingBooking");
        navigate("/");
      } else {
        alert("Payment failed. Try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment error occurred.");
    }
  };

  if (!booking) return null;

  return (
    <>
      <Navbar currency={currency} setCurrency={setCurrency}/>
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Payment</h2>
        <p className="text-lg font-bold mb-6">
          Total to pay: {displayTotal} {currency}

        </p>

        <div className="space-y-4">
        <input
        type="text"
        placeholder="Cardholder Name"
        className="w-full border p-2 rounded mb-4"
        value={cardName}
        onChange={(e) => setCardName(e.target.value)}
        />
        <input
            type="text"
            placeholder="Card Number"
            className="w-full border p-2 rounded"
            maxLength={19}
            value={cardNumber}
            onChange={(e) => {
                let val = e.target.value.replace(/\D/g, ""); 
                val = val.slice(0, 16);
                const formatted = val.replace(/(.{4})/g, "$1 ").trim(); 
                setCardNumber(formatted);
            }}
            />
          <div className="flex space-x-2">
          <input
            type="text"
            placeholder="MM/YY"
            className="w-1/2 border p-2 rounded"
            maxLength={5}
            value={expiry}
            onChange={(e) => {
                let val = e.target.value;
                val = val.replace(/[^\d]/g, "");
                if (val.length >= 2) {
                val = val.slice(0, 2) + (val.length > 2 ? "/" + val.slice(2, 4) : "/");
                }
                setExpiry(val);
            }}
            />
            <input
              type="text"
              placeholder="CVC"
              className="w-1/2 border p-2 rounded"
              maxLength={3}
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
            />
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Pay Now
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
