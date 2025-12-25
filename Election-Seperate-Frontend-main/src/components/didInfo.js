import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Container,
  Flex,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { ToastContainer, toast } from 'react-toastify';
import { getAcdetails, getCamera, getCameraByDid, getCamerasByDid, getCamerasByNumber, getDistrictDetails, getFullDid, getSetting, installCamera, removeEleCamera, setSetting, trackLiveLatLong, updateCamera } from '../actions/userActions';
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import withAuth from './withAuth';
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ReactPlayer from 'react-player';
import QRCodeScanner from './QrCodeScanner';
import TawkToWidget from './tawkto';
import { LuFlipHorizontal2, LuFlipVertical2 } from "react-icons/lu";
import Autosuggest from 'react-autosuggest';
import { IoIosRefresh } from "react-icons/io";
import { Link } from 'react-router-dom';

const DidInfo = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [boothNo, setBoothNo] = useState('');
  const [excelLocation, setExcelLocation] = useState(' ');
  const [state, setState] = useState(' ');
  const [stateu, setStateu] = useState(' ');
  const [punjab, setPunjab] = useState(' ');
  const [tripura, setTripura] = useState(' ');

  const [prourl, setProurl] = useState('')


  useEffect(() => {

    camera();
    did();

  }, []); // Empty dependency array to run the effect only once


  const handleGetData = async (deviceId, setting) => {
    const response = await getCameraByDid(deviceId);
    const getset = await getSetting(deviceId, response.flvUrl.prourl);

    let modifiedData = {
      ...getset.data,
      appSettings: {
        ...getset.data.appSettings,
        imageCfg: {
          ...getset.data.appSettings.imageCfg,
          [setting]: getset.data.appSettings.imageCfg[setting] === 1 ? 0 : 1,
        },
      },
    };


    console.log("Modified data:", modifiedData);

    const setSet = await setSetting(response.flvUrl.prourl, modifiedData.appSettings);
  }

  // const handleGetData = async (deviceId) => {
  //   const response = await getCameraByDid(deviceId);
  //   // setProurl(`tcp://${response.flvUrl.prourl}`);
  //   // console.log(deviceId, `tcp://${response.flvUrl.prourl}`);
  //   const getset = await getSetting(deviceId, response.flvUrl.prourl);
  //   console.log("getSetting", getset.data.appSettings.imageCfg);

  //   const modifiedData = { ...getset.data.appSettings.imageCfg };
  //       modifiedData.flip = modifiedData.flip === 1 ? 0 : 1;

  //       console.log("Modified data:", modifiedData);
  // }

  const [status, setStatus] = useState('');
  const [lastSeen, setLastSeen] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const handleAddInputs = async () => {
    setShowAdditionalInputs(true);
    const response = await getCamerasByDid(deviceId);
    console.log("response", response);
    // setFlvUrl(response.flvUrl.url2);
    if (!response.data.flvUrl) {
      toast.error(`Please Enter Full DeviceID 'OR' URL2 is not available, so contact Support`, {
        position: 'top-right',
        autoClose: 3500, // 3.5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setFlvUrl(response.data.flvUrl);
    if (!response.success) {
      // toast.error('Failed to get camera data');
      toast.error('Failed to get camera data', {
        position: 'top-right',
        autoClose: 3500, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      toast.error('Plz connect support team before installing camera, from below right corner...', {
        position: 'top-right',
        autoClose: 5500, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      toast.warning('If testing camera than wait for the view', {
        position: 'top-right',
        autoClose: 5500, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    // If success is true, proceed with setting the state
    setState(response.data.state);
    setAssemblyName(response.data.assemblyName);
    setPsNumber(response.data.psNo);
    setDistrict(response.data.district);
    setExcelLocation(response.data.location);
    setStatus(response.data.status);
    setLastSeen(response.data.lastSeen);
    setName(response.data.personName);
    setMobile(response.data.personMobile);
  };


  const refresh = () => {
    window.location.reload();
  };

  const handleDeleteClick = async (id) => {
    try {
      console.log("getId", id)
      const response = await removeEleCamera(id);
      camera();
    } catch (error) {
      console.error('Error updating consignment:', error);
      // Handle error if the update request fails
    }
  };

  const [latie, setLatie] = useState('');
  const [longie, setLongie] = useState('');
  const namee = localStorage.getItem('name');
  const mobilee = localStorage.getItem('mobile');
  const handleSubmit = async () => {
    // Handle the submit logic here
    try {
      let latitude = location.latitude;
      let longitude = location.longitude;
      // let locationn = latitude + ',' + longitude;
      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString('en-GB');
      const formattedTime = currentTime.toLocaleTimeString('en-US', { hour12: false });

      let installed_status = 1;
      console.log('Submitted:', deviceId, namee, mobilee, assemblyName, psNumber, state, district, excelLocation, latitude, longitude, installed_status);
      const response = await installCamera(deviceId, namee, mobilee, assemblyName, psNumber, state, district, excelLocation, latitude, longitude, installed_status, formattedDate, formattedTime);
      console.log("response of submit", response);
      camera();
      setState('');
      setDistrict('');
      setAssemblyName('');
      setPsNumber('');
      setExcelLocation('');
      setShowAdditionalInputs(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    trackData();
  }, [namee, mobilee, latie, longie]); // Trigger the effect whenever name, mobile, or location change

  const trackData = async () => {
    try {
      // Call the action creator with the current state values
      let latitude = location.latitude;
      let longitude = location.longitude;
      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString('en-GB');
      const formattedTime = currentTime.toLocaleTimeString('en-US', { hour12: false });
      const responsee = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`);
      // setAddress(responsee.data.results[0].formatted_address)
      const statename = responsee.data.plus_code.compound_code.split(', ')[1].toUpperCase();
      console.log("lala", statename);
      const result = await trackLiveLatLong(namee, mobilee, latitude, longitude, formattedDate, formattedTime, statename);
      // Dispatch any other actions or handle the result as needed
    } catch (error) {
      console.error('Error tracking data:', error);
      // Handle errors
    }
  };

  const [editableCameraID, setEditableCameraID] = useState(null);
  // const [installed, setInstalled] = useState('0');
  const [live, setLive] = useState(0);

  const handleEditClick = (itemId) => {
    console.log(itemId)
    setEditableCameraID(itemId);
  };

  const handleUpdateClick = async (id) => {
    try {
      console.log("getId", id)
      console.log('live:', live);
      const response = await updateCamera(id, live);
      console.log('Consignment updated successfully:', response.data);
      setEditableCameraID(0);
      camera();
      // window.location.reload();
    } catch (error) {
      console.error('Error updating consignment:', error);
      // Handle error if the update request fails
    }
  };

  // const handleFetchLocation = async (id) => {
  //   try {
  //     console.log("getId", id)
  //     console.log('live:', live);
  //     let latitude = location.latitude;
  //     let longitude = location.longitude;
  //     const responsee = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`);
  //     console.log('Consignment updated successfully:', responsee.data.results[8].formatted_address.split(',')[0]);
  //     setDistrict(responsee.data.results[8].formatted_address.split(',')[0]);
  //     // setEditableCameraID(0);
  //     camera();
  //     // window.location.reload();
  //   } catch (error) {
  //     console.error('Error updating consignment:', error);
  //     // Handle error if the update request fails
  //   }
  // };

  const [didList, setDidList] = useState([]);
  const did = async () => {
    try {
      const mobile = localStorage.getItem('mobile');
      const result = await getCamerasByNumber(mobile);
      setDidList(result.data)

    } catch (error) {
      // Handle error
    }
    finally {

    }
  };

  const [cameraa, setCameraa] = useState([]);
  const camera = async () => {
    try {
      const mobile = localStorage.getItem('mobile');
      const result = await getCamera(mobile);
      console.log("cameras data", result.data)
      setCameraa(result.data)

    } catch (error) {
      // Handle error
    }
    finally {

    }
  };


  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [assemblyName, setAssemblyName] = useState('');
  const [flvUrl, setFlvUrl] = useState('');
  const [psNumber, setPsNumber] = useState('');
  const [district, setDistrict] = useState('');

  const [deviceWidth, setDeviceWidth] = useState(window.innerWidth);

  // Event listener to update device width on window resize
  const handleResize = () => {
    setDeviceWidth(window.innerWidth);
  };

  // Attach event listener on component mount
  useEffect(() => {
    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  const isMobileDevice = deviceWidth < 450;
  const handleScanSuccess = (text) => {
    setDeviceId(text);
  };

  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle input change
  const handleInputChange = async (event, { newValue }) => {
    setDeviceId(newValue);
    // Remove non-numeric characters from the input value
    const numericValue = newValue.replace(/\D/g, '');

    // Check if the numeric value contains exactly six digits
    if (numericValue.length === 6) {
      setIsLoading(true);
      try {
        const response = await getFullDid(numericValue); // API call to fetch suggestions based on input
        setSuggestions(response.streamnames); // Assuming the API response contains an array of suggestions
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // If the input value doesn't contain six digits, clear suggestions and exit
      setSuggestions([]);
    }
  };


  // Autosuggest configuration
  const inputProps = {
    value: deviceId,
    onChange: handleInputChange,
    placeholder: 'Enter Device ID',
    style: { width: '100%', padding: '10px', borderColor: 'black', borderWidth: '1px' }
  };

  return (
    <Container maxW="98vw" p={4} px={{ base: '0', sm: '8' }} style={{ margin: "0px" }}> {/*  py={{ base: '12', md: '24' }} */}
      <ToastContainer />
      <div style={{
        position: 'fixed',
        bottom: '20px', // Adjust as needed for desired vertical position
        right: '20px', // Adjust as needed for desired horizontal position
      }}>
        <TawkToWidget />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        bottom: '20px', // Adjust as needed for desired vertical position
        left: '20px', // Adjust as needed for desired horizontal position
      }}>
        <Button onClick={refresh}>
          <IoIosRefresh />&nbsp;Refresh
        </Button>
      </div>

      <>

        {isMobileDevice && <> <QRCodeScanner onScanSuccess={handleScanSuccess} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            OR
          </div>
        </>
        }

        <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
          <Text style={{ width: "120px" }}>DeviceID</Text>
          {suggestions && suggestions.length >= 0 ? (
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }) => handleInputChange(null, { newValue: value })}
              onSuggestionsClearRequested={() => setSuggestions([])}
              getSuggestionValue={(suggestion) => suggestion}
              renderSuggestion={(suggestion) => <div>{suggestion}</div>}
              inputProps={inputProps}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text>Camera not yet installed !</Text>
              <Button onClick={refresh}>Go Back</Button>
            </div>
          )}

        </div>

        {showAdditionalInputs && (
          <>
            <ReactPlayer
              url={flvUrl}
              playing={true}
              controls={true}
              width="100%"
              height="400px"
            />

            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>State</Text>
              <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="district" />
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>District</Text>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="district" />
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>Assembly</Text>
              <Input value={assemblyName} onChange={(e) => setAssemblyName(e.target.value)} placeholder="assemblyName" />
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>PsNo.</Text>
              <Input value={psNumber} onChange={(e) => setPsNumber(e.target.value)} placeholder="psNumber" />
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>Location</Text>
              <Input value={excelLocation} onChange={(e) => setExcelLocation(e.target.value)} placeholder="excelLocation" />
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>Status</Text>
              {status === "RUNNING" ? (
                <span style={{ color: "green" }}>🟢</span>
              ) : (
                <span style={{ color: "red" }}>🔴</span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>Last Live</Text>
              <Input value={lastSeen} disabled />
              {/* {lastSeen} */}
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>Name</Text>
              <Input value={name} disabled />
              {/* {lastSeen} */}
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Text style={{ width: "120px" }}>Mobile</Text>
              <Input value={mobile} disabled />
              {/* {lastSeen} */}
            </div>



          </>
        )}
        {!showAdditionalInputs ? (
          <Button mt={4} onClick={handleAddInputs}>Camera DID Info</Button>
        )
          : (
            <>
              {/* {(district === '' || district === undefined || district === null) && (
                  <Button onClick={handleFetchLocation}>Fetch Location</Button>
                )} */}
              <Button onClick={refresh}>Refresh</Button>
            </>
          )}

      </>

    </Container>
  );
};

export default withAuth(DidInfo);
