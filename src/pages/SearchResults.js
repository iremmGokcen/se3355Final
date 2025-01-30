import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const SearchResults = () => {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({ make: "", transmission: "", price: "" });

  useEffect(() => {
    fetch("http://localhost:5000/api/cars")
      .then((res) => res.json())
      .then((data) => setCars(data))
      .catch((err) => console.error("Araçlar yüklenemedi:", err));
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredCars = cars
    .filter(car => !filters.make || car.make === filters.make)
    .filter(car => !filters.transmission || car.transmission === filters.transmission)
    .sort((a, b) => filters.price === "asc" ? a.price - b.price : b.price - a.price);

  return (
    <div>
      <Navbar />
    <section className="searchResults-section bg-dark text-white py-4">
    <div className="container mt-4">
      <h2>Arama Sonuçları</h2>
      <div className="filters">
        <select name="make" onChange={handleFilterChange}>
          <option value="">Marka Seç</option>
          <option value="BMW">BMW</option>
          <option value="Mercedes">Mercedes</option>
        </select>
        <select name="transmission" onChange={handleFilterChange}>
          <option value="">Şanzıman Seç</option>
          <option value="Auto">Otomatik</option>
          <option value="Manual">Manuel</option>
        </select>
        <select name="price" onChange={handleFilterChange}>
          <option value="">Fiyat Sırala</option>
          <option value="asc">Düşükten Yükseğe</option>
          <option value="desc">Yüksekten Düşüğe</option>
        </select>
      </div>
      <div className="row">
        {filteredCars.map((car) => (
          <div key={car.id} className="col-md-4">
            <div className="card">
              <img src={car.image} alt={car.make} className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title">{car.make} - {car.model}</h5>
                <p>Fiyat: {car.price} TL</p>
                <p>Şanzıman: {car.transmission}</p>
                <button className="btn btn-primary">Kirala</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </section>
    </div>
  );
};

export default SearchResults;
