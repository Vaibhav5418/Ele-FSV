import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';

const Hello = () => {
  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  const defaultCenter = {
    lat: 41.3851, lng: 2.1734
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe"
      preventGoogleFontsLoading={true} // Optional: Prevent loading of Google Fonts
      preventGoogleScriptsLoading={true} // Optional: Prevent loading of other Google scripts
    >
      <GoogleMap
        HelloStyle={mapStyles}
        zoom={13}
        center={defaultCenter}
      />
    </LoadScript>
  );
};

export default Hello;
