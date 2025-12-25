import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
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
import { addData, assignCamera, getAiMap, getCamera} from '../actions/userActions';
import withAuth from './withAuth';
import 'video.js/dist/video-js.css';
import 'react-datepicker/dist/react-datepicker.css';


const AiMap = () => {

  const [currentPage, setcurrentPage] = useState(1);
  const [cameraa, setCameraa] = useState([]);
  const camera = async (currentPage) => {
    currentPage = null ? 1 : currentPage;
    try {
      const mobile = localStorage.getItem('mobile');
      const result = await getAiMap();
      console.log("sureshot", result)
      setCameraa(result)
    } catch (error) {
      toast.warning('This is a warning message.');
    }
    finally {

    }
  };

  useEffect(() => {
    camera(currentPage);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };


  {/* <WorldMap /> */ }

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFlvUrl, setSelectedFlvUrl] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const closeModal = () => {
    setSelectedDeviceId(null);
    setSelectedFlvUrl(null);
    setModalOpen(false);
  };

  const [hoveredDeviceId, setHoveredDeviceId] = useState(null);

  const handleMarkerMouseOver = (deviceId) => {
    setHoveredDeviceId(deviceId);
  };

  const handleMarkerMouseOut = () => {
    setHoveredDeviceId(null);
  };

  useEffect(() => {
    const initMap = () => {
        const map = new window.google.maps.Map(document.getElementById('map'), {
            center: { lat: 15.2993, lng: 74.124 },
            zoom: 9,
          });
          

      cameraa.forEach(point => {
        const latitude = parseFloat(point.latitude);
        const longitude = parseFloat(point.longitude);
        const position = { lat: latitude, lng: longitude };

        const markerIcon = {
          // url: point.status === 'RUNNING' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          url: point.status = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(32, 32) // Adjust the size as needed
        };

        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          icon: markerIcon
        });

        const infowindow = new window.google.maps.InfoWindow({
          content: `<div>Name: ${point.deviceId}`
        });

        // marker.addListener('click', function () {
        //   console.log('Marker status:', openModal(point.deviceId, point.status, point.state, point.district, point.location));
        // });

        marker.addListener('mouseover', () => {
          infowindow.open(map, marker);
        });

        marker.addListener('mouseout', () => {
          infowindow.close();
        });
      });
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD2CF3PlGBd0tQhusHwX3ngfPaad0pmJ_Q&callback=initMap`;
      script.defer = true;
      script.async = true;

      script.onerror = () => {
        console.error('Error loading Google Maps API script');
      };
      document.head.appendChild(script);
    }
  }, [cameraa]);



  return (
    <Container maxW="full" px={{ base: '0', sm: '8' }} p={4} style={{ margin: "0px" }}> {/* py={{ base: '0', md: '24' }} */}
      <ToastContainer />

      {/* <VideoModal isOpen={modalOpen} deviceId={selectedDeviceId} state={selectedState} district={selectedDistrict} location={selectedLocation} status={selectedStatus} flvUrl={selectedFlvUrl} onClose={closeModal} /> */}
      <div id="map" style={{ height: '60vh', width: '100%' }}></div>

      {/* Main content */}

    </Container>
  );
};

export default withAuth(AiMap);
