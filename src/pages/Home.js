import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import "../assets/styles/Home.css";

const libraries = ["places"]; // ✅ Sabit array olarak tanımlandı

const Home = () => {
  const navigate = useNavigate(); // ✅ useNavigate hook'u

  const [pickupOffice, setPickupOffice] = useState("");
  const [returnOffice, setReturnOffice] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [suggestedOffices, setSuggestedOffices] = useState([]);
  const [isApiLoaded, setIsApiLoaded] = useState(false); // ✅ API'nin yüklendiğini kontrol eden state

  // 🛠️ Eksik olan state'leri ekledim
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const pickupRef = useRef(null);
  const returnRef = useRef(null);

  useEffect(() => {
    if (isApiLoaded) {
      setupAutocomplete();
    }
  }, [isApiLoaded]); // ✅ API yüklenince çalıştır

  // ✅ checkUserLogin fonksiyonunu yukarıya taşıdık
  const checkUserLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/user-info", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.city) {
        setIsLoggedIn(true);
        const cityLocation = await fetchCityCoordinates(data.city);
        setUserLocation(cityLocation);
        fetchNearbyOffices(cityLocation.lat, cityLocation.lng);
      } else {
        requestLocationPermission();
      }
    } catch (error) {
      console.error("Kullanıcı oturumu kontrol edilemedi:", error);
      requestLocationPermission();
    }
  };

  // useEffect içinde sadece checkUserLogin çağırılıyor
  useEffect(() => {
    checkUserLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupAutocomplete = () => {
    if (window.google) {
      const pickupAutocomplete = new window.google.maps.places.Autocomplete(
        pickupRef.current,
        { types: ["geocode"] }
      );
      const returnAutocomplete = new window.google.maps.places.Autocomplete(
        returnRef.current,
        { types: ["geocode"] }
      );

      pickupAutocomplete.addListener("place_changed", () => {
        const place = pickupAutocomplete.getPlace();
        setPickupOffice(place.formatted_address || place.name);
      });

      returnAutocomplete.addListener("place_changed", () => {
        const place = returnAutocomplete.getPlace();
        setReturnOffice(place.formatted_address || place.name);
      });
    }
  };

  const handleRent = async () => {
    if (!pickupOffice || !returnOffice || !pickupDate || !returnDate) {
      alert("Lütfen tüm alanları doldurun!");
      return;
    }

    const rentData = {
      pickup_office: pickupOffice,
      return_office: returnOffice,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      return_date: returnDate,
      return_time: returnTime,
    };

    try {
      const response = await fetch("http://localhost:5000/api/rent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rentData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Araç başarıyla kiralandı!");
        navigate("/search-results", { state: rentData }); // ✅ Form verilerini SearchResults sayfasına gönderiyoruz
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Kiralama hatası:", error);
    }
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          const browserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(browserLocation);
          fetchNearbyOffices(browserLocation.lat, browserLocation.lng);
        },
        () => {
          console.warn("Konum izni reddedildi.");
        }
      );
    }
  };

  useEffect(() => {
    if (isApiLoaded && userLocation) {
      fetchNearbyOffices(userLocation.lat, userLocation.lng);
    }
  }, [isApiLoaded, userLocation]);

  const fetchCityCoordinates = async (city) => {
    const cityCoordinates = {
      Istanbul: { lat: 41.0151, lng: 28.9795 },
      Ankara: { lat: 39.9208, lng: 32.8541 },
      Izmir: { lat: 38.4192, lng: 27.1287 },
      Antalya: { lat: 36.8969, lng: 30.7133 },
    };
    return cityCoordinates[city] || { lat: 38.4192, lng: 27.1287 };
  };


  const fetchNearbyOffices = async (lat, lng) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error("Google API henüz yüklenmedi!");
      return;
    }

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    const request = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: 30000, // 30 KM içinde ara
      keyword: "Avis",
      type: "Avis Rent A Car", // "car_rental" yerine "establishment" kullan
    };

    service.nearbySearch(request, async (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        let officePromises = results.map((place) => {
          return new Promise((resolve) => {
            service.getDetails(
              { placeId: place.place_id },
              (details, status) => {
                if (
                  status === window.google.maps.places.PlacesServiceStatus.OK
                ) {
                  const placeLat = place.geometry.location.lat();
                  const placeLng = place.geometry.location.lng();
                  const distance = calculateDistance(
                    lat,
                    lng,
                    placeLat,
                    placeLng
                  );

                  resolve({
                    name: details.name,
                    address: details.formatted_address || place.vicinity,
                    lat: placeLat,
                    lng: placeLng,
                    distance: distance.toFixed(2), // Mesafeyi km cinsinden kaydet
                    phone: details.formatted_phone_number || "Bilinmiyor", // 📞 Telefon bilgisini çek
                    hours: details.opening_hours
                      ? details.opening_hours.weekday_text // ⏰ Çalışma saatlerini dizi olarak kaydet
                      : "Bilinmiyor",
                  });
                } else {
                  resolve(null);
                }
              }
            );
          });
        });

        const offices = (await Promise.all(officePromises))
          .filter((office) => office !== null)
          .filter((office) => office.name.includes("Avis")) // ✅ Sadece "Avis" içerenleri tut
          .filter((office) => office.distance <= 30) // ✅ Sadece 30 km içindeki ofisleri al
          .sort((a, b) => a.distance - b.distance); // ✅ Mesafeye göre sırala

        setSuggestedOffices(offices);
      } else {
        console.error("Yakın ofisler alınamadı! Hata kodu:", status);
      }
    });
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      console.error("🚨 HATA: Geçersiz koordinatlar!", lat1, lng1, lat2, lng2);
      return 9999; // Eğer hata varsa büyük bir mesafe dön
    }

    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    console.log(
      `📏 Hesaplanan mesafe: ${distance.toFixed(
        2
      )} km (lat1: ${lat1}, lng1: ${lng1}, lat2: ${lat2}, lng2: ${lng2})`
    );

    return distance;
  };

  return (
    <div>
      <Navbar />

      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} // ✅ API Key .env dosyasından çekiliyor
        libraries={libraries}
        onLoad={() => setIsApiLoaded(true)}
      >
        {isApiLoaded ? (
          <>
            {/* Araç Kirala Kısmı */}
            <section className="rent-section bg-dark text-white py-4">
              <div className="container">
                <h2 className="mb-4">Araç Kirala</h2>
                <div className="d-flex align-items-center justify-content-between rent-row">
                  {/* Teslim Alma Ofisi */}
                  <div className="rent-item with-divider">
                    <label className="form-label">Teslim Alma Ofisi</label>
                    <div className="form-group position-relative">
                      <Autocomplete
                        options={{
                          types: ["establishment"], 
                          componentRestrictions: { country: "TR" }, 
                        }}
                      >
                        <input
                          type="text"
                          className="form-control modern-input"
                          placeholder="Alış Ofisi Seçiniz"
                          ref={pickupRef}
                          value={pickupOffice}
                          onChange={(e) => setPickupOffice(e.target.value)}
                        />
                      </Autocomplete>
                      <button type="button" className="btn btn-find-location">
                        <i className="bi bi-crosshair"></i>
                      </button>
                    </div>
                  </div>

                  {/* Teslim Alma Tarihi ve Saati */}
                  <div className="rent-item with-divider">
                    <label className="form-label">Alış Tarihi</label>
                    <div className="d-flex modern-date-time">
                      <input
                        type="date"
                        className="form-control modern-input"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                      />
                      <input
                        type="time"
                        className="form-control modern-input"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* İade Ofisi */}
                  <div className="rent-item with-divider">
                    <label className="form-label">İade Ofisi</label>
                    <div className="form-group position-relative">
                      <Autocomplete
                        options={{
                          types: ["establishment"], // ✅ Sadece işyerlerini göster
                          componentRestrictions: { country: "TR" }, // ✅ Türkiye içindeki yerleri göster
                        }}
                      >
                        <input
                          type="text"
                          className="form-control modern-input"
                          placeholder="İade Ofisi Seçiniz"
                          ref={returnRef}
                          value={returnOffice}
                          onChange={(e) => setReturnOffice(e.target.value)}
                        />
                      </Autocomplete>
                      <button type="button" className="btn btn-find-location">
                        <i className="bi bi-crosshair"></i>
                      </button>
                    </div>
                  </div>

                  {/* İade Tarihi ve Saati */}
                  <div className="rent-item with-divider">
                    <label className="form-label">İade Tarihi</label>
                    <div className="d-flex modern-date-time">
                      <input
                        type="date"
                        className="form-control modern-input"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                      />
                      <input
                        type="time"
                        className="form-control modern-input"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {/* Kirala Butonu */}
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn modern-button" onClick={handleRent}>
                    Kirala
                    <i className="bi bi-chevron-right ms-2"></i>
                  </button>
                </div>
              </div>
            </section>

            {/* Yakın Ofisler ve Harita */}
            <section className="offices-map container my-4">
              {locationPermission || isLoggedIn ? (
                <div className="row">
                  {/* Yakın ofis kartları */}
                  <div className="col-md-4">
                    <h4>Yakındaki Ofisler</h4>
                    {suggestedOffices.length > 0 ? (
                      suggestedOffices.map((office, index) => (
                        <div key={index} className="card office-card mb-3">
                          <div className="card-body">
                            <div className="d-flex align-items-center">
                              <span className="office-number">{index + 1}</span>
                              <h5 className="card-title ms-3">{office.name}</h5>
                            </div>
                            <p className="card-text">{office.address}</p>
                            <p className="card-text">
                              <strong>📞 Telefon:</strong> {office.phone}
                            </p>
                            <div className="card-text">
                              {/* <strong>Çalışma Saatleri:</strong> {office.hours} */}
                              <strong>⏰ Çalışma Saatleri:</strong>
                              {office.hours !== "Bilinmiyor" ? (
                                <ul className="office-hours">
                                  {office.hours.map((day, i) => (
                                    <li key={i}>{day}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span> Bilinmiyor</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Yakınlarda ofis bulunamadı.</p>
                    )}
                  </div>

                  {/* Harita */}
                  <div className="col-md-8">
                    
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "400px" }}
                      center={userLocation}
                      zoom={12}
                    >
                      {suggestedOffices.map((office, index) => (
                        <Marker
                          key={index}
                          position={{ lat: office.lat, lng: office.lng }}
                          label={`${index + 1}`}
                        />
                      ))}
                    </GoogleMap>
                    {/* </LoadScript> */}
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  Konum izni verilmedi. Yakındaki ofisleri görmek için izin
                  verin.
                </div>
              )}
            </section>
          </>
        ) : (
          <p className="loading-text">Google Maps API yükleniyor...</p>
        )}
      </LoadScript>
    </div>
  );
};

export default Home;