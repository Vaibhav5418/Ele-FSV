import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WorldMap = () => {
  // const [points, setPoints] = useState([]);

  // useEffect(() => {
  //   const fetchLocationData = async () => {
  //     try {
  //       const response = await axios.get('http://192.168.29.33:7073/election/getLocation');
  //       setPoints(response.data.data);
  //     } catch (error) {
  //       console.error('Error fetching location data:', error);
  //     }
  //   };

  //   fetchLocationData();
  // }, []);

  useEffect(() => {
    const initMap = () => {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5
      });

      // points.forEach(point => {
        new window.google.maps.Marker({
          position: { lat: 20.5937, lng: 78.9629 },
          map: map,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });
      // });
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Google Maps API script not loaded yet
      // Load it dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe&callback=initMap`;
      script.defer = true;
      script.async = true;
      window.initMap = initMap;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div id="map" style={{ height: '400px', width: '100%' }}></div>
  );
};

export default WorldMap;
