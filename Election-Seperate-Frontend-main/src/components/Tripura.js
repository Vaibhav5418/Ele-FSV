import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
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
import { getAcdetails, getCamera, getCameraByDid, getCamerasByNumber, getDistrictDetails, getRebootCamera, getSetting, installCamera, rebootCamera, setSetting, updateCamera } from '../actions/userActions';
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import withAuth from './withAuth';
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ReactPlayer from 'react-player';
import QRCodeScanner from './QrCodeScanner';
import TawkToWidget from './tawkto';
import { LuFlipHorizontal2, LuFlipVertical2 } from "react-icons/lu";
import { IoIosRefresh } from 'react-icons/io';

const Tripura = () => {
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

  // const handleAddInputs = async () => {
  //   setShowAdditionalInputs(true);
  //   const response = await getCameraByDid(deviceId);
  //   console.log("response", response);
  //   setFlvUrl(response.flvUrl.url2);
  //   setState(response.data.state);
  //   setAssemblyName(response.data.assemblyName);
  //   setPsNumber(response.data.psNo);
  //   setDistrict(response.data.district);
  //   setExcelLocation(response.data.location);
  // };

  // const handleSubmit = async () => {
  //   // Handle the submit logic here
  //   try {
  //     const namee = localStorage.getItem('name');
  //     const mobilee = localStorage.getItem('mobile');
  //     console.log('Submitted:', namee, mobilee, deviceId);
  //     let latitude = location.latitude;
  //     let longitude = location.longitude;
  //     // let locationn = latitude + ',' + longitude;
  //     let installed_status = 1;
  //     const response = await installCamera(deviceId, namee, mobilee, assemblyName, psNumber, state, district, excelLocation, latitude, longitude, installed_status);
  //     console.log("response of submit", response);
  //     camera();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

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

  // const [didList, setDidList] = useState([]);
  // const did = async () => {
  //   try {
  //     const mobile = localStorage.getItem('mobile');
  //     const result = await getCamerasByNumber(mobile);
  //     setDidList(result.data)

  //   } catch (error) {
  //     // Handle error
  //   }
  //   finally {

  //   }
  // };
  const [cameraa, setCameraa] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  const camera = async () => {
    try {
      const mobile = localStorage.getItem('mobile');
      const result = await getRebootCamera(currentPage, search);
      console.log("cameras data", result.data);
      setCameraa(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      // Handle error
    }
  };

  // Function to handle next button click
  const recam = async (id) => {
    try {
      const result = await rebootCamera(id);
      console.log('recam', result);
      toast.success('Camera Rebooted Successfully', {
        position: 'top-right',
        autoClose: 1500, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      // Handle error
    }
  };

  const handleNextClick = async () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  // Function to handle previous button click
  const handlePrevClick = async () => {
    setCurrentPage(prevPage => prevPage - 1);
  };

  const handleSearchClick = async () => {
    // When search button is clicked, fetch camera data with the current search value
    setCurrentPage(1); // Reset currentPage to 1 when performing a new search
    camera();
  };

  useEffect(() => {
    // Fetch camera data initially
    camera();
  }, [currentPage]); // Empty dependency array to run the effect only once


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

  const refresh = () => {
    window.location.reload();
  };

  return (
    <Container maxW="98vw" p={4} px={{ base: '0', sm: '8' }} style={{ margin: "0px" }}> {/*  py={{ base: '12', md: '24' }} */}
      <ToastContainer />
      <div style={{
        position: 'fixed',
        bottom: '20px', // Adjust as needed for desired vertical position
        right: '20px', // Adjust as needed for desired horizontal position
      }}>
        {/* <TawkToWidget /> */}
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

      <Box display='flex'>
        <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="deviceId" />
        </div>
        <Button onClick={handleSearchClick}>
          Search
        </Button>
      </Box>

      {/* {location && ( */}
      {/* <> */}
      {/* <h1 variant="h6" id="qr-code-scanner-modal-title" gutterBottom>
            QR Code Scanner
          </h1> */}

      <br /><br /><br />
      <TableContainer w={'full'}>
        <Table variant='striped' colorScheme='teal' borderWidth="1px" borderColor="gray.200">
          <TableCaption>Your Installed Camera List</TableCaption>
          <Thead>
            <Tr>
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Sr.No.</Th>
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Device ID</Th>
              {/* <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>live</Th> */}
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>State</Th>
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>District</Th>
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Assembly Name</Th>
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Ps No.</Th>
              <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>Location</Th>
              {/* <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>last Live</Th> */}
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

                {/* <Td borderRight="1px" borderColor="gray.300">{camera.status === "RUNNING" ? (
                      <span>🟢</span>
                    ) : (
                      <span>🔴</span>
                    )}</Td> */}

                <Td borderRight="1px" borderColor="gray.300">{camera.state}</Td>
                <Td borderRight="1px" borderColor="gray.300">{camera.district}</Td>
                <Td borderRight="1px" borderColor="gray.300">{camera.assemblyName}</Td>
                <Td borderRight="1px" borderColor="gray.300">{camera.psNo}</Td>
                <Td borderRight="1px" borderColor="gray.300">{camera.location}</Td>
                {/* <Td borderRight="1px" borderColor="gray.300">{camera.lastSeen}</Td> */}

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

                  <div style={{ display: "flex" }}>

                    <Button
                      onClick={() => recam(camera.deviceId)}
                      colorScheme="blue"
                      style={{ padding: 6 }}
                    >
                      {/* <MdDelete style={{ color: "rgb(200,0,0)" }} /> */}
                      Reboot
                    </Button>
                  </div>

                </Td>
              </Tr>
            ))}

          </Tbody>
        </Table>
        {currentPage}/{totalPages}
        <Button onClick={handlePrevClick} hidden={currentPage === 1}>
          Previous
        </Button>
        <Button onClick={handleNextClick} hidden={currentPage === totalPages}>
          Next
        </Button>
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
                  url={selectedCamera.url2}
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
    </Container>
  );
};

export default Tripura;
