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
import { getAcdetails, getBiharReport, getBiharReportUser, getCamera, getCameraByDid, getCamerasByNumber, getDistrictDetails, getElectionUserPage, getFullDid, getSetting, getSixDistrictDataBihar, installCamera, removeEleCamera, setSetting, trackLiveLatLong, updateCamera } from '../actions/userActions';
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

const EleUserDetail = () => {
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

  // Empty dependency array to run the effect only once


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

  // Trigger the effect whenever name, mobile, or location change

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
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateName, setStateName] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [biharTotal, setBiharTotal] = useState(0);
  const [lastHour, setLastHour] = useState(0);

  const camera = async () => {
    try {
      const mobile = localStorage.getItem('mobile');
      const result = await getElectionUserPage(currentPage, search, stateName);
      console.log("cameras data", result)
      setCameraa(result.data)
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setLastHour(result.lastHour);
    } catch (error) {
      // Handle error
    }
    finally {
    }
  };

  const [districts, setDistricts] = useState([]);
  const [sixDistricts, setSixDistricts] = useState([]);
  const details = async () => {
    try {
      const result = await getBiharReport();
      const result1 = await getSixDistrictDataBihar();
      console.log("districts data 0", result.data[0].addresses)
      console.log("districts data", result1.data)
      setDistricts(result.data[0].addresses);
      setSixDistricts(result1.data);
      setBiharTotal(result.data[0].overall_count);
    } catch (error) {
      // Handle error
    }
    finally {
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
    camera();
    details();
  }, [currentPage]);
  // useEffect(() => {
  //   allBox();
  // }, []);


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

  function exportToExcel() {
    const confirmExport = window.confirm("Are you sure you want to export the data?");

    if (confirmExport) {

      var tableClone = document.getElementById('data-table').cloneNode(true);

      // Iterate through each row and remove the last cell (Actions column)
      var rows = tableClone.getElementsByTagName('TableRow');
      for (var i = 0; i < rows.length; i++) {
        var lastCell = rows[i].lastElementChild;
        if (lastCell) {
          lastCell.parentNode.removeChild(lastCell);
        }
      }

      var html = tableClone.outerHTML;

      // Get the current date and time
      var now = new Date();
      var year = now.getFullYear();
      var month = now.getMonth() + 1;
      var day = now.getDate();
      var hours = now.getHours();
      var minutes = now.getMinutes();
      var seconds = now.getSeconds();

      // Format the date and time to be included in the file name
      // var formattedDateTime = year + '-' + pad(month) + '-' + pad(day) + '_' + pad(hours) + '-' + pad(minutes) + '-' + pad(seconds);
      var formattedDateTime = pad(day) + '-' + pad(month) + '-' + year + '_' + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);

      // Create Excel file with current date and time in the file name
      var uri = 'data:application/vnd.ms-excel;base64,' + btoa(unescape(encodeURIComponent(html)));
      var link = document.createElement('a');
      link.href = uri;
      link.download = 'data_' + formattedDateTime + '.xls'; // Include formatted date and time in the file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Function to pad single-digit numbers with leading zeros
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  return (
    <Container maxW="98vw" p={4} px={{ base: '0', sm: '8' }} style={{ margin: "0px" }}> {/*  py={{ base: '12', md: '24' }} */}
      <ToastContainer />
      {/* <div style={{
        position: 'fixed',
        bottom: '20px', // Adjust as needed for desired vertical position
        right: '20px', // Adjust as needed for desired horizontal position
      }}>
        <TawkToWidget />
      </div> */}
      <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gridGap="2">
        <Box></Box>
        <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
          <Text fontWeight="bold" mb="2">Total</Text>
          <Box bg='#68B187' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
            {total}
          </Box>
        </Box>
        <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
          <Text fontWeight="bold" mb="2">Bihar</Text>
          <Box bg='#68B187' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
            {biharTotal}
          </Box>
        </Box>

        {/* <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
          <Text fontWeight="bold" mb="2">Last Hour</Text>
          <Box bg='#db7a39' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
            {lastHour}
          </Box>
        </Box> */}

        <Box ></Box>


      </Box>
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

        <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gridGap="2" mt={8}>

          {sixDistricts.map((state, index) => (
            // <Box key={index} stateData={state}>{state.state}</Box>
            <Box borderWidth="1px" borderRadius="lg" key={index} display='flex' flexWrap='wrap' flexDirection='column' alignItems='center' justifyContent='center'>
              {/* <Text fontWeight="bold" mb="2">{state.state}</Text> */}
              <Link to={`/bihar/${state._id}`}>
                <Text fontWeight="bold" cursor="pointer">{state._id}</Text>
              </Link>

              {/* <Box display='flex' w='100%' alignItems='center' justifyContent='center'> */}
              <Box bg='#db7a39' p={1} m={1} w='full' color='white' display='flex' alignItems='center' justifyContent='center'>
                {state.count}
              </Box>
              {/* <Box bg='#db7a39' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                      {state.installedCameras}
                  </Box>
                  <Box bg='#68B187' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                      {state.totalLiveCamera}
                  </Box>
                  <Box bg='#D54D4D' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                      {state.totalOfflineCamera}
                  </Box> */}
              {/* </Box> */}
            </Box>
          ))}
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gridGap="2" mt={8}>

          {districts.map((state, index) => (
            // <Box key={index} stateData={state}>{state.state}</Box>
            <Box borderWidth="1px" borderRadius="lg" key={index} display='flex' flexWrap='wrap' flexDirection='column' alignItems='center' justifyContent='center'>
              {/* <Text fontWeight="bold" mb="2">{state.state}</Text> */}
              <Link to={`/bihar/${state._id}`}>
                <Text fontWeight="bold" cursor="pointer">{state._id}</Text>
              </Link>

              {/* <Box display='flex' w='100%' alignItems='center' justifyContent='center'> */}
              <Box bg='rgba(35,106,141,0.8)' p={1} m={1} w='full' color='white' display='flex' alignItems='center' justifyContent='center'>
                {state.total_count}
              </Box>
              {/* <Box bg='#db7a39' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.installedCameras}
                            </Box>
                            <Box bg='#68B187' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalLiveCamera}
                            </Box>
                            <Box bg='#D54D4D' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalOfflineCamera}
                            </Box> */}
              {/* </Box> */}
            </Box>
          ))}
        </Box>


        <br />
        <br />
        <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box display='flex'>
            <Text display='flex' alignItems='center'>Filter:&nbsp;</Text>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Input borderColor='blue.800' value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mobile" />
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
              <Input borderColor='blue.800' value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" />
            </div>
            <Button color='white' bgColor="blue.800" _hover={{ bgColor: 'blue.700' }} onClick={handleSearchClick}>
              Search
            </Button>
          </Box>
          <Box>
            <Button onClick={exportToExcel} color='white' bgColor="orange.500" _hover={{ bgColor: 'blue.900' }}>
              Export
            </Button>
          </Box>

        </Box>
        <br />

        <TableContainer w={'full'}>
          <Table id="data-table" variant='striped' colorScheme='teal' borderWidth="1px" borderColor="gray.200">
            <TableCaption>Your Installed Camera List</TableCaption>
            <Thead>
              <Tr>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Sr.No.</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Name</Th>
                {/* bgColor="blue.800" <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>live</Th> */}
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Mobile</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>State</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Lat</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Long</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>District</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Formatted_Address</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Date</Th>
                <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Time</Th>

                {/* <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Edit/Delete</Th> */}
              </Tr>
            </Thead>
            <Tbody>
              {cameraa.map((camera, index) => (
                <Tr key={camera.id} bg={index % 2 === 0 ? 'gray.100' : 'white'}>
                  <Td borderRight="1px" borderColor="gray.300">{index + 1}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.name}</Td>

                  {/* <Td borderRight="1px" borderColor="gray.300">{camera.status === "RUNNING" ? (
                      <span>🟢</span>
                    ) : (
                      <span>🔴</span>
                    )}</Td> */}

                  <Td borderRight="1px" borderColor="gray.300">{camera.mobile}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.state}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.latitude}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.longitude}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.formatted_address}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.formatted_address1}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.date}</Td>
                  <Td borderRight="1px" borderColor="gray.300">{camera.time}</Td>

                  {/* <Td borderRight="1px" borderColor="gray.300"> <IconButton
                      marginLeft={2}
                      marginRight={2}
                      onClick={() => handleViewCamera(camera)}
                      colorScheme="blue"
                      style={{ padding: 0, transform: 'scale(0.8)' }}
                      aria-label="View details"
                    >
                      <MdVisibility />
                    </IconButton> </Td> */}
                  {/* <Td borderRight="1px" borderColor="gray.300">
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
                        </div>
                      </>
                    )}
                  </Td> */}
                </Tr>
              ))}

            </Tbody>

          </Table>
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
            {currentPage}/{totalPages}
            <Button onClick={handlePrevClick} hidden={currentPage === 1}>
              Previous
            </Button>
            <Button onClick={handleNextClick} hidden={currentPage === totalPages}>
              Next
            </Button>
          </Box>
        </TableContainer>

      </>

    </Container>
  );
};

export default withAuth(EleUserDetail);
