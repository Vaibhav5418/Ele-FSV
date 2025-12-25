import React, { useEffect, useState } from 'react';
import { importAttendance } from '../actions/userActions';
import { Button } from '@chakra-ui/react';
import withAuth from './withAuth';
import { ToastContainer, toast } from 'react-toastify';

const Attendance = () => {

const [location, setLocation] = useState(null);
useEffect(() => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Get latitude and longitude from the position object
            const { latitude, longitude } = position.coords;
  
            // const latitude = 23.0282826;
            // const longitude = 72.5398852;
  
            // Set the location in state
            setLocation({ latitude, longitude });
          }
        );
      } else {
        console.error('Geolocation is not supported by your browser.');
      }
    }, []);

const attendance = async() => {
  try {
    const currentTime = new Date();
    const formattedDate = currentTime.toLocaleDateString('en-GB');
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour12: false });
    const name = localStorage.getItem('name');
    const mobile = localStorage.getItem('mobile');
    let latitude = location.latitude;
    let longitude = location.longitude;
    const response = await importAttendance(formattedDate, formattedTime, name, mobile, latitude, longitude);
    console.log("attendanceResp",response);
    toast.success(response.data, {
          position: 'top-right',
          autoClose: 3500, // 5 seconds
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
    if (response.data.message === "Request failed with status code 401"){
      toast.error('Cannot create attendance. Present time should be more than 3 hours from the last entry.', {
        position: 'top-right',
        autoClose: 3500, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
} catch (error) {
    toast.error('Cannot create attendance. Present time should be more than 15 minutes from the last entry.', {
        position: 'top-right',
        autoClose: 3500, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    console.error(error);
    // Handle errors, and include an error message in the response
    return { success: false, message: error.message || 'An error occurred during login.' };
  }

};

  return (
    <div style={{height:"100vh", width:"100%", display:'flex',justifyContent:'center', alignItems:'center'}}>
       <ToastContainer />
        <Button onClick={() => attendance()}>
            Attendance
        </Button>
    </div>
  );
};

export default withAuth(Attendance);
