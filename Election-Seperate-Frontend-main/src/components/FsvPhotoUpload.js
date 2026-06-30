import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  SimpleGrid,
  Stack,
  Heading,
  useToast,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Text,
  Divider,
  Grid,
  GridItem
} from '@chakra-ui/react';
import Webcam from 'react-webcam';
import { uploadFsvPhotos } from '../actions/userActions';
import { FaCamera, FaRedo, FaCheckCircle } from 'react-icons/fa';
import html2canvas from 'html2canvas';

const FsvPhotoUpload = ({ vehicleId, formData, location, address, onUploadComplete }) => {
  const toast = useToast();
  const [photos, setPhotos] = useState({
    vehiclePhoto: null,
    localScreenPhoto: null
  });
  const [streamScreenshot, setStreamScreenshot] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const webcamRef = useRef(null);
  const previewRef = useRef(null);
  const uploadContainerRef = useRef(null);
  const [geoAddress, setGeoAddress] = useState(address || "");

  // Auto-scroll when component mounts
  useEffect(() => {
    if (uploadContainerRef.current) {
      setTimeout(() => {
        uploadContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  // Fetch address internally if prop is missing but coordinates exist
  useEffect(() => {
    if (address) {
      setGeoAddress(address);
    } else if (location?.latitude && location?.longitude) {
      const fetchAddr = async () => {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe`
          );
          if (response.data.results?.[0]) {
            setGeoAddress(response.data.results[0].formatted_address);
          }
        } catch (error) {
          console.error("Internal Geocode Error:", error);
        }
      };
      fetchAddr();
    }
  }, [address, location]);

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "environment"
  };

  const drawWatermark = (canvas) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Watermark settings
    const fontSize = Math.max(12, Math.floor(width / 30)); // Dynamic font size
    ctx.font = `bold ${fontSize}px Helvetica`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const lat = location?.latitude ? Number(location.latitude).toFixed(6) : "N/A";
    const long = location?.longitude ? Number(location.longitude).toFixed(6) : "N/A";
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const lines = [
      `Lat: ${lat}`,
      `Long: ${long}`,
      timestamp
    ];

    // Add address lines with wrapping
    const displayAddress = geoAddress || address;
    if (displayAddress) {
      const maxWidth = width * 0.45; // Take up to 45% of canvas width
      const words = String(displayAddress).split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);
    }

    const padding = 15;
    let yDelta = fontSize + 5;
    let y = padding;

    lines.forEach(line => {
      // Draw shadow for readability on any background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(line, width - padding + 1, y + 1);

      // Draw white text
      ctx.fillStyle = 'white';
      ctx.fillText(line, width - padding, y);

      y += yDelta;
    });
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const img = new window.Image();
      img.src = imageSrc;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Apply watermark
        drawWatermark(canvas);

        canvas.toBlob((blob) => {
          const file = new File([blob], `${currentField}.jpg`, { type: "image/jpeg" });
          setPhotos(prev => ({ ...prev, [currentField]: file }));
          onClose();
        }, 'image/jpeg', 0.9);
      };
    }
  }, [webcamRef, currentField, onClose, location, geoAddress, address]);

  const openCamera = (fieldName) => {
    setCurrentField(fieldName);
    onOpen();
  };

  const captureStreamScreenshot = async () => {
    const streamElement = document.querySelector('video') || document.querySelector('iframe');
    if (streamElement) {
      try {
        const canvas = await html2canvas(streamElement, {
          useCORS: true,
          logging: false
        });

        // Apply watermark
        drawWatermark(canvas);

        canvas.toBlob((blob) => {
          const file = new File([blob], 'stream-screenshot.jpg', { type: "image/jpeg" });
          setStreamScreenshot(file);
        }, 'image/jpeg', 0.9);
      } catch (error) {
        console.error('Error capturing stream screenshot:', error);
      }
    }
  };

  const showPreviewScreen = async () => {
    // Capture stream screenshot before showing preview
    await captureStreamScreenshot();
    setShowPreview(true);
  };

  const uploadPhotos = async () => {
    if (!vehicleId) {
      toast({ title: "Error", description: "Vehicle ID missing", status: "error" });
      return;
    }

    if (!photos.vehiclePhoto || !photos.localScreenPhoto || !streamScreenshot) {
      toast({
        title: "Photos Required",
        description: "Please capture Vehicle with Driver Photo, Local Screen Viewing Photo, and ensure the Portal Stream Screenshot is captured.",
        status: "warning",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    Object.keys(photos).forEach(key => {
      if (photos[key]) {
        data.append(key, photos[key]);
      }
    });

    // Add stream screenshot if captured
    if (streamScreenshot) {
      data.append('streamScreenshot', streamScreenshot);
    }

    try {
      // Upload photos to backend
      const response = await uploadFsvPhotos(vehicleId, data);
      if (response.success) {
        toast({ title: "Photos Uploaded Successfully", status: "success" });
        setIsUploaded(true);
      } else {
        toast({ title: "Upload Failed", description: response.message, status: "error" });
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, status: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const renderPhotoField = (label, name) => (
    <FormControl>
      <FormLabel fontWeight="bold" color="gray.700" mb={2}>
        {label} <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
      </FormLabel>
      <Box
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="xl"
        p={6}
        textAlign="center"
        cursor="pointer"
        onClick={() => openCamera(name)}
        bg={photos[name] ? "green.50" : "gray.50"}
        transition="all 0.2s"
        _hover={{
          bg: "gray.100",
          borderColor: "blue.400",
          transform: "translateY(-2px)",
          boxShadow: "md"
        }}
        height="180px"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        {photos[name] ? (
          <VStack spacing={3}>
            <Image
              src={URL.createObjectURL(photos[name])}
              alt={label}
              boxSize="100px"
              objectFit="cover"
              borderRadius="lg"
              boxShadow="sm"
            />
            <Button size="xs" leftIcon={<FaRedo />} colorScheme="blue" variant="outline" borderRadius="full">Retake</Button>
          </VStack>
        ) : (
          <VStack spacing={2}>
            <Box p={3} bg="white" borderRadius="full" boxShadow="sm">
              <FaCamera size={24} color="#718096" />
            </Box>
            <Box fontSize="sm" color="gray.600" fontWeight="medium">Tap to Capture</Box>
          </VStack>
        )}
      </Box>
    </FormControl>
  );

  if (showPreview) {
    return (
      <Box
        mt={8}
        p={6}
        borderWidth="1px"
        borderColor="gray.100"
        borderRadius="2xl"
        bg="white"
        ref={previewRef}
        boxShadow="xl"
      >
        <Heading size="lg" mb={6} textAlign="center" color="gray.700">FSV Installation Report Preview</Heading>

        {/* Form Data Preview */}
        <Box mb={6} bg="gray.50" p={4} borderRadius="xl">
          <Heading size="md" mb={4} color="blue.600">Vehicle & Installation Details</Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            <GridItem><Text><strong>District:</strong> {formData?.districtName}</Text></GridItem>
            <GridItem><Text><strong>AC Name:</strong> {formData?.acName}</Text></GridItem>
            <GridItem><Text><strong>Vehicle No:</strong> {formData?.vehicleNo}</Text></GridItem>
            <GridItem><Text><strong>Installation Date:</strong> {formData?.installationDate}</Text></GridItem>
            <GridItem><Text><strong>Site Address:</strong> {formData?.installationSiteAddress}</Text></GridItem>
            <GridItem><Text><strong>Driver Name:</strong> {formData?.driverName}</Text></GridItem>
            <GridItem><Text><strong>Driver Mobile:</strong> {formData?.driverMobileNo}</Text></GridItem>
            <GridItem><Text><strong>Vehicle Type:</strong> {formData?.typeOfVehicle}</Text></GridItem>
          </Grid>
        </Box>

        <Divider my={6} borderColor="gray.200" />

        <Box mb={6} bg="gray.50" p={4} borderRadius="xl">
          <Heading size="md" mb={4} color="blue.600">Equipment Details</Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            <GridItem><Text><strong>PTZ Model:</strong> {formData?.ptzCameraModelNumber}</Text></GridItem>
            <GridItem><Text><strong>PTZ Camera ID:</strong> {formData?.ptzCameraSerialNumber}</Text></GridItem>
            <GridItem><Text><strong>PTZ Installed:</strong> {formData?.ptzCameraInstalledOnVehicle}</Text></GridItem>
            <GridItem><Text><strong>NVR Model:</strong> {formData?.nvrModelNo}</Text></GridItem>
            <GridItem><Text><strong>NVR Installed:</strong> {formData?.nvrInstalled}</Text></GridItem>
            <GridItem><Text><strong>Battery Serial:</strong> {formData?.batterySerialNo}</Text></GridItem>
            <GridItem><Text><strong>GPS Serial:</strong> {formData?.gpsDeviceSerialNo}</Text></GridItem>
            <GridItem><Text><strong>Router SIM:</strong> {formData?.internet4GRouterSimNo}</Text></GridItem>
          </Grid>
        </Box>

        <Divider my={6} borderColor="gray.200" />

        {/* Photos Preview */}
        <Box mb={6}>
          <Heading size="md" mb={4} color="blue.600">Installation Photos</Heading>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
            {photos.vehiclePhoto && (
              <Box>
                <Text fontWeight="bold" mb={2} color="gray.600">Vehicle and Driver Photo</Text>
                <Image src={URL.createObjectURL(photos.vehiclePhoto)} alt="Vehicle and Driver" borderRadius="lg" boxShadow="md" />
              </Box>
            )}
            {photos.localScreenPhoto && (
              <Box>
                <Text fontWeight="bold" mb={2} color="gray.600">Local Screen Viewing</Text>
                <Image src={URL.createObjectURL(photos.localScreenPhoto)} alt="Local Screen Viewing" borderRadius="lg" boxShadow="md" />
              </Box>
            )}
            {streamScreenshot && (
              <Box>
                <Text fontWeight="bold" mb={2} color="gray.600">Portal Stream Screenshot</Text>
                <Image src={URL.createObjectURL(streamScreenshot)} alt="Stream" borderRadius="lg" boxShadow="md" />
              </Box>
            )}
          </SimpleGrid>
        </Box>

        {/* Action Buttons */}
        <Stack direction={{ base: "column", sm: "row" }} spacing={4} justifyContent="center" mt={8}>
          {!isUploaded ? (
            <Button
              colorScheme="blue"
              size="md"
              borderRadius="full"
              isLoading={isUploading}
              isDisabled={!photos.vehiclePhoto || !photos.localScreenPhoto || !streamScreenshot}
              onClick={uploadPhotos}
              w={{ base: "full", sm: "auto" }}
              fontSize="sm"
              px={8}
              boxShadow="md"
              _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
            >
              Upload Photos
            </Button>
          ) : (
            <Button
              colorScheme="green"
              size="md"
              borderRadius="full"
              onClick={() => setIsSuccessOpen(true)}
              w={{ base: "full", sm: "auto" }}
              fontSize="sm"
              px={8}
              boxShadow="md"
              _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
            >
              Submit Form
            </Button>
          )}
        </Stack>

        {/* Success Modal */}
        <Modal isOpen={isSuccessOpen} onClose={() => {}} isCentered closeOnOverlayClick={false}>
          <ModalOverlay backdropFilter="blur(8px)" />
          <ModalContent borderRadius="2xl" p={6} textAlign="center">
            <VStack spacing={5}>
              <Box color="green.500" fontSize="6xl">
                <FaCheckCircle />
              </Box>
              <Heading size="lg" color="gray.800">
                Form Submitted Successfully
              </Heading>
              <Text fontSize="md" color="gray.600">
                The submitted data and photos have been successfully stored in the database.
              </Text>
              <Button
                colorScheme="green"
                size="lg"
                w="full"
                borderRadius="xl"
                onClick={() => {
                  setIsSuccessOpen(false);
                  if (onUploadComplete) onUploadComplete();
                }}
              >
                OK
              </Button>
            </VStack>
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  return (
    <Box
      ref={uploadContainerRef}
      mt={8}
      p={6}
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      bg="white"
      boxShadow="xl"
    >
      <Heading size="md" mb={6} color="gray.700">FSV Photo Upload</Heading>
      <Stack spacing={6}>
        <SimpleGrid columns={{ base: 2, md: 2 }} spacing={6}>
          {renderPhotoField("Vehicle with Driver Photo", "vehiclePhoto")}
          {renderPhotoField("Local Screen Viewing", "localScreenPhoto")}
        </SimpleGrid>
        <Button
          colorScheme="blue"
          size="lg"
          borderRadius="full"
          bgGradient="linear(to-r, blue.500, blue.600)"
          _hover={{ bgGradient: "linear(to-r, blue.600, blue.700)", boxShadow: "lg" }}
          onClick={showPreviewScreen}
          isDisabled={!photos.vehiclePhoto || !photos.localScreenPhoto}
        >
          Preview & Continue
        </Button>
      </Stack>

      {/* Camera Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent bg="black">
          <ModalCloseButton color="white" zIndex={10} size="lg" />
          <ModalBody p={0} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Button
              position="absolute"
              bottom="50px"
              borderRadius="full"
              w="80px"
              h="80px"
              bg="white"
              border="4px solid"
              borderColor="gray.200"
              onClick={capture}
              boxShadow="0 0 20px rgba(0,0,0,0.5)"
              _hover={{ bg: "gray.100", transform: "scale(1.05)" }}
              transition="all 0.2s"
            >
              <Box w="60px" h="60px" borderRadius="full" bg="red.500" />
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FsvPhotoUpload;
