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
import { getAcdetails, getCamera, getCameraByDid, getDistrictDetails, getSetting, installCamera, setSetting, updateCamera } from '../actions/userActions';
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import withAuth from './withAuth';
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ReactPlayer from 'react-player';
import QRCodeScanner from './QrCodeScanner';
import TawkToWidget from './tawkto';
import { LuFlipHorizontal2, LuFlipVertical2 } from "react-icons/lu";

const InstallerCheckpost = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [boothNo, setBoothNo] = useState('');
  const [excelLocation, setExcelLocation] = useState(' ');
  const [state, setState] = useState(' ');
  const [punjab, setPunjab] = useState(' ');
  const [tripura, setTripura] = useState(' ');

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
    const response = await getCameraByDid(deviceId);
    console.log("response", response);
    setFlvUrl(response.flvUrl.url2);
    setAssemblyName(response.data.AssemblyName);
    setPsNumber(response.data.PSNumber);
    setDistrict(response.data.district);
    setExcelLocation(response.data.location);
  };

  const handleSubmit = async () => {
    // Handle the submit logic here
    try {
      const namee = localStorage.getItem('name');
      const mobilee = localStorage.getItem('mobile');
      console.log('Submitted:', namee, mobilee, deviceId, boothNo, address);
      let latitude = location.latitude;
      let longitude = location.longitude;
      let locationn = latitude + ',' + longitude;
      let installed_status = 1;
      const response = await installCamera(deviceId, namee, mobilee, address, boothNo, assemblyName, psNumber, district, excelLocation, locationn, installed_status);
      camera();
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

            const responsee = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=zaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`);
            setAddress(responsee.data.results[0].formatted_address)
            console.log("su ke yogi", responsee.data)

            if (response.data.results && response.data.results.length > 0) {
              const city = response.data.results[0].components.suburb;
              const state = response.data.results[0].components.state;
              const district = response.data.results[0].components.state_district;
              // setAddress(`${city}, ${district}, ${state}`);
              console.log("locationnnnnnn", response.data.results)
            }
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

  // const [districts, setDistricts] = useState([]);
  // const handleLocationChange = async (selectedLocation) => {
  //   setState(selectedLocation); // Update state
  //   try {
  //     const acDetails = await getDistrictDetails(selectedLocation);

  //     const districtData = acDetails.data.map(item => item.district);
  //     setDistricts(districtData);

  //     console.log(districtData);
  //     // Handle the response from the API as needed
  //   } catch (error) {
  //     console.error(error);
  //     // Handle errors
  //   }
  // };

  // const [assembly, setAssembly] = useState([]);
  // const handleAcChange = async (selectedLocation) => {
  //   setState(selectedLocation); // Update state
  //   try {
  //     const acDetails = await getAcdetails(state, selectedLocation);

  //     const assemblyData = acDetails.data.map(item => item.assemblyName);
  //     setAssembly(assemblyData);

  //     console.log(assemblyData);
  //     // Handle the response from the API as needed
  //   } catch (error) {
  //     console.error(error);
  //     // Handle errors
  //   }
  // };

  return (
    <Container maxW="98vw" p={4} px={{ base: '0', sm: '8' }} style={{ margin: "0px"}}> {/*  py={{ base: '12', md: '24' }} */}
      <ToastContainer />
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

          <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
            <Text style={{ width: "120px" }}>DeviceID</Text>
            <Input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder='Scan Camera'
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
              {/* <ReactPlayer
                url={flvUrl}
                playing={true}
                controls={true}
                width="100%"
                height="400px"
              /> */}
              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Location</Text>
                <Select value={state} onChange={(e) => handleLocationChange(e.target.value)} placeholder="Select location">
                  <option value="PUNJAB">PUNJAB</option>
                  <option value="TRIPURA">TRIPURA</option>
                  <option value="UTTARAKHAND">UTTARAKHAND</option>
                </Select>
              </div>
              
              <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Select<br/> District:</Text>
                <Select id="district" onChange={(e) => handleAcChange(e.target.value)}>
                  <option value="">Select District</option>
                  {districts.map((district, index) => (
                    <option key={index} value={district}>{district}</option>
                  ))}
                </Select>
              </div>

              <div style={{ display: "flex" }}>
                <Text style={{ width: "120px" }}>Select Assembly:</Text>
                <Select id="district" onChange={(e) => setAssemblyName(e.target.value)}>
                  <option value="">Select Assembly</option>
                  {assembly.map((assembly, index) => (
                    <option key={index} value={assembly}>{assembly}</option>
                  ))}
                </Select>
              </div> */}

              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Assembly</Text>
                <Input value={assemblyName} onChange={(e) => setAssemblyName(e.target.value)} placeholder="assemblyName" />
              </div> */}
              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>PSNumber./ Vehicle No.</Text>
                <Input value={psNumber} onChange={(e) => setPsNumber(e.target.value)} placeholder="psNumber" />
              </div> */}
              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>District</Text>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="district" />
              </div>
              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Location</Text>
                <Input value={excelLocation} onChange={(e) => setExcelLocation(e.target.value)} placeholder="excelLocation" />
              </div>


            </>
          )}
          {!showAdditionalInputs ? (
            <Button mt={4} onClick={handleAddInputs}>Camera DID Info</Button>
          )
            : (
              <>
                {(district === '' || district === undefined || district === null) && (
                  <Button onClick={handleFetchLocation}>Fetch Location</Button>
                )}
                <Button onClick={handleSubmit}>Submit</Button>
              </>
            )}

          {/* <Button onClick={handleSubmit}>Submit</Button> */}


          <br /><br /><br />
          <TableContainer w={'full'}>
            <Table variant='striped' colorScheme='teal' borderWidth="1px" borderColor="gray.200">
              <TableCaption>Your Installed Camera List</TableCaption>
              <Thead>
                <Tr>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Sr.No.</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Device ID</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>live</Th>
                  {/* <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Assembly Name</Th> */}
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Location</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>District</Th>
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

                    {/* {editableCameraID === camera.id ? (
                     
                      <Select value={live}
                        onChange={(e) => setLive(e.target.value)}>
                        <option value="1">🟢</option>
                        <option value="0">🔴</option>
                      </Select>
                    ) : (
                      <Td>
                        {camera.status === "RUNNING" ? (
                          <span>🟢</span>
                        ) : (
                          <span>🔴</span>
                        )}
                      </Td>
                    )} */}

                    <Td borderRight="1px" borderColor="gray.300">{camera.status === "RUNNING" ? (
                      <span>🟢</span>
                    ) : (
                      <span>🔴</span>
                    )}</Td>

                    {/* <Td borderRight="1px" borderColor="gray.300">{camera.assemblyName}</Td> */}
                    <Td borderRight="1px" borderColor="gray.300">{camera.location}</Td>
                    <Td borderRight="1px" borderColor="gray.300">{camera.district}</Td>
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
                            {/* <IconButton
                              marginLeft={2}
                              marginRight={2}
                              onClick={() => handleEditClick(camera.id)}
                              colorScheme="blue"
                              style={{ padding: 0, transform: 'scale(0.8)' }}
                            >
                              <MdEdit />
                            </IconButton> */}

                            {/* <Button onClick={() => handleUpload(box.ConsignmentNo)}>
                              UPL
                            </Button> */}

                            <Button
                              // onClick={() => handleDeleteClick(box._id)}
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
                    {/* <Td>{camera.cameraCount}</Td> */}
                    {/* <Td>{new Date(camera.date).toLocaleString(undefined, { timeZone: 'UTC' })}</Td> */}
                    {/* <Td>
                    <Button
                      // variant='contained'
                      onClick={() => handleButtonClick(box.boxName)}
                    >
                      <VisibilityIcon />
                    </Button>
                  </Td> */}
                  </Tr>
                ))}
                {/* <Tr>
                  <Td>inches</Td>
                  <Td>millimetres (mm)</Td>
                  <Td isNumeric>25.4</Td>
                </Tr> */}

              </Tbody>
              {/* <Tfoot>
                <Tr>
                  <Th>To convert</Th>
                  <Th>into</Th>
                  <Th isNumeric>multiply by</Th>
                </Tr>
              </Tfoot> */}
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

              {/* <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={handleCloseModal}>
                  Close
                </Button>
              </ModalFooter> */}
            </ModalContent>
          </Modal>

          {/* <video
            id="video-player"
            src="https://ptz.vmukti.com/live-record/VSPL-100004-OQYQR.flv"
            height="800px"
            width="800px"
            controls
            autoPlay // Note the change to autoPlay, instead of autoplay
            onPlay={handlePlay}
          /> */}

          {/* <div style={{ display: "flex", flexWrap: "wrap" }}>
            {cameraa.map((camera) => (
              <>
                <div style={{ display: "flex", flexDirection: "column", margin: "20px" }}>
                  <h1>{camera.deviceId}</h1>
                  <ReactPlayer
                    url={camera.flvUrl}
                    playing={false}
                    controls={true}
                    width="200px"
                    height="200px"
                  />
                </div>
              </>
            ))}
          </div> */}




          {/* <Text>
            Latitude: {location.latitude}, Longitude: {location.longitude}
          </Text> */}
        </>

      )}
    </Container>
  );
};

export default withAuth(InstallerCheckpost);
