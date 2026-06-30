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
  getFsvSuggestions,
  saveAiStatusRecord,
  getSavedAiStatusRecord
} from "../actions/userActions"; // Import the new action
import { MdDelete, MdEdit, MdVisibility, MdDashboard, MdArrowBack, MdRefresh } from "react-icons/md";
import withAuth from "./withAuth";
// import { ReactFlvPlayer } from 'react-flv-player';
import videojs from "video.js";
import "video.js/dist/video-js.css";
import ReactPlayer from "react-player";
import JessicaStreamPlayer from "./JessicaStreamPlayer";
import QRCodeScanner from "./QrCodeScanner";
import TawkToWidget from "./tawkto";
import { LuFlipHorizontal2, LuFlipVertical2 } from "react-icons/lu";
import Autosuggest from "react-autosuggest";
import { IoIosRefresh } from "react-icons/io";
import { FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
//import { FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa"; // Import sorting icons
import sortIcon from "./images/logo/sort.png"; // Import the image
import line from "./images/logo/line.png";
import expand from "./images/logo/expand.png";
import { useLocation, useNavigate } from 'react-router-dom';
import FsvPhotoUpload from './FsvPhotoUpload';
import FsvInstallationForm from './FsvInstallationForm';

const AutoInstaller = () => {
  const locationHook = useLocation();
  const navigate = useNavigate();
  // Local state for FSV Photo Upload
  const [fsvVehicleId, setFsvVehicleId] = useState(locationHook.state?.fsvVehicleId || null);
  const [fsvFormData, setFsvFormData] = useState(locationHook.state?.fsvFormData || null);

  // Sync and immediately clear route state to prevent persistence on refresh/reload
  useEffect(() => {
    if (locationHook.state?.fsvVehicleId) {
      setFsvVehicleId(locationHook.state.fsvVehicleId);
      setFsvFormData(locationHook.state.fsvFormData);
      navigate('/autoinstaller', { replace: true, state: {} });
    }
  }, [locationHook.state, navigate]);
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
  const geolocationWatchId = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const camerasPerPage = 5; // Adjust as needed
  const [cameraa, setCameraa] = useState([]); // Keep cameraa as state
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const totalCameras = cameraa.length;
  const totalPages = Math.ceil(totalCameras / camerasPerPage); // Calculate the number of pages

  const parseGeocodeResponse = (geocodeData) => {
    const results = Array.isArray(geocodeData?.results) ? geocodeData.results : [];
    const compoundCode = geocodeData?.plus_code?.compound_code || "";
    const stateFromCompound = compoundCode.split(",")[1]?.trim()?.toUpperCase() || "";

    return {
      address: results[0]?.formatted_address || "",
      stateFromCompound,
      formattedAddress: results[6]?.formatted_address || results[0]?.formatted_address || "",
      formattedAddress1: results[7]?.formatted_address || results[1]?.formatted_address || "",
      formattedAddress2: results[8]?.formatted_address || results[2]?.formatted_address || "",
    };
  };

  const normalizeAiStatus = (payload) => {
    if (!payload || typeof payload !== "object") return null;

    const source =
      payload.aiStatus ||
      payload.status ||
      payload.data ||
      payload.result ||
      payload;

    const hasAnyStatusField =
      source.blur !== undefined ||
      source.blackview !== undefined ||
      source.blackView !== undefined ||
      source.brightness !== undefined ||
      source.BlackAndWhite !== undefined ||
      source.blackAndWhite !== undefined ||
      source.camera_angle !== undefined ||
      source.cameraAngle !== undefined;

    if (!hasAnyStatusField) return null;

    return {
      blur: Boolean(source.blur),
      blackview: Boolean(source.blackview ?? source.blackView),
      brightness: Boolean(source.brightness),
      BlackAndWhite: Boolean(source.BlackAndWhite ?? source.blackAndWhite),
      camera_angle: Number(source.camera_angle ?? source.cameraAngle ?? 0),
    };
  };

  const buildJessicaStreamUrl = (cameraId) => {
    if (!cameraId) return "";
    return `wss://mediastream.vmukti.com/jessica/DVR/${cameraId}.flv`;
  };

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
      geolocationWatchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          setLocation({ latitude, longitude });

          try {
            const responsee = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`
            );
            const parsedGeocode = parseGeocodeResponse(responsee.data);
            setAddress(parsedGeocode.address);
            setStateu(parsedGeocode.stateFromCompound);
          } catch (error) {
            console.error("Error fetching address:", error.message);
          }
        },
        (error) => {
          console.error("Error getting location:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    } else {
      console.error("Geolocation is not supported by your browser.");
    }

    return () => {
      if (geolocationWatchId.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId.current);
      }
      clearInterval(toastInterval.current);
      clearInterval(cameraStatusInterval.current);
    };
  }, []);
  const handleBackClick = () => {
    clearInterval(cameraStatusInterval.current);
    clearInterval(toastInterval.current);
    window.location.href = '/autoinstaller';
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
    setCameraStatus(null);
    clearInterval(cameraStatusInterval.current);
    clearInterval(toastInterval.current);

    setIsFetchingCameraDetails(true);
    const jessicaDisplayUrl = buildJessicaStreamUrl(deviceId);
    if (jessicaDisplayUrl) {
      setFlvUrl(jessicaDisplayUrl);
      setVideoError(false);
    }

    try {
      const response = await getCameraByDid(deviceId);
      let fsvHasData = false;
      let fsvHasAiStatus = false;
      let fsvStreamUrl = null;
      let shouldPollAiStatus = false;

      if (!response?.flvUrl?.url2) {
        // Try searching in FSV Data if standard camera search fails or even if it succeeds to get extra data
        // But for now, let's try to search FSV data first if the user intends to do FSV installation
      }

      // NEW: Search FSV Data
      try {
        const fsvResponse = await searchFsvDevice(deviceId);
        console.log("FSV Search Response:", fsvResponse); // DEBUG LOG

        if (fsvResponse.success) {
          if (fsvResponse.fsvData) {
            fsvHasData = true;
            setFsvData(fsvResponse.fsvData); // We need to create this state
            toast.success("FSV Data Found! Auto-filling form...");
          }

          // NEW: Handle AI Status if present
          const statusPayload =
            fsvResponse.aiStatus ||
            fsvResponse?.fsvData?.aiStatus ||
            fsvResponse?.data?.aiStatus;

          if (statusPayload) {
            fsvHasAiStatus = true;
            const status = {
              blur: Boolean(statusPayload.blur),
              blackview: Boolean(
                statusPayload.blackview ??
                statusPayload.blackView
              ),
              brightness: Boolean(statusPayload.brightness),
              BlackAndWhite: Boolean(
                statusPayload.BlackAndWhite ??
                statusPayload.blackAndWhite
              ),
              camera_angle: Number(
                statusPayload.camera_angle ??
                statusPayload.cameraAngle ??
                0
              ),
            };
            setCameraStatus(status);
            setBlurChecked(status.blur);
            setBlackviewChecked(status.blackview);
            setBrightnessChecked(status.brightness);
            setBlackAndWhiteChecked(status.BlackAndWhite);
            const cameraAngle = Math.abs(status.camera_angle);
            setCameraAngleAcceptable(cameraAngle <= 15);
          }

          // If stream URL is also found in FSV search response
          if (fsvResponse.streamUrl?.url2) {
            console.log("Setting FLV URL from FSV:", fsvResponse.streamUrl.url2); // DEBUG LOG
            fsvStreamUrl = fsvResponse.streamUrl.url2;
            setOriginalFlvUrl(fsvResponse.streamUrl.url2); // Store original for AI
            shouldPollAiStatus = !fsvHasAiStatus;
          } else if (fsvResponse.streamUrl?.RTMP_URL) {
            // Fallback: Construct HTTP-FLV from RTMP if url2 is missing
            // rtmp://server:80/live-record/streamname -> http://server:80/live-record/streamname.flv
            const rtmp = fsvResponse.streamUrl.RTMP_URL;
            const httpFlv = rtmp.replace('rtmp://', 'http://') + '.flv';
            console.log("Constructed HTTP-FLV URL:", httpFlv); // DEBUG LOG

            fsvStreamUrl = httpFlv;
            setOriginalFlvUrl(httpFlv); // Store original for AI

            shouldPollAiStatus = !fsvHasAiStatus;
          }
        }
      } catch (err) {
        console.log("FSV Search failed or no data", err);
      }

      const hasPrimaryStream = Boolean(response?.flvUrl?.url2);
      const hasFsvStream = Boolean(fsvStreamUrl);
      const hasJessicaStream = Boolean(jessicaDisplayUrl);
      const hasAnyStream = hasPrimaryStream || hasFsvStream || hasJessicaStream;

      // Always prefer backend-provided stream URL when available.
      // This is critical for cameras served from non-default stream servers.
      const preferredDisplayStreamUrl =
        response?.flvUrl?.url2 ||
        fsvStreamUrl ||
        jessicaDisplayUrl;
      if (preferredDisplayStreamUrl) {
        setFlvUrl(preferredDisplayStreamUrl);
      }

      if (!hasAnyStream) {
        toast.error(
          `Please Enter Full DeviceID 'OR' URL2 is not available, so contact Support`
        );
        setIsFetchingCameraDetails(false);
        return;
      }

      // If standard camera API fails but FSV flow has data/stream, continue without blocking.
      if (!response?.success && !fsvHasData && !hasFsvStream) {
        toast.error("Failed to get camera data");
        toast.error(
          "Plz connect support team before installing camera, from below right corner..."
        );
        toast.warning("If testing camera than wait for the view");
        setIsFetchingCameraDetails(false);
        return;
      }

      if (response?.data?.state === "PUNJAB") {
        toast.error("State is PUNJAB. Refreshing the page...");
        setTimeout(() => {
          window.location.reload();
        }, 100);
        setIsFetchingCameraDetails(false);
        return;
      }

      const fetchedState = response?.data?.state || "";
      const fetchedAssemblyName = response?.data?.assemblyName || "";
      const fetchedPsNumber = response?.data?.psNo || "";
      const fetchedDistrict = response?.data?.district || "";
      const fetchedExcelLocation = response?.data?.location || "";

      if (response?.success && response?.data) {
        setState(fetchedState);
        setAssemblyName(fetchedAssemblyName);
        setPsNumber(fetchedPsNumber);
        setDistrict(fetchedDistrict);
        setExcelLocation(fetchedExcelLocation);
      }

      if (!fsvHasData) {
        setFsvData({
          districtName: fetchedDistrict || "",
          acName: fetchedAssemblyName || "",
          state: fetchedState || "",
          ptzCameraSerialNumber: deviceId,
          ptzCameraModelNumber: "ATPL"
        });
      }

      let aiStatusResolved = false;
      if (hasPrimaryStream) {
        aiStatusResolved = await sendUrlToExternalApi(response.flvUrl.url2);
      } else if (hasFsvStream) {
        aiStatusResolved = await sendUrlToExternalApi(fsvStreamUrl);
      }

      if (shouldPollAiStatus && !aiStatusResolved) {
        startCameraStatusPolling(deviceId);
      }

      // **Wait for State to Update (Important!)**
      await new Promise((resolve) => setTimeout(resolve, 100)); // Adjust time as needed

      // **Call the Submission Logic Directly:**
      if (response?.success && response?.data) {
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
    // setCameraStatus(undefined); // Set to undefined when polling starts
    fetchCameraStatus(deviceId);

    cameraStatusInterval.current = setInterval(() => {
      fetchCameraStatus(deviceId);
    }, 5000);
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
        const savedStatusResponse = await getSavedAiStatusRecord(deviceId);
        const savedStatus = normalizeAiStatus(savedStatusResponse?.data || savedStatusResponse?.aiStatus || savedStatusResponse);
        if (savedStatus) {
          setCameraStatus(savedStatus);
          setBlurChecked(savedStatus.blur);
          setBlackviewChecked(savedStatus.blackview);
          setBrightnessChecked(savedStatus.brightness);
          setBlackAndWhiteChecked(savedStatus.BlackAndWhite);
          const cameraAngle = Math.abs(savedStatus.camera_angle);
          setCameraAngleAcceptable(cameraAngle <= 15);
        }
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
      // Suppress network errors from background polling
      if (error.code !== 'ERR_NETWORK' && error.message !== 'Network Error') {
        console.error("Error fetching camera status:", error);
      }
      setIsFetchingCameraDetails(false);
    }
  };

  const sendUrlToExternalApi = async (url2) => {
    // Use originalFlvUrl if available (for FSV flow), otherwise use the passed url2 (for legacy flow)
    let targetUrl = originalFlvUrl || url2;

    if (!targetUrl) {
      console.error("No URL available for AI Analytics");
      return false;
    }

    try {
      const analyzeApiUrl =
        process.env.REACT_APP_AI_ANALYZE_URL ||
        "https://installerapp.vmukti.com:8443/analyze-camera";

      let postData;

      // Jessica stream uses WSS — convert to https fmp4 MP4 URL which is H.264 compatible.
      // wss://host/jessica/DVR/name.flv → https://host/fmp4/DVR/name.mp4
      if (/^wss?:\/\//i.test(targetUrl)) {
        const fmp4Url = targetUrl
          .replace(/^wss:\/\//i, 'https://')
          .replace(/^ws:\/\//i, 'http://')
          .replace('/jessica/', '/fmp4/')
          .replace(/\.flv$/i, '.mp4');
        console.log('Converted WSS → fmp4 MP4 for AI:', fmp4Url);
        postData = { rtmp: fmp4Url };
      } else {
        // For standard HTTP/HTTPS FLV URLs, convert to RTMP format as before
        let rtmpUrl = targetUrl.replace("https://", "rtmp://").replace("http://", "rtmp://");
        if (!rtmpUrl.startsWith("rtmp://")) {
          rtmpUrl = "rtmp://" + rtmpUrl;
        }
        const url = new URL(rtmpUrl);
        if (!url.port) {
          url.port = "80";
        }
        url.pathname = url.pathname.replace(/\.flv$/i, "");
        rtmpUrl = url.toString().replace(/\/$/, "");
        postData = { rtmp: rtmpUrl };
      }

      console.log("Sending to AI API:", postData);

      const response = await axios.post(analyzeApiUrl, postData, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 8000,
      });

      console.log("External API Response:", response.data);
      const parsedAiStatus = normalizeAiStatus(response.data);
      if (parsedAiStatus) {
        setCameraStatus(parsedAiStatus);
        setBlurChecked(parsedAiStatus.blur);
        setBlackviewChecked(parsedAiStatus.blackview);
        setBrightnessChecked(parsedAiStatus.brightness);
        setBlackAndWhiteChecked(parsedAiStatus.BlackAndWhite);
        setCameraAngleAcceptable(Math.abs(parsedAiStatus.camera_angle) <= 15);

        // Best-effort persistence for record keeping in backend aistatus collection.
        await saveAiStatusRecord({
          deviceId,
          personMobile: mobilee,
          rtmp: postData.rtmp,
          source: "analyze-camera",
          ...parsedAiStatus,
          analyzedAt: new Date().toISOString(),
        });

        return true;
      }
    } catch (error) {
      console.error("Error sending URL to external API:", error);
      return false;
    }
    return false;
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

  const namee = localStorage.getItem("name");
  const mobilee = localStorage.getItem("mobile");
  const handleSubmit = async () => {
    // --- Required Field Validation ---
    const missingFields = [];
    if (!deviceId || !deviceId.trim()) missingFields.push('Camera Device ID');
    if (!state || !state.trim()) missingFields.push('State');
    if (!district || !district.trim()) missingFields.push('District');
    if (!assemblyName || !assemblyName.trim()) missingFields.push('Assembly Name');
    if (!psNumber || !psNumber.trim()) missingFields.push('PS Number');
    if (!excelLocation || !excelLocation.trim()) missingFields.push('Location');

    if (missingFields.length > 0) {
      toast({
        title: 'Please fill in the required fields',
        description: missingFields.join(', '),
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    // ---------------------------------

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
        formattedTime,);

      console.log("response of submit", response);
      camera();
      setState("");
      setDistrict("");
      setAssemblyName("");
      setPsNumber("");
      setExcelLocation("");
      setShowAdditionalInputs(false);
      setIsEditing(false);
      setFsvVehicleId(null);
      setFsvFormData(null);

      // Call the new API endpoint to update isEdited
      if (isEditing) {
        await setIsEdited(deviceId); // Call the new API function
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!location?.latitude || !location?.longitude || !namee || !mobilee) {
      return;
    }
    trackData();
  }, [location, namee, mobilee]);

  const trackData = async () => {
    if (!location?.latitude || !location?.longitude) {
      return;
    }

    try {
      const latitude = location.latitude;
      const longitude = location.longitude;
      const currentTime = new Date();
      const formattedDate = currentTime.toLocaleDateString("en-GB");
      const formattedTime = currentTime.toLocaleTimeString("en-US", {
        hour12: false,
      });
      const responsee = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`
      );
      const parsedGeocode = parseGeocodeResponse(responsee.data);
      const statename = parsedGeocode.stateFromCompound || "UNKNOWN";
      const formatted_address = parsedGeocode.formattedAddress;
      const formatted_address1 = parsedGeocode.formattedAddress1;
      const formatted_address2 = parsedGeocode.formattedAddress2;
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
      setDidList(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
    } finally {
    }
  };

  const camera = async () => {
    try {
      const mobile = localStorage.getItem("mobile");
      const result = await getCamera(mobile);
      if (!Array.isArray(result?.data)) {
        setCameraa([]);
        setCurrentPage(1);
        return;
      }

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

  const BlinkingWarningIcon = ({ size, boxSize, ...rest }) => {
    return (
      <FaExclamationTriangle
        color="orange"
        size={size || boxSize || "24px"}
        style={{
          animation: "blink-animation 1s steps(5, start) infinite",
        }}
        {...rest}
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick
        pauseOnHover
        draggable
        newestOnTop
        icon={false}
        toastStyle={{
          minHeight: "46px",
          fontSize: "14px",
          padding: "10px 12px",
        }}
      />
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
              {/* Pagination and List Controls - Only show if devices exist (HIDDEN AS PER USER REQUEST) */}
              {false && cameraa.length > 0 && (
                <>
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

                  <Stack spacing={4} w="100%">
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      justify="space-between"
                      align={{ base: "flex-start", md: "center" }}
                      w="100%"
                      gap={3}
                    >
                      {/* Left side - Devices Added */}
                      <Box textAlign="left">
                        <Text
                          fontWeight="700"
                          fontFamily="Inter !important"
                          fontSize={{ base: "16px", md: "20px" }}
                        >
                          Devices Added - ({cameraa.length})
                        </Text>
                      </Box>

                      {/* Right side - Buttons */}
                      <Flex
                        align="center"
                        gap="0.5rem"
                        wrap="wrap"
                      >
                        {/* Dashboard button moved to sidebar by user request */}

                        {!showAdditionalInputs && cameraa.length > 0 && (
                          <Button
                            bg="#F4F4F5"
                            fontSize={{ base: "13px", md: "15px" }}
                            height="35px"
                            fontFamily="Wix Madefor Text"
                            onClick={downloadReport}
                            leftIcon={<FaFileExcel />}
                            size={{ base: "sm", md: "md" }}
                          >
                            Excel
                          </Button>
                        )}

                        {/* Sort by + icon */}
                        <Flex align="center" gap="0.2rem">
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
                        </Flex>
                      </Flex>
                    </Flex>

                    {/* Search Input */}
                    <Box w="100%">
                      <Input
                        placeholder="Search by Device ID or Vehicle No."
                        value={searchDeviceId}
                        onChange={(e) => setSearchDeviceId(e.target.value)}
                        bg="white"
                        size="sm"
                        borderRadius="md"
                      />
                    </Box>
                  </Stack>
                </>
              )}

              {/* Camera List Table (HIDDEN AS PER USER REQUEST) */}
              {false && filteredCameras
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
                    <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} mb={3} gap={2}>
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
                        width={{ base: "100%", sm: "0" }}
                        height={{ base: "1px", sm: "18px" }}
                        flexShrink={0}
                        borderTop={{ base: "1px solid #1A1A1A", sm: "none" }}
                        borderLeft={{ base: "none", sm: "1px solid #1A1A1A" }}
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
                      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={4} mt={3}>
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

              {false && cameraa.length > 0 && (
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
                  Your Installed Camera List
                </h2>
              )}
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
              {!flvUrl && (
                <Box
                  bg="white"
                  borderRadius="2xl"
                  boxShadow="0 10px 30px -10px rgba(63, 119, 165, 0.15)"
                  p={{ base: 5, md: 8 }}
                  mt={4}
                  mb={8}
                  border="1px solid"
                  borderColor="gray.100"
                  position="relative"
                  overflow="hidden"
                >
                  {/* Subtle top gradient accent */}
                  <Box position="absolute" top={0} left={0} right={0} h="4px" bgGradient="linear(to-r, #3F77A5, #2A527A)" />

                  <Flex direction="column" align="center" justify="center">

                    {/* Header Controls for Scanner (List View) */}
                    {isMobileDevice && (
                      <Flex w="100%" justify="flex-end" mb={2}>
                        <Tooltip
                          label="List View"
                          placement="left"
                          hasArrow
                          bg="#1A1A1A"
                          color="white"
                          fontFamily="Wix Madefor Text, sans-serif"
                          fontSize="13px"
                          borderRadius="md"
                          p="6px 10px"
                        >
                          <IconButton
                            icon={<FiList size={20} />}
                            aria-label="List View"
                            onClick={handleBackClick}
                            variant="ghost"
                            color="gray.500"
                            _hover={{ bg: "gray.100", color: "gray.800" }}
                            size="md"
                            isRound
                          />
                        </Tooltip>
                      </Flex>
                    )}

                    {/* QR Code Scanner Section */}
                    {isMobileDevice && (
                      <Box w="100%" display="flex" justifyContent="center" mb={6}>
                        <Box
                          border="1px dashed"
                          borderColor="blue.200"
                          borderRadius="xl"
                          p={2}
                          bg="blue.50"
                          transition="all 0.3s"
                          _hover={{ borderColor: "blue.400", bg: "blue.100" }}
                        >
                          <QRCodeScanner onScanSuccess={handleScanSuccess} />
                        </Box>
                      </Box>
                    )}

                    {/* Fancy "OR" Divider */}
                    {isMobileDevice && (
                      <Flex align="center" justify="center" w="100%" my={4}>
                        <Box flex="1" h="1px" bg="gray.200" />
                        <Text px={4} color="gray.400" fontWeight="bold" fontSize="sm">
                          OR
                        </Text>
                        <Box flex="1" h="1px" bg="gray.200" />
                      </Flex>
                    )}

                    {/* Input Field and Action Button Section */}
                    <Flex
                      direction="column"
                      align="center"
                      w="100%"
                      maxW="400px"
                      gap={5}
                      my={isMobileDevice ? 2 : 6}
                    >
                      <Box w="100%" position="relative">
                        {suggestions && suggestions.length >= 0 ? (
                          <Box
                            w="100%"
                            sx={{
                              "& > div": {
                                width: "100% !important",
                              },
                              ".react-autosuggest__container": {
                                position: "relative",
                                width: "100% !important",
                              },
                              ".react-autosuggest__input": {
                                width: "100% !important",
                                height: "50px",
                                padding: "10px 20px",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: "500",
                                fontSize: "16px",
                                border: "2px solid",
                                borderColor: "gray.200",
                                borderRadius: "xl",
                                backgroundColor: "gray.50",
                                transition: "all 0.2s ease-in-out",
                                _focus: {
                                  outline: "none",
                                  borderColor: "#3F77A5",
                                  backgroundColor: "white",
                                  boxShadow: "0 0 0 3px rgba(63, 119, 165, 0.2)",
                                },
                                _placeholder: {
                                  color: "gray.400",
                                  fontWeight: "normal"
                                }
                              },
                              // Keep the rest of the dropdown styles intact but update border-radius
                              ".react-autosuggest__suggestions-container--open": {
                                display: "block",
                                position: "absolute",
                                top: "55px",
                                width: "100%",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "white",
                                fontWeight: "400",
                                fontSize: "14px",
                                borderBottomLeftRadius: "12px",
                                borderBottomRightRadius: "12px",
                                zIndex: 10,
                                maxHeight: "250px",
                                overflowY: "auto",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                              },
                              ".react-autosuggest__suggestions-list": {
                                margin: 0,
                                padding: 0,
                                listStyleType: "none",
                              },
                              ".react-autosuggest__suggestion": {
                                cursor: "pointer",
                                padding: "12px 20px",
                                borderBottom: "1px solid #EDF2F7",
                              },
                              ".react-autosuggest__suggestion--highlighted": {
                                backgroundColor: "#F7FAFC",
                              },
                            }}
                          >
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
                              inputProps={{
                                ...inputProps,
                                placeholder: "Enter Device ID manually..."
                              }}
                              onSuggestionSelected={handleSuggestionSelected}
                            />
                          </Box>
                        ) : (
                          <Flex direction="column" align="center" gap={3} w="100%">
                            <Text color="red.500" fontWeight="medium">No Camera Found!</Text>
                            <Button size="sm" variant="outline" onClick={refresh}>Go Back</Button>
                          </Flex>
                        )}
                      </Box>

                      <Button
                        w="100%"
                        height="54px"
                        borderRadius="xl"
                        bgGradient="linear(to-r, #3F77A5, #2A527A)"
                        color="white"
                        fontWeight="bold"
                        fontSize="md"
                        boxShadow="0 4px 14px 0 rgba(63, 119, 165, 0.39)"
                        _hover={{
                          bgGradient: "linear(to-r, #2A527A, #1F3C59)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 20px rgba(63, 119, 165, 0.23)",
                        }}
                        _active={{
                          transform: "translateY(0)",
                        }}
                        transition="all 0.3s ease"
                        onClick={handleAddInputs}
                        leftIcon={<MdVisibility size="20px" />}
                      >
                        Camera DID Info
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              )}
            </>
          )}

          {!showAdditionalInputs && !fsvVehicleId ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              bgGradient="linear(to-b, white, blue.50)"
              borderRadius="3xl"
              p={{ base: 8, md: 14 }}
              mt={8}
              mb="50px"
              border="1px solid"
              borderColor="blue.100"
              boxShadow="0 20px 40px -15px rgba(63, 119, 165, 0.15)"
              textAlign="center"
              w="100%"
              position="relative"
              overflow="hidden"
            >
              {/* Decorative background glow elements */}
              <Box position="absolute" top="-20%" left="-10%" w="200px" h="200px" bg="blue.200" filter="blur(90px)" borderRadius="full" opacity="0.5" />
              <Box position="absolute" bottom="-20%" right="-10%" w="200px" h="200px" bg="green.100" filter="blur(90px)" borderRadius="full" opacity="0.4" />

                <Box position="relative" zIndex={1}>
                  <Flex
                    justify="center"
                    align="center"
                    w="110px"
                    h="110px"
                    bg="white"
                    borderRadius="full"
                    boxShadow="0 15px 35px -5px rgba(63, 119, 165, 0.25)"
                    mb={6}
                    mx="auto"
                    border="4px solid"
                    borderColor="blue.50"
                  >
                    <Image src={logo} alt="Camera" boxSize="55px" />
                  </Flex>

                  <Text
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="900"
                    bgGradient="linear(to-r, #3F77A5, #1A365D)"
                    bgClip="text"
                    mb={4}
                    letterSpacing="tight"
                  >
                    Ready to Monitor?
                  </Text>

                  <Text color="gray.500" fontSize="md" mb={10} maxW="md" mx="auto" lineHeight="tall">
                    Click the below button to add new device.
                  </Text>
                </Box>

              <Button
                position="relative"
                zIndex={1}
                size="lg"
                height="60px"
                px={10}
                fontSize="lg"
                fontWeight="bold"
                borderRadius="full"
                color="white"
                bgGradient="linear(to-r, #3F77A5, #2A527A)"
                leftIcon={<Box as="span" fontSize="24px" mr={1} mb={0.5}>+</Box>}
                boxShadow="0 10px 20px -5px rgba(63, 119, 165, 0.4)"
                _hover={{
                  bgGradient: "linear(to-r, #2A527A, #1A365D)",
                  transform: 'translateY(-3px)',
                  boxShadow: '0 15px 25px -5px rgba(63, 119, 165, 0.5)',
                }}
                _active={{
                  transform: 'translateY(0)',
                  boxShadow: '0 5px 15px -5px rgba(63, 119, 165, 0.4)',
                }}
                transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                onClick={handleAddNewDeviceClick}
              >
                Add New Device
              </Button>
            </Box>
          ) : (
            <>
              {/* Conditional Section: Add New Device Section */}

              {/* Video Player - Only show if we have a URL */}
              {/* Video Player - Only show if we have a URL */}
              {flvUrl ? (
                <Flex direction="column" w="100%">
                  <Flex w="100%" justify="flex-start" mb={4}>
                    <Button
                      onClick={handleBackClick}
                      colorScheme="blue"
                      variant="ghost"
                      leftIcon={<MdArrowBack />}
                      size="sm"
                      borderRadius="md"
                      _hover={{ bg: 'blue.50', color: 'blue.700' }}
                    >
                      Back to Installer
                    </Button>
                  </Flex>
                  <Box
                    borderRadius="2xl"
                    overflow="hidden"
                    boxShadow="xl"
                    border="4px solid"
                    borderColor="gray.100"
                    bg="black"
                    mb={6}
                    transition="all 0.3s"
                    _hover={{ boxShadow: "2xl" }}
                    width="100%"
                    sx={{ aspectRatio: "16/9" }}
                  >
                    <JessicaStreamPlayer
                      url={flvUrl}
                      width="100%"
                      height="100%"
                      onError={(e) => {
                        console.error("Video Player Error:", e);
                        // Keep player mounted; Jessica component handles retries and internal fallback text.
                      }}
                    />
                  </Box>
                </Flex>
              ) : null}

              {/* Legacy Camera Details Form Removed */}
              {/* DIV 1: Camera Technical Parameters - Only show after Camera DID Info is clicked */}
              {hasClickedCameraDidInfo && (
                <Box
                  bg="white"
                  borderRadius="xl"
                  boxShadow="md"
                  p={{ base: 2, sm: 3 }}
                  border="1px solid"
                  borderColor="gray.100"
                  mb={4}
                  maxWidth="800px"
                  mx="auto"
                >
                  {isFetchingCameraDetails ? (
                    <Flex
                      align="center"
                      justifyContent="center"
                      direction="column"
                      py={8}
                    >
                      <Box className="blink" color="blue.500" fontSize="xl" mb={2}>
                        Fetching Camera Details...
                      </Box>
                      <Text color="gray.500">Please Wait...</Text>
                    </Flex>
                  ) : cameraStatus ? (
                    <>
                      <Flex
                        justify="space-between"
                        align="center"
                        mb={2}
                        pb={2}
                        borderBottom="1px dashed"
                        borderColor="gray.200"
                        direction={{ base: "column", sm: "row" }}
                        gap={1.5}
                      >
                        <Text fontSize={{ base: "sm", sm: "lg" }} fontWeight="700" color="gray.700" fontFamily="Wix Madefor Text">
                          Camera Health Status
                        </Text>
                        <Flex
                          align="center"
                          bg="gray.50"
                          px={{ base: 2, sm: 3 }}
                          py={1}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          <Text fontSize="11px" color="gray.600" mr={1.5} fontFamily="Wix Madefor Text">Camera Angle:</Text>
                          <Text fontSize={{ base: "md", sm: "xl" }} lineHeight="1" fontWeight="800" color={cameraAngleAcceptable ? "green.500" : "orange.500"} fontFamily="Wix Madefor Text">
                            {Math.abs(cameraStatus.camera_angle)}°
                          </Text>
                        </Flex>
                      </Flex>

                      <Grid templateColumns={{ base: "repeat(3, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }} gap={{ base: 1.5, sm: 2 }}>
                        {[
                          {
                            label: blurChecked ? "Blur Detected" : "No Blur",
                            isGood: !blurChecked,
                          },
                          {
                            label: blackviewChecked ? "Black View" : "View Clear",
                            isGood: !blackviewChecked,
                          },
                          {
                            label: brightnessChecked ? "Brightness OK" : "Low Brightness",
                            isGood: brightnessChecked
                          },
                          {
                            label: blackAndWhiteChecked ? "Black & White" : "Color View",
                            isGood: !blackAndWhiteChecked,
                          },
                          {
                            label: cameraAngleAcceptable ? "Angle OK" : "Angle Issue",
                            isGood: cameraAngleAcceptable,
                          },
                        ].map(({ label, isGood }, index) => (
                          <Flex
                            key={index}
                            direction="row"
                            align="center"
                            justify="flex-start"
                            p={{ base: 1.5, sm: 2 }}
                            minH={{ base: "40px", sm: "52px" }}
                            borderRadius="md"
                            bg={isGood ? "green.50" : "red.50"}
                            border="1px solid"
                            borderColor={isGood ? "green.200" : "red.200"}
                            textAlign="left"
                            gap={1.5}
                            transition="all 0.2s"
                            _hover={{ boxShadow: "sm" }}
                          >
                            <Box color={isGood ? "green.500" : "red.500"} w={{ base: "13px", sm: "16px" }} h={{ base: "13px", sm: "16px" }} display="flex" alignItems="center" justifyContent="center" sx={{ "& svg": { width: "100%", height: "100%" } }}>
                              {isGood ? <FaCheckCircle /> : <FaTimesCircle />}
                            </Box>
                            <Text
                              fontSize={{ base: "10px", sm: "xs" }}
                              fontWeight="600"
                              lineHeight="1.2"
                              color={isGood ? "green.700" : "red.700"}
                              fontFamily="Wix Madefor Text"
                            >
                              {label}
                            </Text>
                          </Flex>
                        ))}
                      </Grid>
                    </>
                  ) : (
                    <Flex
                      align="center"
                      justifyContent="center"
                      direction="column"
                      p={6}
                      borderRadius="lg"
                      bg="red.50"
                      color="red.600"
                      border="1px solid"
                      borderColor="red.100"
                    >
                      <Flex align="center">
                        <BlinkingWarningIcon boxSize="24px" />
                        <Text ml={3} fontWeight="bold">AI Status Unavailable. Please try again.</Text>
                      </Flex>
                      <Button
                        mt={4}
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={handleAddInputs}
                        leftIcon={<MdRefresh />}
                        isLoading={isFetchingCameraDetails}
                      >
                        Retry Status Check
                      </Button>
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
                    {!isEditing ? (
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
          <FsvInstallationForm 
            initialData={fsvData} 
            onNext={(vehicleId, formData) => {
              setFsvVehicleId(vehicleId);
              setFsvFormData(formData);
            }}
            onBack={() => {
              setFsvData(null);
              handleBackClick();
            }}
          />
        </Box>
      )}

      {/* FSV Photo Upload Section */}
      {fsvVehicleId && (
        <Box id="fsv-upload-section">
          <FsvPhotoUpload
            vehicleId={fsvVehicleId}
            formData={fsvFormData}
            location={location}
            onUploadComplete={() => {
              setShowAdditionalInputs(false);
              setFsvData(null);
              setDeviceId("");
              setFlvUrl("");
              setCameraStatus(null);
              setFsvVehicleId(null);
              setFsvFormData(null);
              navigate('/autoinstaller', { replace: true, state: {} });
            }}
          />
        </Box>
      )}

    </Container>
  );
};

export default withAuth(AutoInstaller);
