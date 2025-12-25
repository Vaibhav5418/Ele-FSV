import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  Img,
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
} from "@chakra-ui/react";
import { ToastContainer, toast } from "react-toastify";
import {
  getAcdetails,
  getAiData,
  getAssemblyByNumber,
  getCamera,
  getCameraByDid,
  getCamerasByNumber,
  getDistrictDetails,
  getFullDid,
  getPsDetails,
  getPsLocation,
  getSetting,
  installCamera,
  removeEleCamera,
  setSetting,
  trackLiveLatLong,
  updateCamera,
} from "../actions/userActions";
import {
  MdArrowDropDown,
  MdDelete,
  MdEdit,
  MdVisibility,
} from "react-icons/md";
import withAuth from "./withAuth";
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from "video.js";
import "video.js/dist/video-js.css";
import ReactPlayer from "react-player";
import QRCodeScanner from "./QrCodeScanner";
import TawkToWidget from "./tawkto";
import { LuFlipHorizontal2, LuFlipVertical2 } from "react-icons/lu";
import Autosuggest from "react-autosuggest";
import { IoIosRefresh } from "react-icons/io";

const Ai = () => {
  const [address, setAddress] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [boothNo, setBoothNo] = useState("");
  const [excelLocation, setExcelLocation] = useState(" ");
  const [state, setState] = useState(" ");
  const [stateu, setStateu] = useState(" ");
  const [punjab, setPunjab] = useState(" ");
  const [tripura, setTripura] = useState(" ");

  const [prourl, setProurl] = useState("");

  useEffect(() => {
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

    const setSet = await setSetting(
      response.flvUrl.prourl,
      modifiedData.appSettings
    );
  };

  const refresh = () => {
    window.location.reload();
  };

  const [latie, setLatie] = useState("");
  const [longie, setLongie] = useState("");
  const namee = localStorage.getItem("name");
  const mobilee = localStorage.getItem("mobile");

  const [didList, setDidList] = useState([]);
  const did = async () => {
    try {
      const mobile = localStorage.getItem("mobile");
      const result = await getCamerasByNumber(mobile);
      setDidList(result.data);
    } catch (error) {
      // Handle error
    } finally {
    }
  };
  // page,district,assembly,psNo,location,HC
  const [cameraa, setCameraa] = useState([]);
  const [page, setPage] = useState(1);
  // const [district, setDistrict] = useState('');
  // const [assembly, setAssembly] = useState('');
  // const [psNo, setPsNo] = useState('');
  // const [location, setLocation] = useState('');

  // const handleDistrictChange =async  (event) => {
  //   const selectedDistrict = event.target.value;
  //   setDistrict(selectedDistrict);
  //   await camera(selectedDistrict, assembly,psNo,location);
  //   console.log(selectedDistrict)
  // };
  // const handleAssemblyChange =async  (event) => {
  //   const selectedAssembly = event.target.value;
  //   setAssembly(selectedAssembly);
  //   await camera(district, selectedAssembly,psNo,location);
  //   console.log(selectedAssembly)
  // };

  // const handlePsnoChange =async  (event) => {
  //   const selectedPsno = event.target.value;
  //   setPsNo(selectedPsno);
  //   await camera(district, assembly,selectedPsno,location);
  //   console.log(selectedPsno)
  // };

  // const handleLocationChange =async  (event) => {
  //   const selectedLocation = event.target.value;
  //   setLocation(selectedLocation);
  //   await camera(district, assembly,psNo,selectedLocation);
  //   console.log(selectedLocation)
  // };

  function exportToExcel() {
    const confirmExport = window.confirm(
      "Are you sure you want to export the data?"
    );

    if (confirmExport) {
      var tableClone = document.getElementById("data-table").cloneNode(true);

      // Iterate through each row and remove the last cell (Actions column)
      var rows = tableClone.getElementsByTagName("TableRow");
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
      var formattedDateTime =
        pad(day) +
        "-" +
        pad(month) +
        "-" +
        year +
        "_" +
        pad(hours) +
        ":" +
        pad(minutes) +
        ":" +
        pad(seconds);

      // Create Excel file with current date and time in the file name
      var uri =
        "data:application/vnd.ms-excel;base64," +
        btoa(unescape(encodeURIComponent(html)));
      var link = document.createElement("a");
      link.href = uri;
      link.download = "data_" + formattedDateTime + ".xls"; // Include formatted date and time in the file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Function to pad single-digit numbers with leading zeros
  function pad(number) {
    if (number < 10) {
      return "0" + number;
    }
    return number;
  }

  const [totalPage, setTotalPage] = useState("");
  const camera = async (selectedDistrict, selectedAssembly, psNo) => {
    try {
      const result = await getAiData(
        page,
        selectedDistrict,
        selectedAssembly,
        psNo
      );
      console.log("cameras data", result);
      setCameraa(result.allData);
      setTotalPage(result.totalPages);
    } catch (error) {
      // Handle error
    } finally {
    }
  };

  useEffect(() => {
    handleLocationChange();
    camera();
  }, [page]); // Empty dependency array to run the effect only once

  const handleNextClick = async () => {
    setPage((prevPage) => prevPage + 1);
  };

  // Function to handle previous button click
  const handlePrevClick = async () => {
    setPage((prevPage) => prevPage - 1);
  };

  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [assemblyName, setAssemblyName] = useState("");

  const [deviceWidth, setDeviceWidth] = useState(window.innerWidth);

  const [assembly, setAssembly] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState([]);

  const handleLocationChange = async (selectedLocation) => {
    const locationString = "GOA";
    setState(locationString); // Update state
    try {
      const acDetails = await getDistrictDetails(locationString);

      const districtData = acDetails.data.map((item) => item.district);
      setDistricts(districtData);

      console.log(districtData);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };

  const handleAcChange = async (selectedLocation) => {
    setSelectedDistrict(selectedLocation); // Update state
    setDistrict(selectedLocation);
    console.log(selectedLocation);
    try {
      await camera(selectedLocation);
      const acDetails = await getAcdetails(state, selectedLocation);

      const assemblyData = acDetails.data.map((item) => item.assemblyName);
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
      await camera(selectedDistrict, selectedLocation);
      const acDetails = await getPsDetails(
        state,
        selectedDistrict,
        selectedLocation
      );

      const psData = acDetails.data.map((item) => item.psNo);
      setPsNo(psData);

      console.log("psData", acDetails);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };

  const [psLocation, setPsLocation] = useState([]);
  const [psNumber, setPsNumber] = useState([]);

  const handlePsLocation = async (selectedLocation) => {
    // setState(selectedLocation); // Update state
    setPsNumber(selectedLocation);
    try {
      console.log(selectedDistrict, assemblyName, selectedLocation);
      await camera(selectedDistrict, assemblyName, selectedLocation);
      const acDetails = await getPsLocation(
        state,
        selectedDistrict,
        selectedPs,
        selectedLocation
      );

      const psLocations = acDetails.data.map((item) => item.location);
      setPsLocation(psLocations[0]);
      // setInstallLocation(acDetails.data[0])

      console.log("ps location", psLocations);
      // Handle the response from the API as needed
    } catch (error) {
      console.error(error);
      // Handle errors
    }
  };
  // Event listener to update device width on window resize
  const handleResize = () => {
    setDeviceWidth(window.innerWidth);
  };

  // Attach event listener on component mount
  useEffect(() => {
    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = (imgUrl) => {
    setSelectedImage(imgUrl);
    setIsModalOpen(true);
  };

  const handleCloseModall = () => {
    setIsModalOpen(false);
  };

  return (
    <Container
      maxW="98vw"
      p={4}
      px={{ base: "0", sm: "8" }}
      style={{ margin: "0px" }}
    >
      {" "}
      {/*  py={{ base: '12', md: '24' }} */}
      <ToastContainer />
      <div
        style={{
          position: "fixed",
          bottom: "20px", // Adjust as needed for desired vertical position
          right: "20px", // Adjust as needed for desired horizontal position
        }}
      >
        <TawkToWidget />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "fixed",
          bottom: "20px", // Adjust as needed for desired vertical position
          left: "20px", // Adjust as needed for desired horizontal position
        }}
      >
        {/* <Button onClick={refresh}>
          <IoIosRefresh />&nbsp;Refresh
        </Button> */}
        <Button
        bg="black"
          color="white"
          // startIcon={<ArrowDownOnSquareIcon />}
          onClick={exportToExcel}
        >
          Export
        </Button>
      </div>
      <TableContainer w={"full"}>
        <Table
          variant="striped"
          colorScheme="teal"
          borderWidth="1px"
          borderColor="gray.200"
          id="data-table"
        >
          <TableCaption>Your Installed Camera List</TableCaption>
          <Thead>
            <Tr>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                Sr.No.
              </Th>

              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                <Select
                  id="district"
                  onChange={(e) => handleAcChange(e.target.value)}
                >
                  <option style={{ color: "black" }} value="">
                    Select District
                  </option>
                  {districts?.map((district, index) => (
                    <option
                      key={index}
                      style={{ color: "black" }}
                      value={district}
                    >
                      {district}
                    </option>
                  ))}
                </Select>
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                <Select
                  id="district"
                  onChange={(e) => handlePsChange(e.target.value)}
                >
                  <option style={{ color: "black" }} value="">
                    Select Assembly
                  </option>
                  {assembly?.map((assembly, index) => (
                    <option
                      style={{ color: "black" }}
                      key={index}
                      value={assembly}
                    >
                      {assembly}
                    </option>
                  ))}
                </Select>
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                <Select
                  id="district"
                  onChange={(e) => handlePsLocation(e.target.value)}
                >
                  <option style={{ color: "black" }} value="">
                    Select PsNo
                  </option>
                  {psNo?.map((district, index) => (
                    <option
                      style={{ color: "black" }}
                      key={index}
                      value={district}
                    >
                      {district}
                    </option>
                  ))}
                </Select>
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                <Input
                  disabled
                  value={psLocation}
                  style={{ color: "white" }}
                  onChange={(e) => setPsLocation(e.target.value)}
                  placeholder="Location"
                />
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                Device ID
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                Human Count
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                Time
              </Th>
              <Th
                borderRight="1px"
                borderColor="gray.300"
                bgColor="black"
                color="white"
              >
                Image
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {cameraa?.map((camera, index) => (
              <Tr key={camera.id} bg={index % 2 === 0 ? "gray.100" : "white"}>
                <Td borderRight="1px" borderColor="gray.300">
                  {index + 1}
                </Td>
                <Td borderRight="1px" borderColor="gray.300">
                  {camera.district}
                </Td>
                <Td borderRight="1px" borderColor="gray.300">
                  {camera.assemblyName}
                </Td>

                <Td borderRight="1px" borderColor="gray.300">
                  {camera.psNo}
                </Td>
                <Td borderRight="1px" borderColor="gray.300">
                  {camera.location}
                </Td>
                <Td borderRight="1px" borderColor="gray.300">
                  {camera.cameraid}
                </Td>
                <Td borderRight="1px" borderColor="gray.300">
                  {camera.ImgCount}
                </Td>
                <Td borderRight="1px" borderColor="gray.300">
                  {camera.sendtime}
                </Td>
                <Td>
                  <Img
                    borderRight="1px"
                    borderColor="gray.300"
                    src={camera.imgurl}
                    maxW="100px" // Set maximum width
                    maxH="100px" // Set maximum height
                    objectFit="cover" // Maintain aspect ratio and cover container
                    cursor="pointer" // Set cursor to pointer to indicate clickable
                    onClick={() => handleImageClick(camera.imgurl)} // Handle image click
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Box display="flex" flexDirection="column">
          {page}/{totalPage}
          <Box display="flex">
            <Button onClick={handlePrevClick} hidden={page === 1}>
              Previous
            </Button>
            <Button onClick={handleNextClick} hidden={page === totalPage}>
              Next
            </Button>
          </Box>
        </Box>
      </TableContainer>
      <Modal isOpen={isModalOpen} onClose={handleCloseModall}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody style={{ padding: "10%" }}>
            {selectedImage && <Img src={selectedImage} alt="Selected" />}
          </ModalBody>
        </ModalContent>
      </Modal>
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
                  <Button
                    colorScheme="blue"
                    mt={4}
                    onClick={() =>
                      handleGetData(selectedCamera.deviceId, "flip")
                    }
                  >
                    Flip &nbsp;
                    <LuFlipVertical2 />
                  </Button>
                  <Button
                    colorScheme="blue"
                    mt={4}
                    onClick={() =>
                      handleGetData(selectedCamera.deviceId, "mirror")
                    }
                  >
                    Mirror &nbsp;
                    <LuFlipHorizontal2 />
                  </Button>
                </Flex>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default withAuth(Ai);
