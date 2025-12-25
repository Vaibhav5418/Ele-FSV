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
import { getAcdetails, getCamera, getCameraByDid, getDistrictDetails, getFlvLatDid, getFullDid, getPsDetails, getPsLocation, getSetting, installCamera, removeEleCamera, setSetting, trackLiveLatLong, updateCamera } from '../actions/userActions';
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import withAuth from './withAuth';
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ReactPlayer from 'react-player';
import QRCodeScanner from './QrCodeScanner';
import TawkToWidget from './tawkto';
import { LuFlipHorizontal2, LuFlipVertical2 } from "react-icons/lu";
import { useNavigate } from 'react-router-dom';
import { IoIosRefresh } from "react-icons/io";
import Autosuggest from 'react-autosuggest';

const Installer = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [boothNo, setBoothNo] = useState('');
  const [excelLocation, setExcelLocation] = useState(' ');
  const [state, setState] = useState('');
  const [stateu, setStateU] = useState('');
  const [punjab, setPunjab] = useState(' ');
  const [tripura, setTripura] = useState(' ');
  const navigate = useNavigate();

  const [prourl, setProurl] = useState('')

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

  const handleAddInputs = async () => {
    setShowAdditionalInputs(true);

    try {
      const response = await getFlvLatDid(deviceId);  //getCameraByDid(deviceId)
      console.log("response", response);

      setFlvUrl(response.flvUrl.url2);
      setState(stateu);
      console.log("check", stateu);
      handleLocationChange(stateu);
      // setAssemblyName(response.data.AssemblyName);
      // setPsNumber(response.data.PSNumber);
      // setDistrict(response.data.district);
      // setState(response.data.district);
      // setExcelLocation(response.data.location);
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
      // Optionally, you can show a generic error toast here
      toast.error('Unable to fetch DID URL. Please connect with support using the support button.', {
        position: 'top-right',
        autoClose: 3500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setShowAdditionalInputs(false);
    }
  };

  const [latie, setLatie] = useState('');
  const [longie, setLongie] = useState('');
  // let latie = location.latitude;
  // let longie = location.latitude;
  const namee = localStorage.getItem('name');
  const mobilee = localStorage.getItem('mobile');
  const handleSubmit = async () => {
    // Handle the submit logic here
    try {
      console.log('Submitted:', namee, mobilee, deviceId, boothNo);
      let latitude = location.latitude;
      let longitude = location.longitude;
      // let locationn = latitude + ',' + longitude;
      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString('en-GB');
      const formattedTime = currentTime.toLocaleTimeString('en-US', { hour12: false });
      let installed_status = 1;
      const response = await installCamera(deviceId, namee, mobilee, assemblyName, psNumber, state, district, psLocation, latitude, longitude, installed_status, formattedDate, formattedTime); //excelLocation
      camera();
      trackData();
      setShowAdditionalInputs(false);
      setDeviceId('');
      setAssemblyName('');
      setPsNumber('');
      setDistrict('');
      setState('');
      setPsLocation('');
    } catch (error) {
      console.error(error);
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

  const handleFetchLocation = async (id) => {
    try {
      console.log("getId", id)
      console.log('live:', live);
      let latitude = location.latitude;
      let longitude = location.longitude;
      const responsee = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`);
      console.log('Consignment updated successfully:', responsee.data.results[8].formatted_address.split(',')[0]);
      setDistrict(responsee.data.results[8].formatted_address.split(',')[0]);
      // setEditableCameraID(0);
      camera();
      // window.location.reload();
    } catch (error) {
      console.error('Error updating consignment:', error);
      // Handle error if the update request fails
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
  // useEffect(() => {
  //   allBox();
  // }, []);

  useEffect(() => {
    // const namee = localStorage.getItem('name');

    // if (namee !== 'installer'){
    //   navigate('/Error');
    // }

    camera();

    // toast.success('Welcome', {
    //   position: 'top-right',
    //   autoClose: 1500, // 5 seconds
    //   hideProgressBar: false,
    //   closeOnClick: true,
    //   pauseOnHover: true,
    //   draggable: true,
    // });

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Get latitude and longitude from the position object
          const { latitude, longitude } = position.coords;

          setLatie(latitude);
          setLongie(longitude);

          // const latitude = 23.0282826;
          // const longitude = 72.5398852;

          // Set the location in state
          setLocation({ latitude, longitude });

          // Fetch the city and state using OpenCage Geocoding API
          try {
            // This part is incomplete; you need to provide the API endpoint and parameters
            const response = await axios.get(
              // Provide your API endpoint and parameters here
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=6da09e29dbc54d859e03bca9a9737461`
            );

            const responsee = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`);
            setAddress(responsee.data.results[0].formatted_address)
            console.log("su ke yogi", responsee.data)
            setStateU(responsee.data.plus_code.compound_code.split(',')[1].toUpperCase());


            // if (response.data.results && response.data.results.length > 0) {
            //   const city = response.data.results[0].components.suburb;
            //   const state = response.data.results[0].components.state;
            //   const district = response.data.results[0].components.state_district;
            //   // setAddress(`${city}, ${district}, ${state}`);
            //   // setStateU(response.data.results[0].components.state.toUpperCase());
            //   console.log("jjjjjkj", response.data.results[0].components.state.toUpperCase());
            // }
          } catch (error) {
            console.error('Error fetching address:', error.message);
          }
        },
        (error) => {
          console.error('Error getting location:', error.message);
        }
      );
    } else {
      console.error('Geolocation is not supported by your browser.');
    }
  }, []); // Empty dependency array to run the effect only once

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

      const result = await trackLiveLatLong(namee, mobilee, latitude, longitude, formattedDate, formattedTime);
      console.log(result);
      // Dispatch any other actions or handle the result as needed
    } catch (error) {
      console.error('Error tracking data:', error);
      // Handle errors
    }
  };

  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [assemblyName, setAssemblyName] = useState('');
  const [flvUrl, setFlvUrl] = useState('');
  const [psNumber, setPsNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [realLocation, setRealLocation] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

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

  const [showModal, setShowModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const handleViewCamera = (camera) => {
    setSelectedCamera(camera);
    setShowModal(true);
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const [districts, setDistricts] = useState([]);
  const handleLocationChange = async (selectedLocation) => {
    const locationString = selectedLocation.toString().toUpperCase();
    setState(locationString); // Update state
    try {
      const acDetails = await getDistrictDetails(locationString);

      const districtData = acDetails.data.map(item => item.district);
      setDistricts(districtData);

      console.log(districtData);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };

  const [assembly, setAssembly] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState([]);
  const handleAcChange = async (selectedLocation) => {
    setSelectedDistrict(selectedLocation); // Update state
    setDistrict(selectedLocation);
    console.log(selectedLocation);
    try {
      const acDetails = await getAcdetails(state, selectedLocation);

      const assemblyData = acDetails.data.map(item => item.assemblyName);
      setAssembly(assemblyData);

      console.log(assemblyData);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };

  const [psNo, setPsNo] = useState([]);
  const [selectedPs, setSelectedPs] = useState([]);
  const handlePsChange = async (selectedLocation) => {
    setSelectedPs(selectedLocation); // Update state
    setAssemblyName(selectedLocation);
    try {
      const acDetails = await getPsDetails(state, selectedDistrict, selectedLocation);

      const psData = acDetails.data.map(item => item.psNo);
      setPsNo(psData);

      console.log("psData", acDetails);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };

  const [psLocation, setPsLocation] = useState([]);
  const handlePsLocation = async (selectedLocation) => {
    // setState(selectedLocation); // Update state
    setPsNumber(selectedLocation);
    try {
      const acDetails = await getPsLocation(state, selectedDistrict, selectedPs, selectedLocation);

      const psLocations = acDetails.data.map(item => item.location);
      setPsLocation(psLocations[0]);
      // setInstallLocation(acDetails.data[0])

      console.log("ps location", psLocations);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };

  const refresh = () => {
    console.log('ssss');
    window.location.reload();
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

      <div style={{
        position: 'fixed',
        bottom: '20px', // Adjust as needed for desired vertical position
        right: '20px', // Adjust as needed for desired horizontal position
      }}>
        <TawkToWidget />
      </div>

      {location && (
        <>
          {/* <h1 variant="h6" id="qr-code-scanner-modal-title" gutterBottom>
            QR Code Scanner
          </h1> */}

          {isMobileDevice && <> <QRCodeScanner onScanSuccess={handleScanSuccess} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              OR
            </div>
          </>
          }

          {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
            <Text style={{ width: "120px" }}>DeviceID</Text>
            <Input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder='Scan Camera'
            />
          </div> */}
          <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", width: '100%' }}>
            <Text style={{ width: "120px" }}>DeviceID</Text>
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }) => handleInputChange(null, { newValue: value })}
              onSuggestionsClearRequested={() => setSuggestions([])}
              getSuggestionValue={(suggestion) => suggestion}
              renderSuggestion={(suggestion) => <div>{suggestion}</div>}
              inputProps={inputProps}
            />
          </div>
          {/* <Select value={boothNo} onChange={(e) => setBoothNo(e.target.value)}>

            <option value="Booth1">Booth 1</option>
            <option value="Booth2">Booth 2</option>
            <option value="Booth3">Booth 3</option>
            <option value="Booth4">Booth 4</option>
            <option value="Booth5">Booth 5</option>
          </Select> */}
          {/* {address && <Text>Address: {address}</Text>} */}

          {showAdditionalInputs && (
            <>
              <ReactPlayer
                url={flvUrl}
                playing={true}
                controls={true}
                width="100%"
                height="400px"
              />
              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Select <br />State</Text>
                <Select value={state} placeholder="Select State" onChange={(e) => handleLocationChange(e.target.value)}>
                  <option value="PUNJAB">PUNJAB</option>
                  <option value="TRIPURA">TRIPURA</option>
                  <option value="UTTARAKHAND">UTTARAKHAND</option>
                  <option value="MP">MP</option>
                  <option value="BIHAR">BIHAR</option>
                  <option value="NAGALAND">NAGALAND</option>
                  <option value="MEGHALAYA">MEGHALAYA</option>
                </Select>
              </div> */}
              <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Your<br /> State:</Text>
                <input
                  type="text"
                  id="myInput"
                  value={state}
                  onChange={handleLocationChange}
                  disabled
                // onChange={handleLocationChan}
                />
              </div>

              <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Select<br /> District:</Text>
                <Select id="district" onChange={(e) => handleAcChange(e.target.value)}>
                  <option value="">Select District</option>
                  {districts.map((district, index) => (
                    <option key={index} value={district}>{district}</option>
                  ))}
                </Select>
              </div>

              <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Select <br /> Assembly:</Text>
                <Select id="district" onChange={(e) => handlePsChange(e.target.value)}>
                  <option value="">Select Assembly</option>
                  {assembly.map((assembly, index) => (
                    <option key={index} value={assembly}>{assembly}</option>
                  ))}
                </Select>
              </div>

              <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Ps No:</Text>
                <Select id="district" onChange={(e) => handlePsLocation(e.target.value)}>
                  <option value="">Select PsNo</option>
                  {psNo.map((district, index) => (
                    <option key={index} value={district}>{district}</option>
                  ))}
                </Select>
              </div>

              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Install Location</Text>
                <Input value={psLocation} onChange={(e) => setPsLocation(e.target.value)} placeholder="district" />
              </div>

              {/* <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Location: </Text>
                <Input value={InstallLocation} onChange={(e) => setInstallLocation(e.target.value)}> </Input>
              </div> */}

              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Assembly</Text>
                <Input value={assemblyName} onChange={(e) => setAssemblyName(e.target.value)} placeholder="assemblyName" />
              </div> */}
              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>PSNumber./ Vehicle No.</Text>
                <Input value={psNumber} onChange={(e) => setPsNumber(e.target.value)} placeholder="psNumber" />
              </div> */}
              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>District</Text>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="district" />
              </div> */}
              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Location</Text>
                <Input value={excelLocation} onChange={(e) => setExcelLocation(e.target.value)} placeholder="excelLocation" />
              </div> */}


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
                <Flex justifyContent="flex-end">
                  <Button onClick={handleSubmit}>Submit</Button>
                </Flex>
              </>
            )}

          {/* <Button onClick={handleSubmit}>Submit</Button> */}


          <br /><br /><br />
          <TableContainer w={'full'}>
            <Table variant='striped' colorScheme='teal' borderWidth="1px" borderColor="gray.200">
              <TableCaption>If you face any difficulty feel free to connect with our support team from below given chat assist.</TableCaption>
              <Thead>
                <Tr>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Sr.No.</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Device ID</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>live</Th>
                  {/* <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Assembly Name</Th> */}
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Location</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>District</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>State</Th>
                  {/* <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Ps No.</Th> */}
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>last Live</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Video Feed</Th>

                  {/* <Th>Name</Th> */}
                  {/* <Th>Mobile</Th> */}
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Edit/Delete</Th>
                  {/* <Th isNumeric>multiply by</Th> */}
                </Tr>
              </Thead>
              <Tbody>
                {cameraa.map((camera, index) => (
                  <Tr key={camera.id} bg={index % 2 === 0 ? 'gray.100' : 'white'}>
                    <Td borderRight="1px" borderColor="gray.300">{index + 1}</Td>
                    <Td borderRight="1px" borderColor="gray.300">{camera.deviceId}</Td>
                    {/* <Td>{camera.installed}</Td> */}

                    <Td borderRight="1px" borderColor="gray.300">{camera.status === "RUNNING" ? (
                      <span>🟢</span>
                    ) : (
                      <span>🔴</span>
                    )}</Td>

                    {/* <Td borderRight="1px" borderColor="gray.300">{camera.assemblyName}</Td> */}
                    <Td borderRight="1px" borderColor="gray.300">{camera.location}</Td>
                    <Td borderRight="1px" borderColor="gray.300">{camera.district}</Td>
                    <Td borderRight="1px" borderColor="gray.300">{camera.state}</Td>
                    {/* <Td borderRight="1px" borderColor="gray.300">{camera.psNo}</Td> */}
                    <Td borderRight="1px" borderColor="gray.300">{camera.lastSeen}</Td>

                    <Td borderRight="1px" borderColor="gray.300"> <IconButton
                      marginLeft={2}
                      marginRight={2}
                      onClick={() => handleViewCamera(camera)}
                      colorScheme="blue"
                      style={{ padding: 0, transform: 'scale(0.8)' }}
                      aria-label="View details"
                    >
                      <MdVisibility />
                    </IconButton> </Td>
                    {/* <Td>{camera.mobile}</Td> */}
                    <Td borderRight="1px" borderColor="gray.300">
                      {editableCameraID === camera.id ? (
                        <Button onClick={() => handleUpdateClick(camera.deviceId)} colorScheme="green">
                          Update
                        </Button>
                      ) : (
                        <>
                          <div style={{ display: "flex" }}>

                            <Button
                              onClick={() => handleDeleteClick(camera.deviceId)}
                              colorScheme="red"
                              style={{ padding: 0 }}
                            >
                              <MdDelete style={{ color: "rgb(200,0,0)" }} />
                            </Button>
                            {/* <Button
                              onClick={() => handleUpload(box.ConsignmentNo)}
                              colorScheme="red"
                              style={{ padding: 0 }}
                            >
                              <ExportOutlined style={{ color: "rgb(200,0,0)" }} />
                            </Button> */}
                          </div>
                        </>
                      )}
                    </Td>
                  </Tr>
                ))}

              </Tbody>
            </Table>
          </TableContainer>

          <Modal isOpen={showModal} onClose={handleCloseModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton />
              <ModalBody>
                {selectedCamera && (
                  <>
                    <ModalHeader>{selectedCamera.deviceId}</ModalHeader>
                    <ReactPlayer
                      url={selectedCamera.flvUrl}
                      playing={true}
                      controls={true}
                      width="100%"
                      height="400px"
                    />
                    <Flex justifyContent="space-between" mt={4} mb={4}>
                      <Button colorScheme="blue" mt={4} onClick={() => handleGetData(selectedCamera.deviceId, 'flip')}>
                        Flip &nbsp;<LuFlipVertical2 />
                      </Button>
                      <Button colorScheme="blue" mt={4} onClick={() => handleGetData(selectedCamera.deviceId, 'mirror')}>
                        Mirror &nbsp;<LuFlipHorizontal2 />
                      </Button>
                    </Flex>
                  </>
                )}
              </ModalBody>

            </ModalContent>
          </Modal>

        </>

      )}
    </Container>
  );
};

export default withAuth(Installer);
