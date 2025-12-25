import React, { useEffect, useState } from 'react';
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
import { addData, assignCamera, getCamera, getCameraByDid, getCameraByDidInfo, getCamerasByAssignedBy, getElectionUser, getFlvLatDid, getFullDid, getLatLongFsv, getLatLongPolling, getSetting, installCamera, setSetting, updateCamera } from '../actions/userActions';
import { MdAdd, MdDelete, MdEdit, MdTableRows, MdVisibility } from "react-icons/md";
import withAuth from './withAuth';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ReactPlayer from 'react-player';
import * as XLSX from 'xlsx';
import DrawerButton from './Drawer';
import { LuFlipHorizontal2, LuFlipVertical2 } from 'react-icons/lu';
import VideoModal from './modal/VideoModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Autosuggest from 'react-autosuggest';

const Support = () => {

  const [selectedDate, setSelectedDate] = useState(null);
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };


  const [currentPage, setcurrentPage] = useState(1);
  const [cameraa, setCameraa] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deviceid, setDeviceid] = useState('');
  const camera = async (currentPage) => {
    currentPage = null ? 1 : currentPage;
    try {
      const mobile = localStorage.getItem('mobile');
      const result = await getCameraByDidInfo(deviceid);
      console.log("result", result);
      setCameraa(result)
      // setTotalPages(result.pagination.totalPages)

    } catch (error) {
      toast.warning('This is a warning message.');
      // Handle error
      // alert("rekjha");
    }
    finally {

    }
  };

  const handleStateChange = async () => {
    camera();
  }

  useEffect(() => {
    camera(currentPage);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  // Function to handle input change
  const handleInputChange = async (event, { newValue }) => {
    setDeviceid(newValue);
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
    value: deviceid,
    onChange: handleInputChange,
    placeholder: 'Enter Device ID',
    style: { width: '100%', padding: '10px', borderColor: 'black', borderWidth: '1px' }
  };

  const closeModal = () => {
    setShowModal(false);
  };


  return (
    <Container maxW="full" px={{ base: '0', sm: '8' }} p={4} style={{ margin: "0px" }}> {/* py={{ base: '0', md: '24' }} */}
      <ToastContainer />

      {cameraa.data && (
        <div>
          <div style={{ display: 'flex', width: '100%' }}>
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }) => handleInputChange(null, { newValue: value })}
              onSuggestionsClearRequested={() => setSuggestions([])}
              getSuggestionValue={(suggestion) => suggestion}
              renderSuggestion={(suggestion) => <div>{suggestion}</div>}
              inputProps={inputProps}
            />
            <Button onClick={camera}>Submit</Button>
          </div>

          <div>
            {/* Check if cameraa.flvUrl is available before accessing its properties */}
            {cameraa.flvUrl && (
              <>
                <h1>deviceId:  {cameraa.data.deviceId}</h1>
                <h1>lastSeen:  {cameraa.data.lastSeen}</h1>
                <h1>proUrl:  {cameraa.flvUrl.prourl}</h1>
                <h1>servername:  {cameraa.flvUrl.servername}</h1>
                <h1>url2:  {cameraa.flvUrl.url2}</h1>
              </>
            )}
          </div>
        </div>
      )}

    </Container>
  );
};

export default Support;
