import React, { useEffect, useState } from "react";

import axios from "axios";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
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

const AiFeed = () => {
 


  const refresh = () => {
    window.location.reload();
  };



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

  const urls = [
    "wss://media5.ambicam.com/live/KKKK-820819-VVVVV.flv", 
    "wss://media5.ambicam.com/live/ANYK-805366-AAAAA.flv",
    "wss://media5.ambicam.com/live/KKKK-800797-VVVVV.flv",
    "wss://media5.ambicam.com/live/KKKK-800044-VVVVV.flv",
    "wss://media5.ambicam.com/live/ANYK-808444-AAAAA.flv",
    "wss://media5.ambicam.com/live/ANYK-807967-AAAAA.flv",
    "wss://media5.ambicam.com/live/ANYK-805450-AAAAA.flv",
    "wss://media5.ambicam.com/live/KKKK-824673-VVVVV.flv",
    // Add your remaining URLs here
  ];

  

  return (
    <Container maxW="98vw" p={4} px={{ base: "0", sm: "8" }} style={{ margin: "0px" }}>
    <Grid templateColumns="repeat(4, 1fr)" gap={4}>
      {urls.map((url, index) => (
        <Box key={index}>
          <ReactPlayer playsinline={true} url={url}  controls={true} width="100%" height="400px" />
        </Box>
      ))}
    </Grid>
  </Container>
  );
};

export default withAuth(AiFeed);
