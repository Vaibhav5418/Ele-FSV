 import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import logo from "./images/logo/cam.png";
import Delete from "./images/logo/deleteicon.png";
import Trash from "./images/logo/Trash.png";
import { FiList } from "react-icons/fi";
import * as FileSaver from "file-saver";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { Filesystem, Directory } from '@capacitor/filesystem';
// import "./auto-installer.css";
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
  Tooltip,
  Checkbox,
  border, // Import Checkbox from Chakra UI
  Box,
  Image,
  Grid,
  Center,
  Collapse,
  Heading,
} from "@chakra-ui/react";
import { ToastContainer, toast } from "react-toastify";
import {
  getAcdetails,
  getCamera,
  getCameraByDid,
  getCamerasByNumber,
  getDistrictDetails,
  getFullDid,
  getSetting,
  installCamera,
  removeEleCamera,
  setSetting,
  trackLiveLatLong,
  updateCamera,
  getCameraStatus,
   setIsEdited,
   searchFsvDevice,
   getFsvSuggestions
} from "../actions/userActions"; // Import the new action
import { MdDelete, MdEdit, MdVisibility, MdDashboard } from "react-icons/md";
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
import { FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
//import { FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa"; // Import sorting icons
import sortIcon from "./images/logo/sort.png"; // Import the image
import line from "./images/logo/line.png";
import expand from "./images/logo/expand.png";
import { useLocation } from 'react-router-dom';
import FsvPhotoUpload from './FsvPhotoUpload';
import FsvInstallationForm from './FsvInstallationForm';

const AutoInstaller = () => {
  const locationHook = useLocation();
  const fsvVehicleId = locationHook.state?.fsvVehicleId;
  const fsvFormData = locationHook.state?.fsvFormData;
  // State
  const [expandedCameraId, setExpandedCameraId] = useState(null);

  const handleToggleExpand = (id) => {
    setExpandedCameraId((prevId) => (prevId === id ? null : id));
  };
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [boothNo, setBoothNo] = useState("");
  const [excelLocation, setExcelLocation] = useState(" ");
  const [state, setState] = useState(" ");
  const [stateu, setStateu] = useState(" ");
  const [punjab, setPunjab] = useState(" ");
  const [tripura, setTripura] = useState(" ");
  const [isEditing, setIsEditing] = useState(false); // NEW: Editing state
  const [prourl, setProurl] = useState("");

  // NEW STATE VARIABLES
  const [cameraStatus, setCameraStatus] = useState(null);
  const [blurChecked, setBlurChecked] = useState(false);
  const [blackviewChecked, setBlackviewChecked] = useState(false);
  const [brightnessChecked, setBrightnessChecked] = useState(false);
  const [blackAndWhiteChecked, setBlackAndWhiteChecked] = useState(false);
  const [cameraAngleAcceptable, setCameraAngleAcceptable] = useState(true);
  const [hasClickedCameraDidInfo, setHasClickedCameraDidInfo] = useState(false); // Track button click
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const [isFetchingCameraDetails, setIsFetchingCameraDetails] = useState(false); // New state for fetching status
  const [fsvData, setFsvData] = useState(null); // New state for FSV Data

  const [videoError, setVideoError] = useState(false); // New state for video error
  const [originalFlvUrl, setOriginalFlvUrl] = useState(""); // Store original URL for AI Analytics

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState(null);
  // useRef to hold the interval ID
  const toastInterval = useRef(null);

  // useRef to hold the interval ID for camera status polling
  const cameraStatusInterval = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const camerasPerPage = 5; // Adjust as needed
  const [cameraa, setCameraa] = useState([]); // Keep cameraa as state
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const totalCameras = cameraa.length;
  const totalPages = Math.ceil(totalCameras / camerasPerPage); // Calculate the number of pages

    const openDeleteModal = (cameraId) => {
    setCameraToDelete(cameraId);
    setIsDeleteModalOpen(true);
  };

    // Function to close the confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCameraToDelete(null); // Clear the camera ID
  };

  useEffect(() => {
    camera();
    did();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          setLatie(latitude);
          setLongie(longitude);

          setLocation({ latitude, longitude });

          try {
            const responsee = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`
            );
            setAddress(responsee.data.results[0].formatted_address);
            setStateu(
              responsee.data.plus_code.compound_code.split(",")[1].toUpperCase()
            );
          } catch (error) {
            console.error("Error fetching address:", error.message);
          }
        },
        (error) => {
          console.error("Error getting location:", error.message);
        }
      );
    } else {
      console.error("Geolocation is not supported by your browser.");
    }

    return () => {
      console.log(
        "AutoInstaller component unmounting OR deviceId changed. Clearing intervals."
      );
      clearInterval(toastInterval.current);
      clearInterval(cameraStatusInterval.current);
    };
  }, [deviceId]);
   const handleBackClick = () => {
    setShowAdditionalInputs(false);
    // Optionally clear any form fields or camera data here if needed
    setDeviceId(""); // Reset DeviceID
    setFlvUrl(""); // Reset video URL
    setCameraStatus(null); // Reset camera status
    setHasClickedCameraDidInfo(false); // Reset this state when adding new device
    clearInterval(cameraStatusInterval.current);
    clearInterval(toastInterval.current);
  };
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
  const filteredCameras = [...cameraa].sort((a, b) => {
    // If searchDeviceId is empty, keep normal order
    if (!searchDeviceId) return 0;

    const aMatch = a.deviceId.includes(searchDeviceId);
    const bMatch = b.deviceId.includes(searchDeviceId);

    // Put matching records at the top
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

const handleAddInputs = async () => {
  if (!deviceId) {
    toast.error("Please enter a Device ID first");
    return;
  }

  setShowAdditionalInputs(true);
  setHasClickedCameraDidInfo(true);
  clearInterval(cameraStatusInterval.current);
  clearInterval(toastInterval.current);

  setIsFetchingCameraDetails(true);

  try {
    const response = await getCameraByDid(deviceId);

    if (!response?.flvUrl?.url2) {
      // Try searching in FSV Data if standard camera search fails or even if it succeeds to get extra data
      // But for now, let's try to search FSV data first if the user intends to do FSV installation
    }

    // NEW: Search FSV Data
    try {
        const fsvResponse = await searchFsvDevice(deviceId);
        console.log("FSV Search Response:", fsvResponse); // DEBUG LOG

        if (fsvResponse.success && fsvResponse.fsvData) {
            setFsvData(fsvResponse.fsvData); // We need to create this state
            toast.success("FSV Data Found! Auto-filling form...");
            
            // If stream URL is also found in FSV search response
            if (fsvResponse.streamUrl?.url2) {
                 console.log("Setting FLV URL from FSV:", fsvResponse.streamUrl.url2); // DEBUG LOG
                 // Use Proxy to avoid CORS
                 const proxyUrl = `/election/api/fsv/proxy/stream?url=${encodeURIComponent(fsvResponse.streamUrl.url2)}`;
                 setVideoError(false); // Reset error state
                 setFlvUrl(proxyUrl);
                 setOriginalFlvUrl(fsvResponse.streamUrl.url2); // Store original for AI
                 // Also trigger the standard camera status polling if needed
                 startCameraStatusPolling(deviceId);
            } else if (fsvResponse.streamUrl?.RTMP_URL) {
                 // Fallback: Construct HTTP-FLV from RTMP if url2 is missing
                 // rtmp://server:80/live-record/streamname -> http://server:80/live-record/streamname.flv
                 const rtmp = fsvResponse.streamUrl.RTMP_URL;
                 const httpFlv = rtmp.replace('rtmp://', 'http://') + '.flv';
                 console.log("Constructed HTTP-FLV URL:", httpFlv); // DEBUG LOG
                 
                 // Use Proxy
                 const proxyUrl = `/election/api/fsv/proxy/stream?url=${encodeURIComponent(httpFlv)}`;
                 setVideoError(false); // Reset error state
                 setFlvUrl(proxyUrl);
                 setOriginalFlvUrl(httpFlv); // Store original for AI
                 
                 startCameraStatusPolling(deviceId);
            }
        }
    } catch (err) {
        console.log("FSV Search failed or no data", err);
    }

    if (!response?.flvUrl?.url2 && !flvUrl) { // Check flvUrl state as well
      toast.error(
        `Please Enter Full DeviceID 'OR' URL2 is not available, so contact Support`
      );
      setIsFetchingCameraDetails(false);
      return;
    }

    if (response?.flvUrl?.url2) {
         setFlvUrl(response.flvUrl.url2);
    }

    if (!response.success) {
      toast.error("Failed to get camera data");
      toast.error(
        "Plz connect support team before installing camera, from below right corner..."
      );
      toast.warning("If testing camera than wait for the view");
      setIsFetchingCameraDetails(false);
      return;
    }

    if (response.data.state === "PUNJAB") {
      toast.error("State is PUNJAB. Refreshing the page...");
      setTimeout(() => {
        window.location.reload();
      }, 100);
      setIsFetchingCameraDetails(false);
      return;
    }

    const fetchedState = response.data.state;
    const fetchedAssemblyName = response.data.assemblyName;
    const fetchedPsNumber = response.data.psNo;
    const fetchedDistrict = response.data.district;
    const fetchedExcelLocation = response.data.location;

    setState(fetchedState);
    setAssemblyName(fetchedAssemblyName);
    setPsNumber(fetchedPsNumber);
    setDistrict(fetchedDistrict);
    setExcelLocation(fetchedExcelLocation);

    sendUrlToExternalApi(response.flvUrl.url2);
    startCameraStatusPolling(deviceId);

    // **Wait for State to Update (Important!)**
    await new Promise((resolve) => setTimeout(resolve, 100)); // Adjust time as needed

    // **Call the Submission Logic Directly:**
    try {
      let latitude = location.latitude;
      let longitude = location.longitude;

      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString("en-GB");
      const formattedTime = currentTime.toLocaleTimeString("en-US", {
        hour12: false,
      });

      let installed_status = 1;
      let status = "RUNNING";

      const installResponse = await installCamera(
        deviceId,
        namee,
        mobilee,
        fetchedAssemblyName,
        fetchedPsNumber,
        fetchedState,
        fetchedDistrict,
        fetchedExcelLocation,
        latitude,
        longitude,
        installed_status,
        status,
        formattedDate,
        formattedTime,
      );

      console.log("response of installCamera", installResponse);
      camera(); // Update the camera list

      // **Crucially, DO NOT clear the form or hide it.**
      // setState("");
      // setDistrict("");
      // setAssemblyName("");
      // setPsNumber("");
      // setExcelLocation("");
      // setShowAdditionalInputs(false);  //<---REMOVE THIS
      setIsEditing(false);

      // Call the new API endpoint to update isEdited
      if (isEditing) {
        await setIsEdited(deviceId); // Call the new API function
      }

    } catch (error) {
      console.error(error);
    }

  } catch (error) {
    console.error("Error in handleAddInputs:", error);
    // Handle errors appropriately (e.g., display an error message)
  } finally {
    setIsFetchingCameraDetails(false);
  }
};
const downloadReport = async () => {
  const exportData = cameraa.map((camera) => ({
    "Device ID": camera.deviceId,
    District: camera.district,
    "Assembly Name": camera.assemblyName,
    "PS No.": camera.psNo,
    Location: camera.location,
    "Last Seen": camera.lastSeen,
    Status: camera.status,
    "Is Edited": camera.isEdited,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Camera Report");

  // Detect if running inside Capacitor native app
  const isNative = window.Capacitor?.isNativePlatform?.();

  if (isNative) {
    // ✅ Native mobile: Save file in app's Documents directory
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    try {
      const result = await Filesystem.writeFile({
        path: 'camera_report.xlsx',
        data: wbout,
        directory: Directory.Documents,
      });
      console.log('✅ Excel report saved to:', result.uri);
      alert('Camera report saved successfully on your device >> Go to files >> Documents');
    } catch (error) {
      console.error('❌ Error saving Excel file:', error);
      alert('Failed to save report.');
    }
  } else {
    // 🌐 Web browser: trigger normal file download
    XLSX.writeFile(wb, 'camera_report.xlsx');
  }
};
  const startCameraStatusPolling = (deviceId) => {
    setCameraStatus(undefined); // Set to undefined when polling starts
    fetchCameraStatus(deviceId);

    cameraStatusInterval.current = setInterval(() => {
      fetchCameraStatus(deviceId);
    }, 15000);
  };

  const fetchCameraStatus = async (deviceId) => {
    const toastStyle = {
      fontSize: "12px", // Smaller font
      padding: "8px 12px", // Reduced padding
      height: "3%",
      width: "80%",
    };
    try {
      const status = await getCameraStatus(deviceId);

      if (status.success === false) {
        console.log("Api status false");
        setCameraStatus(null);
        setIsFetchingCameraDetails(false);
        return;
      } else {
        console.log("Api status true");
        setCameraStatus(status);
        setBlurChecked(status.blur);
        setBlackviewChecked(status.blackview);
        setBrightnessChecked(status.brightness);
        setBlackAndWhiteChecked(status.BlackAndWhite);
        const cameraAngle = Math.abs(status.camera_angle);
        setCameraAngleAcceptable(cameraAngle <= 15);
        setIsFetchingCameraDetails(false);

  //       if (cameraAngle > 15) {
  //         if (!toastInterval.current) {
  //           toastInterval.current = setInterval(() => {
  //             toast.warn(
  //               "Try to adjust the angle of camera. The angle of camera should be in range of 0-15 degree",
  //               {
  //                 position: "top-right",
  //                 autoClose: 5000,
  //                 hideProgressBar: false,
  //                 closeOnClick: true,
  //                 pauseOnHover: true,
  //                 draggable: true,
  //                 style: toastStyle, // Apply inline styles here
  //               }
  //             );
  //           }, 9000);
  //         }
  //       } else {
  //         clearInterval(toastInterval.current);
  //         toastInterval.current = null;
  //       }
  //     }

  //     if (status.blur) {
  //       toast.warn("Camera is blur, try to fix it!", {
  //         position: "top-right",
  //         autoClose: 5000,
  //         hideProgressBar: false,
  //         closeOnClick: true,
  //         pauseOnHover: true,
  //         draggable: true,
  //       });
  //     }
  //     if (status.blackview) {
  //       toast.warn("Camera having black view, try to fix it!", {
  //         position: "top-right",
  //         autoClose: 5000,
  //         hideProgressBar: false,
  //         closeOnClick: true,
  //         pauseOnHover: true,
  //         draggable: true,
  //       });
  //     }
  //     if (!status.brightness) {
  //       toast.warn("Check the brightness of the camera!", {
  //         position: "top-right",
  //         autoClose: 5000,
  //         hideProgressBar: false,
  //         closeOnClick: true,
  //         pauseOnHover: true,
  //         draggable: true,
  //       });
  //     }
  //     if (status.BlackAndWhite) {
  //       toast.warn("Camera is black and white!", {
  //         position: "top-right",
  //         autoClose: 5000,
  //         hideProgressBar: false,
  //         closeOnClick: true,
  //         pauseOnHover: true,
  //         draggable: true,
  //       });
   }
    } catch (error) {
      console.error("Error fetching camera status:", error);
      setIsFetchingCameraDetails(false);
    }
  };

  const sendUrlToExternalApi = async (url2) => {
    // Use originalFlvUrl if available (for FSV flow), otherwise use the passed url2 (for legacy flow)
    const targetUrl = originalFlvUrl || url2;
    
    if (!targetUrl) {
        console.error("No URL available for AI Analytics");
        return;
    }

    try {
      let rtmpUrl = targetUrl.replace("https", "rtmp");

      const url = new URL(rtmpUrl);
      const hostname = url.hostname;

      if (!hostname.includes(":")) {
        rtmpUrl = rtmpUrl.replace(hostname, `${hostname}:80`);
      }

      rtmpUrl = rtmpUrl.replace(".flv", "");

      console.log("Transformed URL:", rtmpUrl);

      const postData = { rtmp: rtmpUrl };
      console.log("My data is", postData);

      const response = await axios.post(
        "https://installerapp.vmukti.com:8443/analyze-camera",
        postData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("External API Response:", response.data);
      toast.success("Successfully Fetched Camera Status", {
        position: "top-right",
        autoClose: 3500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error sending URL to external API:", error);
    }
  };

  const refresh = () => {
    window.location.reload();
  };

   const handleDeleteClickConfirmed = async () => {
    try {
      // Only proceed if a camera ID is actually stored
      if (cameraToDelete) {
        console.log("Deleting camera with ID:", cameraToDelete);
        const response = await removeEleCamera(cameraToDelete);
        camera(); // Refresh camera list
      }
    } catch (error) {
      console.error("Error deleting camera:", error);
      // Handle error (e.g., display an error message to the user)
    } finally {
      closeDeleteModal(); // Close the modal after deletion (or error)
    }
  };

  const [latie, setLatie] = useState("");
  const [longie, setLongie] = useState("");
  const namee = localStorage.getItem("name");
  const mobilee = localStorage.getItem("mobile");
  const handleSubmit = async () => {
    try {
      let latitude = location.latitude;
      let longitude = location.longitude;

      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString("en-GB");
      const formattedTime = currentTime.toLocaleTimeString("en-US", {
        hour12: false,
      });

      let installed_status = 1;
      let status = "RUNNING";

      console.log(
        "Submitted:",
        deviceId,
        namee,
        mobilee,
        assemblyName,
        psNumber,
        state,
        district,
        excelLocation,
        latitude,
        longitude,
        installed_status,
        status,
      );
      const response = await installCamera(
        deviceId,
        namee,
        mobilee,
        assemblyName,
        psNumber,
        state,
        district,
        excelLocation,
        latitude,
        longitude,
        installed_status,
        status,
        formattedDate,
        formattedTime,      );

      console.log("response of submit", response);
      camera();
      setState("");
      setDistrict("");
      setAssemblyName("");
      setPsNumber("");
      setExcelLocation("");
      setShowAdditionalInputs(false);
      setIsEditing(false);

      // Call the new API endpoint to update isEdited
      if (isEditing) {
        await setIsEdited(deviceId); // Call the new API function
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    trackData();
  }, [namee, mobilee, latie, longie]);

  const trackData = async () => {
    try {
      let latitude = location.latitude;
      let longitude = location.longitude;
      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString("en-GB");
      const formattedTime = currentTime.toLocaleTimeString("en-US", {
        hour12: false,
      });
      const responsee = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`
      );

      const statename = responsee.data.plus_code.compound_code
        .split(", ")[1]
        .toUpperCase();
      const formatted_address = responsee.data.results[6].formatted_address;
      const formatted_address1 = responsee.data.results[7].formatted_address;
      const formatted_address2 = responsee.data.results[8].formatted_address;
      console.log("lala", responsee.data);
      const result = await trackLiveLatLong(
        namee,
        mobilee,
        latitude,
        longitude,
        formattedDate,
        formattedTime,
        statename,
        formatted_address,
        formatted_address1,
        formatted_address2
      );
    } catch (error) {
      console.error("Error tracking data:", error);
    }
  };

  const [editableCameraID, setEditableCameraID] = useState(null);

  const [live, setLive] = useState(0);

  const handleEditClick = (itemId) => {
    console.log(itemId);
    setEditableCameraID(itemId);
  };

  const handleUpdateClick = async (id) => {
    try {
      console.log("getId", id);
      console.log("live:", live);
      const response = await updateCamera(id, live);
      console.log("Consignment updated successfully:", response.data);
      setEditableCameraID(0);
      camera();
    } catch (error) {
      console.error("Error updating consignment:", error);
    }
  };

  const [didList, setDidList] = useState([]);
  const did = async () => {
    try {
      const mobile = localStorage.getItem("mobile");
      const result = await getCamerasByNumber(mobile);
      setDidList(result.data);
    } catch (error) {
    } finally {
    }
  };

 const camera = async () => {
    try {
      const mobile = localStorage.getItem("mobile");
      const result = await getCamera(mobile);
      console.log("Data from API:", result.data); // Add this line
      console.log("cameras data", result.data);

      // Initial sort when data is fetched
      const sortedData = [...result.data].sort((a, b) =>
        a.deviceId.localeCompare(b.deviceId)
      );

      setCameraa(sortedData);
      setCurrentPage(1); // Reset to first page when camera data updates
    } catch (error) {
    } finally {
    }
  };

  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);

  const handleAddNewDeviceClick = () => {
    setShowAdditionalInputs(true); // Show the inputs
    setHasClickedCameraDidInfo(false); // Reset this state when adding new device
    setCameraStatus(null); // Reset camera status
    setDeviceId(""); // Reset device ID
    setFlvUrl(""); // Reset video URL
  };
  const [assemblyName, setAssemblyName] = useState("");
  const [flvUrl, setFlvUrl] = useState("");
  const [psNumber, setPsNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [realLocation, setRealLocation] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const [deviceWidth, setDeviceWidth] = useState(window.innerWidth);

  const handleResize = () => {
    setDeviceWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
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

  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
   const autosuggestRef = useRef(null);

   const handleInputChange = async (event, { newValue, method }) => {
    setDeviceId(newValue);

    if (method === 'type') {
      // New Logic: Fetch suggestions from FSV API
      if (newValue.length >= 3) {
          setIsLoading(true);
          try {
              const response = await getFsvSuggestions(newValue);
              if (response.success) {
                  setSuggestions(response.suggestions);
              } else {
                  setSuggestions([]);
              }
          } catch (error) {
              console.error("Error fetching suggestions:", error);
              setSuggestions([]);
          } finally {
              setIsLoading(false);
          }
      } else {
          setSuggestions([]);
      }
    }
  };


  const handleSuggestionSelected = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
    setDeviceId(suggestionValue);
    setSuggestions([]); // Clear suggestions after selection
    if (autosuggestRef.current) {
        autosuggestRef.current.input.blur();
    }
  };

  const getSuggestionValue = (suggestion) => suggestion;
  const renderSuggestion = (suggestion) => <div>{suggestion}</div>;

  const inputProps = {
    placeholder: 'Enter Device ID',
    value: deviceId,
    onChange: handleInputChange,
    style: {
      width: '240px',
      height: '35px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: '#fff',
      boxShadow: 'inset 0 1px 2.4px rgba(0, 0, 0, 0.25)',
      color: 'black',
      fontFamily: "'Wix Madefor Text'",
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: 'normal',
    },
  };

  const BlinkingWarningIcon = () => {
    return (
      <FaExclamationTriangle
        color="orange"
        style={{
          animation: "blink-animation 1s steps(5, start) infinite",
        }}
      />
    );
  };

  //Css
  const customCSS = `
@keyframes blink-animation {
    to {
        visibility: hidden;
    }
}

.blink {
    visibility: visible;
    animation: blink-animation 1s steps(5, start) infinite;
}
`;

  // Pagination functions
  const handleClick = (page) => {
    setCurrentPage(page);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Calculate the start and end index for the current page
  const startIndex = (currentPage - 1) * camerasPerPage;
  const endIndex = Math.min(startIndex + camerasPerPage, totalCameras);

  // Get the cameras to display on the current page
  const camerasOnPage = cameraa.slice(startIndex, endIndex);

  // Sorting function
  const handleSort = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sortedData = [...cameraa].sort((a, b) => {
      const psNoA = a.psNo; // Access PS No. directly
      const psNoB = b.psNo;

      if (newSortOrder === "asc") {
        return psNoA - psNoB; // Sort numerically ascending
      } else {
        return psNoB - psNoA; // Sort numerically descending
      }
    });

    setCameraa(sortedData);
    setCurrentPage(1);
  };
  const HorizontalLine = () => (
    <Box width="100%" height="2px" background="#3F77A5" mb={2} />
  );

  return (
    <Container
      backgroundColor="#F4F4F5"
      maxW="100vw"
      p={4}

      style={{ margin: "0px", backgroundColor: "#F4F4F5" }}
    >
      <style>{customCSS}</style>
      <ToastContainer />
      <div style={{ position: "fixed", bottom: "20px", right: "20px" }}>
        <TawkToWidget />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "fixed",
          bottom: "20px",
          left: "20px",
        }}
      ></div>
      {location ? (
        <>
          {/* Conditional Rendering: Table Content Only if NOT Adding New Device AND NOT in FSV Flow */}
          {!showAdditionalInputs && !fsvVehicleId ? (
            <>
              {/* Pagination */}
              <Flex justify="center" mt={4} mb={5}>
                <Box
                  border="1px solid #7EA3C2"
                  borderRadius="10px"
                  display="inline-flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Button
                    onClick={() => handleClick(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    size="sm"
                    mr={2}
                    color="black"
                  >
                    Previous
                  </Button>

                  {pages.map((page) => (
                    <Button
                      key={page}
                      onClick={() => handleClick(page)}
                      size="sm"
                      mx={1}
                      fontFamily="Wix Madefor Text"
                      fontSize="12px"
                      fontWeight="400"
                      color="black"
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    onClick={() => handleClick(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    size="sm"
                    ml={2}
                    color="black"
                  >
                    Next
                  </Button>
                </Box>
              </Flex>

              <h3
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  }}
>
  <Box
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    }}
  >
    {/* Left side - Devices Added */}
    <Box style={{ textAlign: "left" }}>
      <Text
        style={{
          fontWeight: "700",
          fontFamily: "Inter !important",
          fontSize: "20px",
          lineHeight: "normal",
        }}
      >
        Devices Added - ({cameraa.length})
      </Text>
    </Box>

    {/* Right side - Buttons */}
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {localStorage.getItem('role') === 'master' && (
        <Button
          bg="#F4F4F5"
          fontSize="15px"
          height="35px"
          fontFamily="Wix Madefor Text"
          onClick={() => window.location.href = '/master-dashboard'}
          leftIcon={<MdDashboard />}
        >
          Dashboard
        </Button>
      )}

      {!showAdditionalInputs && cameraa.length > 0 && (
        <Button
          bg="#F4F4F5"
          fontSize="15px"
          height="35px"
          fontFamily="Wix Madefor Text"
          onClick={downloadReport}
          leftIcon={<FaFileExcel />}
        >
          Excel
        </Button>
      )}

      {/* Sort by + icon grouped together */}
      <Box style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
        <Text
          fontWeight="400"
          fontFamily="Wix Madefor Text"
          fontSize="13px"
          textDecoration="underline"
          textUnderlineOffset="2px"
        >
          Sort by
        </Text>
        <img
          src={sortIcon}
          alt="Sort"
          style={{
            width: "15px",
            height: "15px",
            cursor: "pointer",
          }}
          onClick={handleSort}
        />
      </Box>
    </Box>
  </Box>

  {/* Search Input */}
  <Box width="100%">
    <Input
      placeholder="Search by Device ID or Vehicle No."
      value={searchDeviceId}
      onChange={(e) => setSearchDeviceId(e.target.value)}
      bg="white"
      size="sm"
      borderRadius="md"
    />
  </Box>
</h3>

              {/* Manual Add Device Form Removed as per user request */}
              {/* Camera List Table */}
              {filteredCameras
                .slice(startIndex, endIndex)
                .map((camera, index) => (
                  <Box
                    key={camera.deviceId}
                    sx={{
                      borderTop: index === 0 ? "2px solid #3F77A5" : "none", // top border only for first
                      borderBottom:
                        index !==
                        filteredCameras.slice(startIndex, endIndex).length - 1
                          ? "2px solid #3F77A5"
                          : "none", // bottom border for all except last
                      pb: 2,
                    }}
                    mb={4}
                    p={4}
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Box>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontFamily: "Wix Madefor Text !important",
                            fontSize: "15px",
                            lineHeight: "24px",
                            fontStyle: "normal",
                            color: "#1A1A1A",
                          }}
                        >
                          Device ID: {camera.deviceId}
                        </Text>
                      </Box>
                      <Box
                        width="0"
                        height="18px"
                        flexShrink={0}
                        borderLeft="1px solid #1A1A1A"
                      />
                      <IconButton
                        aria-label="Expand/Collapse Details"
                        icon={
                          <Image
                            src={expand}
                            onClick={() => handleToggleExpand(camera.deviceId)}
                            alt="Expand"
                            sx={{
                              transform:
                                expandedCameraId === camera.id
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              transition: "transform 0.3s ease",
                            }}
                          />
                        }
                      />
                    </Flex>

                    {expandedCameraId === camera.deviceId && (
                      <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={2}>
                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            District
                          </Text>
                          <Text
                            style={{
                              fontWeight: "400",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            {camera.district}
                          </Text>
                        </Box>

                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            Assembly Name
                          </Text>
                          <Text
                            style={{
                              fontWeight: "400",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            {camera.assemblyName}
                          </Text>
                        </Box>

                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            PS No.
                          </Text>
                          <Text
                            style={{
                              fontWeight: "400",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            {camera.psNo}
                          </Text>
                        </Box>

                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            Location
                          </Text>
                          <Text
                            style={{
                              fontWeight: "400",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            {camera.location}
                          </Text>
                        </Box>

                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            Last Live
                          </Text>
                          <Text
                            style={{
                              fontWeight: "400",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            {camera.lastSeen}
                          </Text>
                        </Box>
                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          ></Text>
                          <Text
                            style={{
                              fontWeight: "400",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            {camera.lastSeen}
                          </Text>
                        </Box>

                        <Box>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontFamily: "Wix Madefor Text !important",
                              fontSize: "14px",
                              lineHeight: "24px",
                              fontStyle: "normal",
                              color: "#1A1A1A",
                            }}
                          >
                            Video Feed
                          </Text>
                          <IconButton
                            onClick={() => handleViewCamera(camera)}
                            colorScheme="blue"
                            size="sm"
                            aria-label="View"
                            icon={<MdVisibility />}
                          />
                        </Box>
                        <Box justifyContent="right" textAlign="right">
                          {editableCameraID === camera.id ? (
                            <Button
                              onClick={() => handleUpdateClick(camera.deviceId)}
                              colorScheme="green"
                              size="sm"
                            >
                              Update
                            </Button>
                          ) : (
                            <Button
              onClick={() => openDeleteModal(camera.deviceId)} // Open modal with camera ID
              colorScheme="red"
              size="sm"
            >
              <img
                src={Delete}
                alt="Camera Icon"
                width="20px"
                height="20px"
                style={{ objectFit: "contain" }}
              />
            </Button>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Box>
                ))}

                 <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay />
        <ModalContent
          borderRadius="10px"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
          border="2px solid #ADD8E6"
          maxWidth="400px"
        >
          <ModalHeader
            textAlign="center"
            fontSize="22px"
            fontWeight="bold"
            pb={2}
          >
            Are you sure you want to Delete?
          </ModalHeader>
          <ModalBody textAlign="center" pt={2}>
            <Center>
              <Image src={Trash} alt="Trash Icon" boxSize="50px" mb={4} />
            </Center>
            <Text fontSize="14px" color="gray.600" mb={4}>
              Deleting list will remove the information from our database.
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="space-around" p={6}>
            <Button
              onClick={handleDeleteClickConfirmed}
              bg="#558BBA"
              color="white"
              borderRadius="8px"
              px={6}
              _hover={{ bg: "#427299" }}
            >
              Delete
            </Button>
            <Button
              onClick={closeDeleteModal}
              bg="white"
              color="red"
              borderRadius="8px"
              px={6}
              border="1px solid red"
              _hover={{ bg: "gray.100" }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

              <h2
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  textAlign: "center",
                }}
              >
                <img width="37px" height="37px" src={logo} alt="Camera Icon" />
                {cameraa.length === 0
                  ? "No device added"
                  : "Your Installed Camera List"}
              </h2>
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
                          position="fixed"
                          width="355px"
                          height="197px"
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
            </>
          ) : (
            // Conditional Section: QR, Suggestion, and Camera DID Info
            <>
              {isMobileDevice && (
                <>
                  {" "}
                  <div style={{ textDecoration: "underline" }}>
                    <QRCodeScanner onScanSuccess={handleScanSuccess} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    OR
                  </div>

                <Box display="flex" justifyContent="flex-end" alignItems="center" ml="4px">
      <Tooltip
        label="List View"
        placement="right"
        hasArrow
        bg="#1A1A1A"
        color="white"
        fontFamily="Wix Madefor Text, sans-serif !important"
        fontSize="14px"
        borderRadius="6px"
        p="6px 10px"
        openDelay={100}
      >
        <IconButton
          icon={<FiList size={18} />}
          aria-label="List View"
          onClick={handleBackClick}
          bg="#F4F4F5"
          border="1px solid #DADADA"
          boxShadow="0px 1px 4px rgba(0,0,0,0.1)"
          borderRadius="8px"
          height="36px"
          width="4px"
          color="#1A1A1A"
          transition="all 0.25s ease"
         
        />
      </Tooltip>
    </Box>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap:"10px"
                }}
              >
                {/* <Text style={{ width: "120px" }}>DeviceID</Text> */}
                {suggestions && suggestions.length >= 0 ? (
                   <Autosuggest
      ref={autosuggestRef}
      suggestions={suggestions}
      onSuggestionsFetchRequested={({ value, reason }) => {
        if (reason === 'input-changed') {
          handleInputChange(null, { newValue: value, method: 'type' });
        }
      }}
      onSuggestionsClearRequested={() => setSuggestions([])}
      getSuggestionValue={getSuggestionValue}
      renderSuggestion={renderSuggestion}
      inputProps={inputProps}
      onSuggestionSelected={handleSuggestionSelected}
    />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Text>No Camera Found !</Text>
                    <Button onClick={refresh}>Go Back</Button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  borderRadius="8px"
                  background="#3F77A5"
                  width="200px"
                  height="35px"
                  marginBottom="5px"
                  color="white"
                  onClick={handleAddInputs}
                >
                  Camera DID Info
                </Button>

              </div>
            </>
          )}

          {!showAdditionalInputs && !fsvVehicleId ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                 marginBottom:"50px"
              }}
            >
              <Button
                display="flex"
                justifyContent="center"
                alignItems="center"
                borderRadius="8px"
                background="#3F77A5"
                width="200px"
                height="40px"
                color="white"
                marginTop="15px"
               
                onClick={handleAddNewDeviceClick}
              >
                Add New device
              </Button>
            </div>
          ) : (
            <>
              {/* Conditional Section: Add New Device Section */}

              {/* Video Player - Only show if we have a URL */}
              {/* Video Player - Only show if we have a URL */}
              {flvUrl && !videoError ? (
                <ReactPlayer
                  url={flvUrl}
                  playing={true}
                  controls={true}
                  width="100%"
                  height="50%"
                  style={{ marginBottom: "1rem" }}
                  onError={(e) => {
                    console.error("Video Player Error:", e);
                    setVideoError(true);
                    toast.error("Stream failed to load. Please check if the camera is online.");
                  }}
                />
              ) : flvUrl && videoError ? (
                 <Box p={4} bg="red.100" color="red.700" borderRadius="md" mb={4} textAlign="center">
                    <Text fontWeight="bold">Stream Unavailable</Text>
                    <Text fontSize="sm">The video stream could not be loaded.</Text>
                 </Box>
              ) : null}

              {/* Legacy Camera Details Form Removed */}
              {/* DIV 1: Camera Technical Parameters - Only show after Camera DID Info is clicked */}
              {hasClickedCameraDidInfo && (
                <Box mb={4}>
                  {isFetchingCameraDetails ? (
                    // Show loading state
                    <Flex
                      align="center"
                      justifyContent="center"
                      marginBottom="1.5rem"
                      padding="0.5rem"
                      border="1px solid #E2E8F0"
                      borderRadius="md"
                      bg="blue.50"
                      color="blue.600"
                    >
                      <Text fontWeight="bold" marginRight="0.5rem">
                        Fetching Camera Details...
                      </Text>
                      <Text>Please Wait...</Text>
                    </Flex>
                  ) : cameraStatus ? (
                    // Show camera technical parameters when available
                    <>
                      <Flex
                        direction="row"
                        align="center"
                        flexWrap="wrap"
                        marginBottom="1.5rem"
                        padding="0.5rem"
                        border="1px solid #E2E8F0"
                        borderRadius="md"
                        bg="gray.50"
                        width="342px"
                        height="45px"
                        flex-shrink="0"
                      >
                        <Text
                          marginRight="0.5rem"
                          fontFamily="Wix Madefor Text"
                        >
                          Camera Angle:
                        </Text>
                        <Text marginRight="1rem" fontFamily="Wix Madefor Text">
                          {Math.abs(cameraStatus.camera_angle)}
                        </Text>
                      </Flex>

                      {/* Camera Status Checkboxes */}
                      <Flex
                        wrap="wrap"
                        gap="0.1rem"
                        mt="1.5rem"
                        mb="1.5rem"
                        px="0.5rem"
                      >
                        {[
                          {
                            label: blurChecked ? "Blur" : "No Blur",
                            checked: !blurChecked,
                          },
                          {
                            label: blackviewChecked
                              ? "Black View"
                              : "No Black View",
                            checked: !blackviewChecked,
                          },
                          { label: "Brightness", checked: brightnessChecked },
                          {
                            label: blackAndWhiteChecked
                              ? "Black & White"
                              : "No Black & White",
                            checked: !blackAndWhiteChecked,
                          },
                          {
                            label: cameraAngleAcceptable
                              ? "Camera Angle OK"
                              : "Camera Angle Issue",
                            checked: cameraAngleAcceptable,
                          },
                        ].map(({ label, checked }, index) => (
                          <Flex
                            key={index}
                            direction="column"
                            align="center"
                            gap="0.3rem"
                            width="66px"
                          >
                            {checked ? (
                              <Checkbox
                                isChecked={checked}
                                isReadOnly
                                sx={{
                                  ".chakra-checkbox__control": {
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    border: "2px solid #7BC111",
                                    backgroundColor: "white",
                                    _checked: {
                                      backgroundColor: "#7BC111",
                                      color: "white",
                                      borderColor: "#7BC111",
                                    },
                                  },
                                  ".chakra-checkbox__icon": {
                                    fontSize: "10px",
                                  },
                                }}
                              />
                            ) : (
                              <BlinkingWarningIcon boxSize="18px" />
                            )}
                            <Text
                              fontSize="10px"
                              fontWeight="500"
                              textAlign="center"
                              lineHeight="1.2"
                              whiteSpace="normal"
                            >
                              {label}
                            </Text>
                          </Flex>
                        ))}
                      </Flex>
                    </>
                  ) : (
                    // Show not available state
                    <Flex
                      align="center"
                      justifyContent="center"
                      marginBottom="1.5rem"
                      padding="0.5rem"
                      border="1px solid #E2E8F0"
                      borderRadius="md"
                      bg="red.100"
                      color="gray.600"
                    >
                     <Text color="red" fontWeight="bold">AI की स्थिति प्राप्त की जा रही है, कृपया आगे बढ़ने से पहले प्रतीक्षा करें . . . .</Text>
                    </Flex>
                  )}
                </Box>
              )}

              {/* DIV 2: Camera Location Details - Only show after Camera DID Info is clicked */}
             {false && hasClickedCameraDidInfo && (
  <Box>
   <h1
  style={{
    fontSize: "14px",
    fontFamily: '"Wix Madefor Text", sans-serif',
    fontWeight: 500,
    fontStyle: "normal",
    lineHeight: "20px",
    display: "flex",
    alignItems: "center",
  }}
>
  &nbsp;&nbsp;Camera Feed Status
  <img
    src={line}
    alt="Line"
    style={{
      width: "200px",
      height: "1px",
      marginLeft: "10px",
      verticalAlign: "middle",
    }}
  />
</h1>

    {/* Location Details Form */}
<Box padding="10px">
  {/* State */}
  <Box marginBottom="0.75rem">
    <Text
      width="100%"
      fontWeight="600"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="14px"
      color="#1A1A1A"
      marginBottom="4px"
    >
      &nbsp; State
    </Text>
    <Input
      background="#FFF"
      fontWeight="500"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="12px"
      value={state}
      onChange={(e) => setState(e.target.value.toUpperCase())}
      placeholder="State"
      isReadOnly={true}
    />
  </Box>

  {/* District */}
  <Box marginBottom="0.75rem">
    <Text
     width="100%"
      fontWeight="600"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="14px"
      color="#1A1A1A"
      marginBottom="4px"
    >
      &nbsp; District
    </Text>
    <Input
      background="#FFF"
      fontWeight="500"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="12px"
      value={district}
      onChange={(e) => setDistrict(e.target.value)}
      placeholder="District"
      isReadOnly={!isEditing}
    />
  </Box>

  {/* Assembly */}
  <Box marginBottom="0.75rem">
    <Text
      width="100%"
      fontWeight="600"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="14px"
      color="#1A1A1A"
      marginBottom="4px"
    >
      &nbsp; Assembly
    </Text>
    <Input
      background="#FFF"
      fontWeight="500"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="12px"
      value={assemblyName}
      onChange={(e) => setAssemblyName(e.target.value)}
      placeholder="Assembly Name"
      isReadOnly={!isEditing}
    />
  </Box>

  {/* PsNo */}
  <Box marginBottom="0.75rem">
    <Text
      width="100%"
      fontWeight="600"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="14px"
      color="#1A1A1A"
      marginBottom="4px"
    >
      &nbsp; PsNo.
    </Text>
    <Input
      background="#FFF"
      fontWeight="500"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="12px"
      value={psNumber}
      onChange={(e) => setPsNumber(e.target.value)}
      placeholder="PS Number"
      isReadOnly={!isEditing}
    />
  </Box>

  {/* Location */}
  <Box marginBottom="0.75rem">
    <Text
     width="100%"
      fontWeight="600"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="14px"
      color="#1A1A1A"
      marginBottom="4px"
    >
      &nbsp; Location
    </Text>
    <Input
      background="#FFF"
      fontWeight="500"
      fontFamily="'Wix Madefor Text', sans-serif"
      fontSize="12px"
      value={excelLocation}
      onChange={(e) => setExcelLocation(e.target.value)}
      placeholder="Location"
      isReadOnly={!isEditing}
    />
  </Box>
</Box>


    <Flex justifyContent="center" alignItems="center" gap="20px">
        { !isEditing ? (
          <Button
            background="#3F77A5"
            color="white"
            onClick={() => setIsEditing(true)} // Set isEditing to true on "Edit"
            width="120px"
            height="40px"
            borderRadius="8px"
            marginRight="10px"
             marginBottom="50px"
          >
            Edit
          </Button>
        ) : (
          <Button
            colorScheme="gray"
            onClick={() => {
              setIsEditing(false);
            }}
            width="120px"
            height="40px"
            borderRadius="8px"
            marginBottom="50px"
          >
            Cancel
          </Button>
        )}

      <Button
        background="#3F77A5"
        color="white"
        onClick={handleSubmit} // Submit - isEdited is determined by the state
        width="120px"
        height="40px"
        borderRadius="8px"
         marginBottom="50px"
      >
        Submit
      </Button>
    </Flex>
  </Box>
)}
            </>
          )}
        </>
      ) : (
        <Container
          maxW="98vw"
          height="82vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={4}
          px={{ base: "0", sm: "8" }}
          style={{ margin: "0px" }}
        >
          <Text textAlign="center">
            To access this app, please turn on your 'LOCATION'
          </Text>
        </Container>
      )}
      
      {/* FSV Installation Form - Auto-filled */}
      {fsvData && (
        <Box mt={8} p={5} borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>FSV Installation Details</Heading>
            <FsvInstallationForm initialData={fsvData} />
        </Box>
      )}

      {/* FSV Photo Upload Section */}
      {fsvVehicleId && (
        <FsvPhotoUpload 
          vehicleId={fsvVehicleId}
          formData={fsvFormData}
          onUploadComplete={() => {
            // Optional: Navigate away or show success
            // window.location.href = '/'; // Or dashboard
          }} 
        />
      )}

    </Container>
  );
};

export default withAuth(AutoInstaller);
