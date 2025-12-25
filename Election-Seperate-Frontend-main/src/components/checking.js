import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Container,
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
import { getCamera, getCameraByDid, installCamera, updateCamera } from '../actions/userActions';
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import withAuth from './withAuth';
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ReactPlayer from 'react-player';
import QRCodeScanner from './QrCodeScanner';

const Checking = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [boothNo, setBoothNo] = useState('');
  const [excelLocation, setExcelLocation] = useState(' ');

  const [flvUrl, setFlvUrl] = useState('');
  const handleAddInputs = async () => {
    setShowAdditionalInputs(true);
    const response = await getCameraByDid(deviceId);
    console.log("response", response);
    setAssemblyName(response.data.AssemblyName);
    setFlvUrl(response.flvUrl.url2);
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





    // Check if Geolocation is supported by the browser

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

  return (
    <Container maxW="100vw" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '2' }} style={{ margin: "0px", padding: "0" }}>
      <ToastContainer />
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
                <Text>{flvUrl}</Text>
              </div>

              {/* <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Assembly</Text>
                <Input value={assemblyName} onChange={(e) => setAssemblyName(e.target.value)} placeholder="assemblyName" />
              </div>
              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>PSNumber./ Vehicle No.</Text>
                <Input value={psNumber} onChange={(e) => setPsNumber(e.target.value)} placeholder="psNumber" />
              </div>
              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>District</Text>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="district" />
              </div>
              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                <Text style={{ width: "120px" }}>Location</Text>
                <Input value={excelLocation} onChange={(e) => setExcelLocation(e.target.value)} placeholder="excelLocation" />
              </div> */}


            </>
          )}
          {!showAdditionalInputs ? (
            <Button onClick={handleAddInputs}>Camera DID Info</Button>
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
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Assembly Name</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>District</Th>
                  <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Ps No.</Th>
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

                    <Td borderRight="1px" borderColor="gray.300">{camera.assemblyName}</Td>
                    <Td borderRight="1px" borderColor="gray.300">{camera.district}</Td>
                    <Td borderRight="1px" borderColor="gray.300">{camera.psNo}</Td>
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
                              // onClick={() => handleDeleteClick(box._id)}
                              colorScheme="red"
                              style={{ padding: 0 }}
                            >
                              <MdDelete style={{ color: "rgb(200,0,0)" }} />
                            </Button>
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
              <ModalHeader>View Camera</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {selectedCamera && (
                  <ReactPlayer
                    url={selectedCamera.flvUrl}
                    playing={true}
                    controls={true}
                    width="100%"
                    height="400px"
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={handleCloseModal}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>

      )}
    </Container>
  );
};

export default withAuth(Checking);
