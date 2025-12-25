import React, { useEffect, useState } from "react";
import '../chat.css'; 
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
  sendQueryToBackend ,
  chatHistory,
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

const Gpt = () => {
  const [location, setLocation] = useState(null);
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

  const [cameraa, setCameraa] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState('');
  const camera = async () => {
    try {
      const result = await getAiData(page);
      console.log("cameras data", result);
      setCameraa(result.allData);
      setTotalPage(result.totalPages);
    } catch (error) {
      // Handle error
    } finally {
    }
  };

  useEffect(() => {
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

  // useEffect(() => {
  //   sidebarHistory()
  // },[])

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

  const [messages, setMessages] = useState([
    { text: 'Hi there! How can I help you?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
  
    // Add user message to chat history
    const updatedMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(updatedMessages);
  
    setIsBotTyping(true);

    try {
      // Make API call to the backend with the user query
      const botResponse = await sendQueryToBackend(input);
  
      // Append bot response to chat history while keeping user message intact
      const updatedMessagesWithBotResponse = [...updatedMessages, { text: botResponse, sender: 'bot' }];
      setMessages(updatedMessagesWithBotResponse);
      const response = await chatHistory();
      console.log("chat history :: ",response.data)
    } catch (error) {
      // Handle error if API call fails
      console.error('Error handling message submission:', error);
    }
  
    // Clear input field after submitting message
    setInput('');
    setIsBotTyping(false);
  };
  
  // const sidebarHistory = async () => {
  //   console.log("sidebar api")
  //   const response = await chatHistory();
  //   console.log("chat history :: ",  response)
  // }


  return (
    <div className="chatbot-page-container" style={{ width: '100vw', height: '100vh', display: 'flex' }}>
  {/* Side Navigation */}
  <div className="side-navigation" style={{ width: '250px', backgroundColor: '#f0f0f0', padding: '20px' }}>
    <h2>Chat History</h2>
    <ul style={{ listStyleType: 'none', padding: 0, marginBottom: '20px' }}>
      <li style={{ marginBottom: '10px' }}>Nav Item 1</li>
      <li style={{ marginBottom: '10px' }}>Nav Item 2</li>
      <li style={{ marginBottom: '10px' }}>Nav Item 3</li>
    </ul>
  </div>
  
  {/* Chatbot Content */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
    {/* Chat Messages */}
    <div className="chatbot-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`} style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: msg.sender === 'bot' ? '#f0f0f0' : '#0084ff', color: msg.sender === 'bot' ? '#333' : '#fff', maxWidth: '70%', alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end' }}>
          {msg.text}
        </div>
      ))}
      {isBotTyping && <div className="message bot"><span className="typing-animation"></span></div>}
    </div>
    
    {/* Chat Input */}
    <form onSubmit={handleMessageSubmit} className="chatbot-input-form" style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Ask me anything..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ flex: 1, marginRight: '10px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
      />
      <button type="submit" style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#0084ff', color: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer' }}>Send</button>
    </form>
  </div>
</div>

  );
};

export default withAuth(Gpt);
