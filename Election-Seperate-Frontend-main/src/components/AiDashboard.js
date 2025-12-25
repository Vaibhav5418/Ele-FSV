import React, { useEffect, useState, useRef } from "react";
import "../chat.css";
import axios from "axios";
import {
  Box,
  useMediaQuery,
  Heading,
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
  sendQueryToBackend,
  getAssemblyByNumber,
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
} from "../actions/userActions";
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
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
import { format, subDays } from "date-fns";
import Chart from "chart.js/auto"; // Import Chart from chart.js/auto

const AiDashboard = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    did();

    // toast.success('Welcome', {
    //   position: 'top-right',
    //   autoClose: 1500, // 5 seconds
    //   hideProgressBar: false,
    //   closeOnClick: true,
    //   pauseOnHover: true,
    //   draggable: true,
    // });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Get latitude and longitude from the position object
          const { latitude, longitude } = position.coords;

          // const latitude = 23.0282826;
          // const longitude = 72.5398852;
          setLatie(latitude);
          setLongie(longitude);

          // Set the location in state
          setLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error.message);
        }
      );
    } else {
      console.error("Geolocation is not supported by your browser.");
    }
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

  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [assemblyName, setAssemblyName] = useState("");
  const [flvUrl, setFlvUrl] = useState("");
  const [psNumber, setPsNumber] = useState("");
  const [district, setDistrict] = useState("");

  const [deviceWidth, setDeviceWidth] = useState(window.innerWidth);

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
  const [isBotTyping, setIsBotTyping] = useState(false);
  const handleImageClick = (imgUrl) => {
    setSelectedImage(imgUrl);
    setIsModalOpen(true);
  };

  const handleCloseModall = () => {
    setIsModalOpen(false);
  };

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const chartRefDistrict1 = useRef(null);
  const chartRefDistrict2 = useRef(null);
  const chartInstanceDistrict1 = useRef(null);
  const chartInstanceDistrict2 = useRef(null);
  
  useEffect(() => {
    fetchData(); // Fetch data initially when the component mounts
    fetchDatadistrict();
    const intervalId = setInterval(fetchData, 30000); // Fetch data every 30 seconds
    const intervalIdDistrict = setInterval(fetchDatadistrict, 30000); // Fetch data every 30 seconds

    return () => {
      clearInterval(intervalId, intervalIdDistrict); // Cleanup interval when component unmounts
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch minute-wise data for today's date from the provided API
      const response = await axios.post(
        "https://ai-analytics-election-igrgh.ondigitalocean.app/api/getprcount",
        {
          state: "GOA",
        }
      );

      console.log(response.data);

      // Check if response data is in the expected format
      if (!response.data || typeof response.data !== "object") {
        console.error("Data is not in the expected format");
        return;
      }

      // Extracting time and image count data from fetched data
      const labels = Object.keys(response.data.totalImageCountsMinute);
      const imgCounts = Object.values(response.data.totalImageCountsMinute);

      // Limit data to show only the last half-hour (last 30 labels and image counts)
      const lastIndex = labels.length - 1;
      const lastHalfHourLabels = labels.slice(
        Math.max(0, lastIndex - 30),
        lastIndex + 1
      );
      const lastHalfHourImgCounts = imgCounts.slice(
        Math.max(0, lastIndex - 30),
        lastIndex + 1
      );

      // Update the chart with fetched data
      updateChart(lastHalfHourLabels, lastHalfHourImgCounts);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  const updateChart = (labels, imgCounts) => {
    // Check if chart instance exists
    if (chartInstance.current) {
      // Update chart data
      chartInstance.current.data.labels = labels;
      chartInstance.current.data.datasets[0].data = imgCounts;
      // Update chart
      chartInstance.current.update();
    } else {
      // Create the chart if it doesn't exist
      const ctx = chartRef.current.getContext("2d");
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Goa Human Statistics",
              data: imgCounts,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true, // Make the chart responsive
          maintainAspectRatio: false, // Allow the chart to adjust to its container
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            tooltip: {
              mode: "index",
              intersect: false,
            },
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: "x",
              },
            },
          },
        },
      });
    }
  };

  const fetchDatadistrict = async () => {
    try {
      // Fetch minute-wise data for today's date from the provided API
      const response = await axios.post(
        "https://ai-analytics-election-igrgh.ondigitalocean.app/api/getprcountdistrict",
        {
          state: "GOA",
        }
      );

      console.log(response.data);

      // Check if response data is in the expected format
      if (!response.data || typeof response.data !== "object") {
        console.error("Data is not in the expected format");
        return;
      }

      
      // Extracting time and image count data from fetched data
      const labels = Object.keys(response.data.totalImageCountsMinute);

      const imgCounts = Object.values(response.data.totalImageCountsMinute);
      
    //   console.log("label",imgCounts.filter(counts => counts.hasOwnProperty("SOUTHPATHANKOT")))

      // Limit data to show only the last half-hour (last 30 labels and image counts)
      const lastIndex = labels.length - 1;
      const lastHalfHourLabels = labels.slice(
        Math.max(0, lastIndex - 30),
        lastIndex + 1
      );
      const lastHalfHourImgCounts = imgCounts.slice(
        Math.max(0, lastIndex - 30),
        lastIndex + 1
      );
      // Update the chart with fetched data
    
      updateChartDistrict(lastHalfHourLabels, lastHalfHourImgCounts);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  const updateChartDistrict = (labels, imgCounts) => {
    if (chartInstanceDistrict1.current && chartInstanceDistrict2.current) {
      // Update chart data
      chartInstanceDistrict1.current.data.labels = labels;
      chartInstanceDistrict2.current.data.labels = labels;
      
      // Update data for PATHANKOT
      chartInstanceDistrict1.current.data.datasets[0].data = imgCounts.map(counts => counts["North_Goa"] || 0);
      
      // Update data for SOUTHPATHANKOT (assuming it's the second dataset)
      chartInstanceDistrict2.current.data.datasets[1].data = imgCounts.map(counts => counts["South_Goa"] || 0);
  
      // Update chart
      chartInstanceDistrict1.current.update();
      chartInstanceDistrict2.current.update();
    } else {
      // Create the chart if it doesn't exist
      const ctx1 = chartRefDistrict1.current.getContext("2d");
      const ctx2 = chartRefDistrict2.current.getContext("2d");

      chartInstanceDistrict1.current = new Chart(ctx1, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "North_Goa",
              data: imgCounts.map(counts => counts["North_Goa"] || 0), // Default to 0 if data not available
              borderColor: "black",
              tension: 0.1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            tooltip: {
              mode: "index",
              intersect: false,
            },
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: "x",
              },
            },
          },
        },
      });
      
      chartInstanceDistrict2.current = new Chart(ctx2, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "South_Goa",
              data: imgCounts.map(counts => counts["South_Goa"] || 0), // Default to 0 if data not available
              borderColor: "red",
              tension: 0.1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            tooltip: {
              mode: "index",
              intersect: false,
            },
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: "x",
              },
            },
          },
        },
      });
    }
  };
  
  const [isMobileView, setIsMobileView] = useState(false);
  const [assemblystat, setAssemblyStat] = useState(false);
  // const chartRef = useRef(null);

  const handleButtonClick = () => {
    // Toggle the assemblystat state
    setAssemblyStat(!assemblystat);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 600);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize); // Event listener for window resize

    return () => {
      window.removeEventListener("resize", handleResize); // Cleanup
    };
  }, []);

  return (
    <>
      <Container
        maxW="full"
        px={{ base: "0", sm: "8" }}
        p={4}
        style={{ margin: "0px" }}
      >
       
        {" "}
        {/* py={{ base: '0', md: '24' }} */}
        <Container
          maxW="full"
          px={{ base: "0", sm: "8" }}
          p={4}
          style={{ margin: "0px" }}
        >
          <Box borderWidth="1px" borderRadius="lg" p="4">
            <div
              style={{
                width:  !assemblystat ? "100%" : "50%" ,
                height: "50%",
                display: "flex",
                flexDirection: { base: "column", md: "row", sm: "column" },
              }}
            >
              {" "}
        
              <canvas
              ref={chartRef}
              width="800"
              height="730"
              style={{ display: !assemblystat ? "block" : "none" }}
            />

            
              <canvas
                ref={chartRefDistrict1}
                width="400" // Set the width of the canvas element
                height="400"
                style={{ display: assemblystat ? "block" : "none" }}
              />
              <canvas
                ref={chartRefDistrict2}
                width="400" // Set the width of the canvas element
                height="400"
                style={{ display: assemblystat ? "block" : "none" }}
              />
            </div>
            <div style={{ width: "50%", height: "50%" }}>
            <Button onClick={handleButtonClick}>
                {assemblystat ? "Click to View Goa Statistics" : " Click to View District Statistics"}
              </Button>
              {" "}
              {/* Adjust the width and height as needed */}
            </div>
          </Box>
        </Container>
      </Container>
    </>
  );
};

export default withAuth(AiDashboard);
