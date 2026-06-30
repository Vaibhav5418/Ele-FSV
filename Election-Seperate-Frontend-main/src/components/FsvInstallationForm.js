import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  HStack,
  Stack,
  Heading,
  SimpleGrid,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Select,
  Text,
  Flex,
  Image
} from '@chakra-ui/react';
import { createFsvReport, checkVehicleExists, checkCameraExists, getFsvSuggestions } from '../actions/userActions';
import { useNavigate } from 'react-router-dom';
import { MdQrCodeScanner, MdArrowBack, MdLocationOn, MdDirectionsCar, MdVideocam, MdSettingsInputComponent, MdPhoto } from 'react-icons/md';
import QRCodeScanner from './QrCodeScanner';
// react-autosuggest removed — using custom Chakra dropdown
import axios from 'axios';

const DISTRICT_DATA = {
  "BANKURA": [
    "247-SALTORA",
    "248-CHHATNA",
    "249-RANIBANDH",
    "250-RAIPUR",
    "251-TALDANGRA",
    "252-BANKURA",
    "253-BARJORA",
    "254-ONDA",
    "255-BISHNUPUR",
    "256-KATULPUR",
    "257-INDUS",
    "258-SONAMUKH"
  ],
  "BIRBHUM": [
    "284-DUBRAJPUR",
    "285-SURI",
    "286-BOLPUR",
    "287-NANOOR",
    "288-LABHPUR",
    "289-SAINTHIA",
    "290-MAYURESWAR",
    "291-RAMPURHAT",
    "292-HANSAN",
    "293-NALHATI",
    "294-MURARAI"
  ],
  "HOOGHLY": [
    "185-UTTARPARA",
    "186-SREERAMPUR",
    "187-CHAMPDANI",
    "188-SINGUR",
    "189-CHANDANNAGAR",
    "190-CHUNCHURA",
    "191-BALAGARH",
    "192-PANDUA",
    "193-SAPTAGRAM",
    "194-CHANDITALA",
    "195-JANGIPARA",
    "196-HARIPAL",
    "197-DHANEKHALI",
    "198-TARAKESWAR",
    "199-PURSURAH",
    "200-ARAMBAG",
    "201-GOGHAT",
    "202-KHANAKUL"
  ],
  "JHARGRAM": [
    "220-NAYAGRAM",
    "221-GOPIBALLAVPUR",
    "222-JHARGRAM",
    "237-BINPUR"
  ],
  "NADIA": [
    "77-KARIMPUR",
    "78-TEHATTA",
    "79-PALASHIPARA",
    "80-KALIGANJ",
    "81-NAKASHIPARA",
    "82-CHAPRA",
    "83-KRISHNANAGAR UTTAR",
    "84-NABADWIP",
    "85-KRISHNANAGAR DAKSHIN",
    "86-SANTIPUR",
    "87-RANAGHAT UTTAR PASCHIM",
    "88-KRISHNAGANJ",
    "89-RANAGHAT UTTAR PURBA",
    "90-RANAGHAT DAKSHIN",
    "91-CHAKDAHA",
    "92-KALYANI",
    "93-HARINGHATA"
  ],
  "PASCHIM BARDHAMAN": [
    "275-PANDABESWAR",
    "276-DURGAPUR PURBA",
    "277-DURGAPUR PASCHIM",
    "278-RANIGANJ",
    "279-JAMURIA",
    "280-ASANSOL DAKSHIN",
    "281-ASANSOL UTTAR",
    "282-KULTALI",
    "283-BARABANI"
  ],
  "PASCHIM MEDINIPUR": [
    "219-DANTAN",
    "223-KESHIARY",
    "224-KHARAGPUR SADAR",
    "225-NARAYANGARH",
    "226-SABANG",
    "227-PINGLA",
    "228-KHARAGPUR",
    "229-DEBRA",
    "230-DASPUR",
    "231-GHATAL",
    "232-CHANDRAKONA",
    "233-GARBETA",
    "234-SALBONI",
    "235-KESHPUR",
    "236-MEDINIPUR"
  ],
  "PURBA BARDHAMAN": [
    "259-KHANDAGHOSH",
    "260-BARDHAMAN DAKSHIN",
    "261-RAINA",
    "262-JAMALPUR",
    "263-MONTESWAR",
    "264-KALNA",
    "265-MEMARI",
    "266-BURDWAN UTTAR",
    "267-BHATAR",
    "268-PURBASTHALI DAKSHIN",
    "269-PURBASTHALI UTTAR",
    "270-KATWA",
    "271-KETUGRAM",
    "272-MANGALKOT",
    "273-AUSGRAM",
    "274-GALSI"
  ],
  "PURBA MEDINIPUR": [
    "203-TAMLUK",
    "204-PANSKURA PURBA",
    "205-PANSKURA PASCHIM",
    "206-MOYNA",
    "207-NANDAKUMAR",
    "208-MAHISHADAL",
    "209-HALDIA",
    "210-NANDIGRAM",
    "211-CHANDIPUR",
    "212-PATASHPUR",
    "213-KANTHI UTTAR",
    "214-BHAGABANPUR",
    "215-KHEJURI",
    "216-KANTHI DAKSHIN",
    "217-RAMNAGAR",
    "218-EGRA"
  ],
  "PURULIA": [
    "238-BANDWAN",
    "239-BALARAMPUR",
    "240-BAGHMUNDI",
    "241-JOYPUR",
    "242-PURULIA",
    "243-MANBAZAR",
    "244-KASHIPUR",
    "245-PARA",
    "246-RAGHUNATHPUR"
  ]
};

const findMatchingDistrict = (district) => {
  if (!district) return '';
  const search = district.toString().toUpperCase().trim();
  const keys = Object.keys(DISTRICT_DATA);
  const found = keys.find(k => k === search || k.replace(/\s+/g, '') === search.replace(/\s+/g, ''));
  return found || search;
};

const findMatchingAC = (district, ac) => {
  if (!district || !ac) return '';
  const normalizedAc = ac.toString().toUpperCase().replace(/[\s\-_:]*\((S[CT])\)/gi, '').trim();
  const options = DISTRICT_DATA[district];
  if (!options) return normalizedAc;

  let found = options.find(opt => opt === normalizedAc);
  if (found) return found;

  const cleanSearch = normalizedAc.replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
  found = options.find(opt => {
    const cleanOpt = opt.replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanOpt === cleanSearch;
  });
  if (found) return found;

  const numMatch = normalizedAc.match(/^(\d+)/);
  if (numMatch) {
    const num = numMatch[1];
    found = options.find(opt => opt.startsWith(num + '-'));
    if (found) return found;
  }

  const nameOnly = normalizedAc.replace(/^\d+[\s\-_:]*/, '').trim();
  if (nameOnly) {
    found = options.find(opt => opt.replace(/^\d+[\s\-]+/, '').trim() === nameOnly);
    if (found) return found;
  }

  return normalizedAc;
};

const FsvInstallationForm = ({ initialData, onNext, onBack }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scanningField, setScanningField] = useState(null);

  const [formData, setFormData] = useState({
    districtName: findMatchingDistrict(initialData?.districtName) || '',
    acName: findMatchingAC(findMatchingDistrict(initialData?.districtName), initialData?.acName) || '',
    vehicleNo: (initialData?.vehicleNo || '').toUpperCase().replace(/\s+/g, ''),
    installationDate: new Date().toISOString().split('T')[0],
    installationSiteAddress: (initialData?.installationSiteAddress || '').toUpperCase(),
    driverName: (initialData?.driverName || '').toUpperCase(),
    driverMobileNo: initialData?.driverMobileNo || '',
    fstName: '',
    fstMobileNo: '',
    typeOfVehicle: (initialData?.typeOfVehicle || '').toUpperCase(),
    ptzCameraModelNumber: initialData?.ptzCameraModelNumber || 'ATPL',
    ptzCameraSerialNumber: initialData?.ptzCameraSerialNumber || '',
    ptzCameraInstalledOnVehicle: 'No',
    nvrModelNo: '',
    nvrInstalled: 'No',
    batterySerialNo: '',
    batteryInstalledAtVehicle: 'No',
    backsideLCDInstalled: 'No',
    gpsDeviceSerialNo: '',
    gpsDeviceInstalled: 'No',
    dcAcConverterInstalled: 'No',
    internet4GRouterInstalledBackSite: 'No',
    internet4GRouterSimNo: '',
    electricalPowerStripInstalled: 'No',
    trainingToDriverAndFSTMember: 'No',
    successfulTestWebStreaming: 'No',
    isQrtVehicle: 'No'
  });

  const [isVehicleExists, setIsVehicleExists] = useState(false);
  const [isCameraExists, setIsCameraExists] = useState(false);
  const [cameraExistsData, setCameraExistsData] = useState(null);
  const [cameraStatus, setCameraStatus] = useState(null);
  const [isCameraDuplicateModalOpen, setIsCameraDuplicateModalOpen] = useState(false);
  const [isCameraPendingModalOpen, setIsCameraPendingModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isValidatingCamera, setIsValidatingCamera] = useState(false);

  const getSuggestionValue = (suggestion) => suggestion;
  const renderSuggestion = (suggestion) => <div>{suggestion}</div>;

  const handleSuggestionsFetchRequested = async ({ value }) => {
    if (value.length >= 3) {
      try {
        const response = await getFsvSuggestions(value);
        if (response.success) {
          setSuggestions(response.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestionSelected = (suggestionValue) => {
    setFormData(prev => ({ ...prev, ptzCameraSerialNumber: suggestionValue }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  React.useEffect(() => {
    if (!formData.vehicleNo || !formData.vehicleNo.trim()) {
      setIsVehicleExists(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const result = await checkVehicleExists(formData.vehicleNo);
        if (result.success) {
          setIsVehicleExists(result.exists);
        } else {
          setIsVehicleExists(false);
        }
      } catch (err) {
        console.error("Error in checkVehicleExists effect:", err);
        setIsVehicleExists(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [formData.vehicleNo]);

  React.useEffect(() => {
    if (!formData.ptzCameraSerialNumber || !formData.ptzCameraSerialNumber.trim()) {
      setIsCameraExists(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const result = await checkCameraExists(formData.ptzCameraSerialNumber);
        if (result.exists && result.data) {
          setIsCameraExists(true);
          setCameraStatus(result.status);
          const cleanData = result.data;
          const matchedDistrict = findMatchingDistrict(cleanData.districtName);
          const matchedAC = findMatchingAC(matchedDistrict, cleanData.acName);

          setCameraExistsData({
            districtName: matchedDistrict || cleanData.districtName || 'Unknown',
            acName: matchedAC || cleanData.acName || 'Unknown',
            vehicleNo: cleanData.vehicleNo || 'Unknown',
            vehiclePhotoUrl: cleanData.vehiclePhotoUrl,
            driverPhotoUrl: cleanData.driverPhotoUrl,
            fstMemberPhotoUrl: cleanData.fstMemberPhotoUrl,
            serviceProviderPhotoUrl: cleanData.serviceProviderPhotoUrl,
            pilPhotoUrl: cleanData.pilPhotoUrl,
            localScreenPhotoUrl: cleanData.localScreenPhotoUrl,
            streamScreenshotUrl: cleanData.streamScreenshotUrl,
            _id: cleanData._id
          });
          
          if (result.status === 'Pending') {
            setIsCameraPendingModalOpen(true);
          } else {
            setIsCameraDuplicateModalOpen(true);
          }

          setFormData(prev => ({
            ...prev,
            districtName: matchedDistrict || prev.districtName,
            acName: matchedAC || prev.acName,
            vehicleNo: (cleanData.vehicleNo || '').toUpperCase().replace(/\s+/g, ''),
            driverName: (cleanData.driverName || '').toUpperCase(),
            driverMobileNo: cleanData.driverMobileNo ? String(cleanData.driverMobileNo) : '',
            ptzCameraModelNumber: cleanData.ptzCameraModelNumber || '',
            isQrtVehicle: cleanData.isQrtVehicle || cleanData.isQRTVehicle || prev.isQrtVehicle || 'No',
            state: cleanData.state || prev.state,
            installationSiteAddress: (cleanData.installationSiteAddress || '').toUpperCase(),
            typeOfVehicle: (cleanData.typeOfVehicle || '').toUpperCase(),
            successfulTestWebStreaming: cleanData.successfulTestWebStreaming || '',
            nvrInstalled: cleanData.nvrInstalled || '',
            nvrModelNo: cleanData.nvrModelNo || '',
            batteryInstalledAtVehicle: cleanData.batteryInstalledAtVehicle || '',
            batterySerialNo: cleanData.batterySerialNo || '',
            gpsDeviceInstalled: cleanData.gpsDeviceInstalled || '',
            gpsDeviceSerialNo: cleanData.gpsDeviceSerialNo || '',
            internet4GRouterInstalledBackSite: cleanData.internet4GRouterInstalledBackSite || '',
            internet4GRouterSimNo: cleanData.internet4GRouterSimNo || ''
          }));
        } else {
          setIsCameraExists(false);
        }
      } catch (err) {
        console.error("Error in checkCameraExists effect:", err);
        setIsCameraExists(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [formData.ptzCameraSerialNumber]);

  const handleScanClick = (field) => {
    setScanningField(field);
    onOpen();
  };

  const handleScanSuccess = (decodedText) => {
    if (scanningField) {
      let formattedText = decodedText;
      if (scanningField === 'vehicleNo') {
        formattedText = decodedText.toUpperCase().replace(/\s+/g, '');
      } else if (scanningField === 'driverName') {
        formattedText = decodedText.toUpperCase();
      }
      setFormData(prev => ({ ...prev, [scanningField]: formattedText }));
      toast({
        title: "Scanned Successfully",
        description: `Value for ${scanningField} updated.`,
        status: "success",
        duration: 2000,
      });
      onClose();
      setScanningField(null);
    }
  };

  React.useEffect(() => {
    if (initialData) {
      const cleanData = {};
      Object.keys(initialData).forEach(key => {
        cleanData[key.trim()] = initialData[key];
      });

      const matchedDistrict = findMatchingDistrict(cleanData.districtName);
      const matchedAC = findMatchingAC(matchedDistrict, cleanData.acName);

      setFormData(prev => ({
        ...prev,
        districtName: matchedDistrict || prev.districtName,
        acName: matchedAC || prev.acName,
        vehicleNo: (cleanData.vehicleNo || prev.vehicleNo || '').toUpperCase().replace(/\s+/g, ''),
        driverName: (cleanData.driverName || prev.driverName || '').toUpperCase(),
        driverMobileNo: cleanData.driverMobileNo ? String(cleanData.driverMobileNo) : prev.driverMobileNo,
        ptzCameraModelNumber: cleanData.ptzCameraModelNumber || prev.ptzCameraModelNumber,
        ptzCameraSerialNumber: cleanData.ptzCameraSerialNumber || prev.ptzCameraSerialNumber,
        isQrtVehicle: cleanData.isQrtVehicle || cleanData.isQRTVehicle || prev.isQrtVehicle || 'No',
        state: cleanData.state || prev.state,
        installationSiteAddress: (cleanData.installationSiteAddress || prev.installationSiteAddress || '').toUpperCase(),
        typeOfVehicle: (cleanData.typeOfVehicle || prev.typeOfVehicle || '').toUpperCase()
      }));
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'driverMobileNo') {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    let updatedValue = value;
    if (name === 'driverName') {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
      updatedValue = value.toUpperCase();
    } else if (name === 'vehicleNo') {
      updatedValue = value.toUpperCase().replace(/\s+/g, '');
    } else if (name === 'installationSiteAddress' || name === 'typeOfVehicle') {
      updatedValue = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: updatedValue }));
  };

  const handleDistrictChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      districtName: value,
      acName: ''
    }));
  };

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = async () => {
    const requiredFields = [
      { key: 'districtName', label: 'District Name' },
      { key: 'acName', label: 'AC Name' },
      { key: 'vehicleNo', label: 'Vehicle No' },
      { key: 'installationSiteAddress', label: 'Site Address' },
      { key: 'driverName', label: 'Driver Name' },
      { key: 'driverMobileNo', label: 'Driver Mobile' },
      { key: 'typeOfVehicle', label: 'Vehicle Type' },
      { key: 'isQrtVehicle', label: 'Is QRT vehicle?' },
    ];
    const missingFields = requiredFields.filter(f => !formData[f.key] || !formData[f.key].trim()).map(f => f.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Fields",
        description: `Please fill: ${missingFields.join(', ')}`,
        status: "warning",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    if (formData.driverMobileNo.length !== 10) {
      toast({
        title: "Invalid Mobile",
        description: "Driver mobile must be 10 digits.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    if (isVehicleExists) {
      toast({
        title: "Duplicate Vehicle",
        description: "Vehicle Number already exists. Duplicate submissions are not allowed.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    if (isCameraExists) {
      toast({
        title: "Duplicate Camera ID",
        description: "Camera ID already exists. Duplicate submissions are not allowed.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    // Validate Camera ID against 3rd party API before saving
    if (formData.ptzCameraSerialNumber && formData.ptzCameraSerialNumber.trim()) {
      setIsValidatingCamera(true);
      try {
        const userName = localStorage.getItem('name') || 'installer';
        const userEmail = `${userName.replace(/\s+/g, '.').toLowerCase()}@vmukti.com`;

        const validationResponse = await axios.post(
          'https://electionarcisai.vmukti.com:8083/api/camera/getCurrentUserCameras1?allIdsOnly=true&mode=add',
          { userEmail },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        const allowedIds = validationResponse.data;
        const cameraId = formData.ptzCameraSerialNumber.trim();

        // Debug: log the full API response to understand its structure
        console.log('=== Camera Validation API Response ===');
        console.log('Type:', typeof allowedIds);
        console.log('Is Array:', Array.isArray(allowedIds));
        console.log('Full Response:', JSON.stringify(allowedIds, null, 2));
        console.log('Camera ID to check:', cameraId);

        // Build list from any possible response shape
        let idList = [];
        if (Array.isArray(allowedIds)) {
          idList = allowedIds;
        } else if (Array.isArray(allowedIds?.data)) {
          idList = allowedIds.data;
        } else if (Array.isArray(allowedIds?.cameras)) {
          idList = allowedIds.cameras;
        } else if (Array.isArray(allowedIds?.ids)) {
          idList = allowedIds.ids;
        } else if (Array.isArray(allowedIds?.cameraIds)) {
          idList = allowedIds.cameraIds;
        } else if (typeof allowedIds === 'object' && allowedIds !== null) {
          // Flatten all values in case it's { [key]: id } or similar
          idList = Object.values(allowedIds).flat();
        }

        console.log('Extracted idList:', JSON.stringify(idList));

        // Check match — handle string IDs and object IDs
        const isAllowed = idList.some(id => {
          if (typeof id === 'string') return id.trim() === cameraId;
          if (typeof id === 'number') return String(id).trim() === cameraId;
          // Object — try all common field names
          const val = (id?.deviceId || id?.cameraId || id?.id || id?.camera_id || id?.serialNumber || '');
          return String(val).trim() === cameraId;
        });

        console.log('isAllowed:', isAllowed);

        if (!isAllowed) {
          toast({
            title: "Camera ID Not Found",
            description: "Camera ID does not exist. Please contact the Backend Team.",
            status: "error",
            duration: 7000,
            isClosable: true
          });
          setIsValidatingCamera(false);
          return;
        }
      } catch (validationError) {
        console.error('Camera ID validation error:', validationError);
        toast({
          title: "Validation Error",
          description: "Unable to validate Camera ID. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
        setIsValidatingCamera(false);
        return;
      }
      setIsValidatingCamera(false);
    }

    try {
      const response = await createFsvReport(formData);
      if (response.success) {
        toast({ title: "Details Saved", status: "success" });
        setIsSaved(true);
        if (onNext) {
          onNext(response.data.vehicleId, formData);
          setTimeout(() => {
            document.getElementById('fsv-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        } else {
          navigate('/autoinstaller', {
            state: {
              fsvVehicleId: response.data.vehicleId,
              fsvFormData: formData
            }
          });
        }
      } else {
        toast({ title: "Saving Failed", description: response.message, status: "error" });
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error.message;
      toast({ title: "Saving Failed", description: errorMsg, status: "error", duration: 6000, isClosable: true });
    }
  };

  return (
    <Box minH="100vh" bg="#F8FAFC" py={{ base: 6, md: 12 }} fontFamily="'Inter', 'Roboto', sans-serif">
      <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
        {/* Header Section */}
        <Box
          bg="white"
          borderRadius="xl"
          p={{ base: 6, md: 8 }}
          mb={8}
          boxShadow="sm"
          borderTop="4px solid"
          borderColor="blue.600"
          position="relative"
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            align="center"
            justify="center"
            position="relative"
            w="100%"
          >
            <Button
              position={{ base: "static", md: "absolute" }}
              left="0"
              mb={{ base: 4, md: 0 }}
              onClick={() => {
                window.location.href = '/autoinstaller';
              }}
              colorScheme="blue"
              variant="ghost"
              leftIcon={<MdArrowBack />}
              size="sm"
              borderRadius="md"
              _hover={{ bg: 'blue.50', color: 'blue.700' }}
            >
              Back to Installer
            </Button>
            <Box textAlign="center">
              <Heading
                size={{ base: "lg", md: "xl" }}
                color="gray.800"
                fontWeight="extrabold"
                mb={2}
                letterSpacing="tight"
              >
                FSV Installation Form
              </Heading>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.500" fontWeight="medium">
                Field Surveillance Vehicle Registration
              </Text>
            </Box>
          </Flex>
        </Box>

        <Stack spacing={8}>
          <fieldset disabled={isCameraExists || isSaved} style={{ border: 'none', padding: 0, margin: 0 }}>
          {/* Section 1: Vehicle & Installation Details */}
          <Box
            bg="white"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.100"
            _hover={{ boxShadow: "md" }}
            transition="all 0.2s"
          >
            <Flex align="center" mb={6} pb={4} borderBottom="1px solid" borderColor="gray.100">
              <Box bg="blue.50" p={2} borderRadius="lg" mr={4}>
                <MdDirectionsCar size="24px" color="#3182ce" />
              </Box>
              <Heading size="md" color="black" fontWeight="700">Vehicle & Installation Details</Heading>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">District Name</FormLabel>
                <Select
                  name="districtName"
                  value={formData.districtName}
                  onChange={handleDistrictChange}
                  placeholder="Select District"
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  sx={{
                    "& > option": {
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      fontSize: { base: "13px", md: "15px" }
                    }
                  }}
                >
                  {Object.keys(DISTRICT_DATA).map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">AC Name</FormLabel>
                <Select
                  name="acName"
                  value={formData.acName}
                  onChange={handleInputChange}
                  placeholder="Select AC Name"
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                  isDisabled={!formData.districtName}
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  sx={{
                    "& > option": {
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      fontSize: { base: "13px", md: "15px" },
                      maxWidth: "100%"
                    }
                  }}
                >
                  {formData.districtName &&
                    DISTRICT_DATA[formData.districtName]?.map(ac => (
                      <option key={ac} value={ac}>
                        {ac}
                      </option>
                    ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Site Address</FormLabel>
                <Input
                  name="installationSiteAddress"
                  value={formData.installationSiteAddress}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
              </FormControl>

              <FormControl isRequired isInvalid={isVehicleExists}>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Vehicle No</FormLabel>
                <InputGroup size="md">
                  <Input
                    name="vehicleNo"
                    value={formData.vehicleNo}
                    onChange={handleInputChange}
                    bg="gray.50"
                    borderColor={isVehicleExists ? "red.300" : "gray.200"}
                    _hover={{ borderColor: isVehicleExists ? "red.400" : "blue.300" }}
                    _focus={{ bg: "white", borderColor: isVehicleExists ? "red.500" : "blue.500", boxShadow: isVehicleExists ? "0 0 0 1px #e53e3e" : "0 0 0 1px #3182ce" }}
                    borderRadius="md"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Scan QR"
                      icon={<MdQrCodeScanner />}
                      onClick={() => handleScanClick('vehicleNo')}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
                {isVehicleExists && (
                  <Text color="red.500" fontSize="xs" mt={1.5} fontWeight="semibold">
                    Vehicle Number already exists
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Vehicle Type</FormLabel>
                <Input
                  name="typeOfVehicle"
                  value={formData.typeOfVehicle}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Is QRT vehicle?</FormLabel>
                <RadioGroup
                  name="isQrtVehicle"
                  value={formData.isQrtVehicle}
                  onChange={(val) => handleRadioChange('isQrtVehicle', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Driver Name</FormLabel>
                <Input
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
              </FormControl>

              <FormControl isRequired isInvalid={formData.driverMobileNo.length > 0 && formData.driverMobileNo.length !== 10}>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Driver Mobile</FormLabel>
                <Input
                  name="driverMobileNo"
                  type="tel"
                  value={formData.driverMobileNo}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
                <Text color="red.500" fontSize="xs" mt={1.5} fontWeight="semibold" display={formData.driverMobileNo.length > 0 && formData.driverMobileNo.length !== 10 ? "block" : "none"}>
                  Driver mobile must be exactly 10 digits.
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Installation Date</FormLabel>
                <Input
                  type="date"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
              </FormControl>
            </SimpleGrid>
          </Box>

          {/* Section 2: Equipment Details */}
          <Box
            bg="white"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.100"
            _hover={{ boxShadow: "md" }}
            transition="all 0.2s"
          >
            <Flex align="center" mb={6} pb={4} borderBottom="1px solid" borderColor="gray.100">
              <Box bg="blue.50" p={2} borderRadius="lg" mr={4}>
                <MdVideocam size="24px" color="#3182ce" />
              </Box>
              <Heading size="md" color="black" fontWeight="700">Equipment Details</Heading>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">PTZ Installed?</FormLabel>
                <RadioGroup
                  name="ptzCameraInstalledOnVehicle"
                  value={formData.ptzCameraInstalledOnVehicle}
                  onChange={(val) => handleRadioChange('ptzCameraInstalledOnVehicle', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">PTZ Model No</FormLabel>
                <InputGroup size="md">
                  <Input
                    name="ptzCameraModelNumber"
                    value={formData.ptzCameraModelNumber}
                    onChange={handleInputChange}
                    bg="gray.50"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="md"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Scan QR"
                      icon={<MdQrCodeScanner />}
                      onClick={() => handleScanClick('ptzCameraModelNumber')}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isInvalid={isCameraExists}>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">PTZ Camera ID</FormLabel>
                <Box position="relative">
                  <InputGroup size="md">
                    <Input
                      name="ptzCameraSerialNumber"
                      value={formData.ptzCameraSerialNumber}
                      placeholder="Search Camera ID..."
                      autoComplete="off"
                      bg="gray.50"
                      borderColor={isCameraExists ? "red.300" : "gray.200"}
                      _hover={{ borderColor: isCameraExists ? "red.400" : "blue.300" }}
                      _focus={{ bg: "white", borderColor: isCameraExists ? "red.500" : "blue.500", boxShadow: isCameraExists ? "0 0 0 1px #e53e3e" : "0 0 0 1px #3182ce" }}
                      borderRadius="md"
                      onChange={async (e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, ptzCameraSerialNumber: val }));
                        if (val.length >= 3) {
                          try {
                            const response = await getFsvSuggestions(val);
                            if (response && response.success) {
                              setSuggestions(response.suggestions);
                              setShowSuggestions(true);
                            } else {
                              setSuggestions([]);
                              setShowSuggestions(false);
                            }
                          } catch {
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }
                        } else {
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label="Scan QR"
                        icon={<MdQrCodeScanner />}
                        onClick={() => handleScanClick('ptzCameraSerialNumber')}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                      />
                    </InputRightElement>
                  </InputGroup>
                  {showSuggestions && suggestions.length > 0 && (
                    <Box
                      position="absolute"
                      zIndex={10}
                      mt={1}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      boxShadow="0 10px 15px -3px rgba(0,0,0,0.1)"
                      w="100%"
                      maxH="250px"
                      overflowY="auto"
                    >
                      {suggestions.map((suggestion) => (
                        <Box
                          key={suggestion}
                          px={5}
                          py={3}
                          cursor="pointer"
                          fontSize="sm"
                          fontWeight="400"
                          borderBottom="1px solid"
                          borderColor="gray.100"
                          _hover={{ bg: 'gray.50' }}
                          onMouseDown={() => handleSuggestionSelected(suggestion)}
                        >
                          {suggestion}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                {isCameraExists && (
                  <Text color="red.500" fontSize="xs" mt={1.5} fontWeight="semibold">
                    {cameraStatus === 'Pending'
                      ? "Details already saved. Please upload images."
                      : "Camera ID already exists. Please Contact Backend Team."}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Camera View Visible?</FormLabel>
                <RadioGroup
                  name="successfulTestWebStreaming"
                  value={formData.successfulTestWebStreaming}
                  onChange={(val) => handleRadioChange('successfulTestWebStreaming', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              {/* NVR */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">NVR Installed?</FormLabel>
                <RadioGroup
                  name="nvrInstalled"
                  value={formData.nvrInstalled}
                  onChange={(val) => handleRadioChange('nvrInstalled', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">NVR Model No</FormLabel>
                <Input
                  name="nvrModelNo"
                  value={formData.nvrModelNo}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
              </FormControl>

              {/* Battery */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Battery Installed?</FormLabel>
                <RadioGroup
                  name="batteryInstalledAtVehicle"
                  value={formData.batteryInstalledAtVehicle}
                  onChange={(val) => handleRadioChange('batteryInstalledAtVehicle', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Battery Serial No</FormLabel>
                <InputGroup size="md">
                  <Input
                    name="batterySerialNo"
                    value={formData.batterySerialNo}
                    onChange={handleInputChange}
                    bg="gray.50"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="md"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Scan QR"
                      icon={<MdQrCodeScanner />}
                      onClick={() => handleScanClick('batterySerialNo')}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* GPS */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">GPS Installed?</FormLabel>
                <RadioGroup
                  name="gpsDeviceInstalled"
                  value={formData.gpsDeviceInstalled}
                  onChange={(val) => handleRadioChange('gpsDeviceInstalled', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">GPS Serial No</FormLabel>
                <InputGroup size="md">
                  <Input
                    name="gpsDeviceSerialNo"
                    value={formData.gpsDeviceSerialNo}
                    onChange={handleInputChange}
                    bg="gray.50"
                    borderColor="gray.200"
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    borderRadius="md"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Scan QR"
                      icon={<MdQrCodeScanner />}
                      onClick={() => handleScanClick('gpsDeviceSerialNo')}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Router */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Router Installed?</FormLabel>
                <RadioGroup
                  name="internet4GRouterInstalledBackSite"
                  value={formData.internet4GRouterInstalledBackSite}
                  onChange={(val) => handleRadioChange('internet4GRouterInstalledBackSite', val)}
                >
                  <HStack spacing={6} mt={2}>
                    <Radio value="Yes" size="lg" colorScheme="green" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">Yes</Text>
                    </Radio>
                    <Radio value="No" size="lg" colorScheme="red" borderColor="gray.300">
                      <Text fontSize="md" fontWeight="500" color="gray.900">No</Text>
                    </Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.900">Router No</FormLabel>
                <Input
                  name="internet4GRouterSimNo"
                  value={formData.internet4GRouterSimNo}
                  onChange={handleInputChange}
                  size="md"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  borderRadius="md"
                />
              </FormControl>
            </SimpleGrid>
          </Box>
          </fieldset>
        </Stack>

        {isCameraExists && cameraExistsData && (
          <Box
            bg="white"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.100"
            mt={8}
          >
            <Flex align="center" mb={6} pb={4} borderBottom="1px solid" borderColor="gray.100">
              <Box bg="blue.50" p={2} borderRadius="lg" mr={4}>
                <MdPhoto size="24px" color="#3182ce" />
              </Box>
              <Heading size="md" color="black" fontWeight="700">Uploaded Images</Heading>
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
              {[
                { label: 'Vehicle Photo', url: cameraExistsData.vehiclePhotoUrl },
                { label: 'Driver Photo', url: cameraExistsData.driverPhotoUrl },
                { label: 'FST Member Photo', url: cameraExistsData.fstMemberPhotoUrl },
                { label: 'Service Provider Photo', url: cameraExistsData.serviceProviderPhotoUrl },
                { label: 'PIL Photo', url: cameraExistsData.pilPhotoUrl },
                { label: 'Local Screen Photo', url: cameraExistsData.localScreenPhotoUrl },
                { label: 'Stream Screenshot', url: cameraExistsData.streamScreenshotUrl },
              ].filter(img => img.url).map((img, idx) => (
                <Box key={idx} borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
                  <Text fontWeight="600" bg="gray.50" p={2} fontSize="sm" textAlign="center" borderBottom="1px solid" borderColor="gray.200">
                    {img.label}
                  </Text>
                  <Image src={img.url} alt={img.label} objectFit="cover" w="100%" h="200px" fallbackSrc="https://via.placeholder.com/400x300?text=No+Image" />
                </Box>
              ))}
            </SimpleGrid>
            {![cameraExistsData.vehiclePhotoUrl, cameraExistsData.driverPhotoUrl, cameraExistsData.fstMemberPhotoUrl, cameraExistsData.serviceProviderPhotoUrl, cameraExistsData.pilPhotoUrl, cameraExistsData.localScreenPhotoUrl, cameraExistsData.streamScreenshotUrl].some(Boolean) && (
                <Text color="gray.500" textAlign="center" py={4}>No images were uploaded for this camera.</Text>
            )}
          </Box>
        )}

        {/* Next Button */}
        <Box mt={10}>
          <Button
            onClick={handleNext}
            size="lg"
            isDisabled={isVehicleExists || isCameraExists || isSaved || isValidatingCamera}
            isLoading={isValidatingCamera}
            loadingText="Validating Camera ID..."
            w="full"
            h="60px"
            bg={isSaved ? "green.500" : "blue.600"}
            color="white"
            _hover={{
              bg: isSaved ? "green.600" : "blue.700",
              transform: isSaved ? "none" : "translateY(-2px)",
              boxShadow: isSaved ? "md" : "lg"
            }}
            _active={{
              bg: isSaved ? "green.600" : "blue.800",
              transform: "translateY(0)",
              boxShadow: "sm"
            }}
            borderRadius="xl"
            fontSize="lg"
            fontWeight="bold"
            boxShadow="md"
            transition="all 0.3s"
          >
            {isSaved ? "Details Saved ✅" : "Submit Details"}
          </Button>
        </Box>
      </Container>

      {/* QR Scanner Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="xl" overflow="hidden" boxShadow="2xl">
          <ModalHeader
            bg="white"
            color="gray.800"
            fontSize="xl"
            fontWeight="bold"
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            Scan QR Code
          </ModalHeader>
          <ModalCloseButton color="gray.500" mt={1} />
          <ModalBody p={6} bg="gray.50">
            {isOpen && <QRCodeScanner onScanSuccess={handleScanSuccess} />}
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* Duplicate Camera Modal */}
      <Modal 
        isOpen={isCameraDuplicateModalOpen} 
        onClose={() => setIsCameraDuplicateModalOpen(false)} 
        size={{ base: "sm", md: "md" }} 
        isCentered
      >
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent mx={{ base: 4, md: 0 }} borderRadius="xl" overflow="hidden" boxShadow="2xl">
          <ModalHeader
            bg="red.500"
            color="white"
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="bold"
          >
            Duplicate Camera ID
          </ModalHeader>
          <ModalCloseButton color="white" mt={1} />
          <ModalBody p={{ base: 5, md: 6 }} bg="white">
            <Text fontSize={{ base: "sm", md: "md" }} color="gray.800" fontWeight="medium" mb={6} lineHeight="tall">
              This Camera ID is already assigned to <strong>{cameraExistsData?.districtName}</strong>, <strong>{cameraExistsData?.acName}</strong>, and <strong>{cameraExistsData?.vehicleNo}</strong>. Please contact the Backend Team.
            </Text>
            <Flex justify={{ base: "center", md: "flex-end" }}>
              <Button w={{ base: "full", md: "auto" }} colorScheme="red" size={{ base: "md", md: "md" }} onClick={() => setIsCameraDuplicateModalOpen(false)}>
                Understood
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Pending Camera Images Modal */}
      <Modal 
        isOpen={isCameraPendingModalOpen} 
        onClose={() => setIsCameraPendingModalOpen(false)} 
        size={{ base: "sm", md: "md" }} 
        isCentered
      >
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent mx={{ base: 4, md: 0 }} borderRadius="xl" overflow="hidden" boxShadow="2xl">
          <ModalHeader
            bg="blue.500"
            color="white"
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="bold"
          >
            Pending Images
          </ModalHeader>
          <ModalCloseButton color="white" mt={1} />
          <ModalBody p={{ base: 5, md: 6 }} bg="white">
            <Text fontSize={{ base: "sm", md: "md" }} color="gray.800" fontWeight="medium" mb={6} lineHeight="tall">
              The details for this Camera ID are already saved, but the photos are pending. Would you like to upload them now?
            </Text>
            <Flex justify={{ base: "center", md: "flex-end" }} gap={3}>
              <Button w={{ base: "full", md: "auto" }} colorScheme="gray" size={{ base: "md", md: "md" }} onClick={() => setIsCameraPendingModalOpen(false)}>
                Cancel
              </Button>
              <Button w={{ base: "full", md: "auto" }} colorScheme="blue" size={{ base: "md", md: "md" }} onClick={() => {
                setIsCameraPendingModalOpen(false);
                if (onNext && cameraExistsData) {
                  onNext(cameraExistsData._id, formData);
                  setTimeout(() => {
                    document.getElementById('fsv-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 300);
                }
              }}>
                Upload Images
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FsvInstallationForm;
