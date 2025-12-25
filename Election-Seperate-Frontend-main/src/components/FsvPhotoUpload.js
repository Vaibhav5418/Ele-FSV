import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { FaCamera, FaRedo, FaFilePdf } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const FsvPhotoUpload = ({ vehicleId, formData, onUploadComplete }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState({
    vehiclePhoto: null,
    driverPhoto: null,
    serviceProviderPhoto: null
  });
  const [streamScreenshot, setStreamScreenshot] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const webcamRef = useRef(null);
  const previewRef = useRef(null);

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "environment"
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
        // Convert base64 to blob
        fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], `${currentField}.jpg`, { type: "image/jpeg" });
            setPhotos(prev => ({ ...prev, [currentField]: file }));
            onClose();
        });
    }
  }, [webcamRef, currentField, onClose]);

  const openCamera = (fieldName) => {
      setCurrentField(fieldName);
      onOpen();
  };

  const captureStreamScreenshot = async () => {
    // Find the stream video element (you may need to adjust the selector)
    const streamElement = document.querySelector('video') || document.querySelector('iframe');
    if (streamElement) {
      try {
        const canvas = await html2canvas(streamElement);
        canvas.toBlob((blob) => {
          const file = new File([blob], 'stream-screenshot.jpg', { type: "image/jpeg" });
          setStreamScreenshot(file);
        });
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

  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = 20;

    // Helper function to draw table cell
    const drawCell = (x, y, width, height, text, isBold = false) => {
      pdf.rect(x, y, width, height);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(9);
      const lines = pdf.splitTextToSize(text, width - 4);
      pdf.text(lines, x + 2, y + 5);
    };

    // VMukti Logo/Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VMukti', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TARN TARAN BYE ELECTION - FSV 2025', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    pdf.text('INSTALLATION REPORT OF FLYING SQUAD VEHICLE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Basic Information Section (2 columns)
    const col1Width = (pageWidth - 2 * margin) / 2;
    const col2Width = (pageWidth - 2 * margin) / 2;
    const rowHeight = 8;

    // Row 1: District Name | AC Name
    drawCell(margin, yPos, col1Width, rowHeight, `District Name: ${formData?.districtName || ''}`, true);
    drawCell(margin + col1Width, yPos, col2Width, rowHeight, `AC Name: ${formData?.acName || ''}`, true);
    yPos += rowHeight;

    // Row 2: Vehicle No | Installation Date
    drawCell(margin, yPos, col1Width, rowHeight, `Vehicle No: ${formData?.vehicleNo || ''}`, true);
    drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Installation Date: ${formData?.installationDate || ''}`, true);
    yPos += rowHeight;

    // Row 3: Driver Name | Installation Site & Address
    drawCell(margin, yPos, col1Width, rowHeight, `Driver Name: ${formData?.driverName || ''}`, true);
    drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Installation Site & Address: ${formData?.installationSiteAddress || ''}`, true);
    yPos += rowHeight;

    // Row 4: Driver Mobile No | Type of Vehicle
    drawCell(margin, yPos, col1Width, rowHeight, `Driver Mobile No: ${formData?.driverMobileNo || ''}`, true);
    drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Type of Vehicle: ${formData?.typeOfVehicle || ''}`, true);
    yPos += rowHeight;

    // Row 5: FST Name | FST Mobile No
    drawCell(margin, yPos, col1Width, rowHeight, `FST Name: ${formData?.fstName || ''}`, true);
    drawCell(margin + col1Width, yPos, col2Width, rowHeight, `FST Mobile No: ${formData?.fstMobileNo || ''}`, true);
    yPos += rowHeight;

    yPos += 3;

    // Equipment Table Header
    const descWidth = (pageWidth - 2 * margin) * 0.5;
    const serialWidth = (pageWidth - 2 * margin) * 0.3;
    const installedWidth = (pageWidth - 2 * margin) * 0.2;

    drawCell(margin, yPos, descWidth, rowHeight, 'DESCRIPTION', true);
    drawCell(margin + descWidth, yPos, serialWidth, rowHeight, 'SERIAL NO', true);
    drawCell(margin + descWidth + serialWidth, yPos, installedWidth, rowHeight, 'INSTALLED YES/NO', true);
    yPos += rowHeight;

    // Equipment rows
    const equipment = [
      ['PTZ Camera Model number', formData?.ptzCameraModelNumber || '', ''],
      ['PTZ Camera Serial number', formData?.ptzCameraSerialNumber || '', ''],
      ['PTZ Camera installed on the vehicle', '', formData?.ptzCameraInstalledOnVehicle || 'No'],
      ['NVR Model No', formData?.nvrModelNo || '', ''],
      ['NVR Installed', '', formData?.nvrInstalled || 'No'],
      ['Battery Serial No.', formData?.batterySerialNo || '', ''],
      ['Battery installed at Vehicle', '', formData?.batteryInstalledAtVehicle || 'No'],
      ['Backside LCD Installed', '', formData?.backsideLCDInstalled || 'No'],
      ['GPS Device Serial No', formData?.gpsDeviceSerialNo || '', ''],
      ['GPS Device installed', '', formData?.gpsDeviceInstalled || 'No'],
      ['DC/AC Converter Installed', '', formData?.dcAcConverterInstalled || 'No'],
      ['Internet 4G Router installed back site', '', formData?.internet4GRouterInstalledBackSite || 'No'],
      ['Internet 4G Router SIM No.', formData?.internet4GRouterSimNo || '', ''],
      ['Electrical Power strip Installed', '', formData?.electricalPowerStripInstalled || 'No'],
      ['Training to Driver & FST Member', '', formData?.trainingToDriverAndFSTMember || 'No'],
      ['Successful Test Web-Streaming', '', formData?.successfulTestWebStreaming || 'No']
    ];

    equipment.forEach(([desc, serial, installed]) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
      drawCell(margin, yPos, descWidth, rowHeight, desc);
      drawCell(margin + descWidth, yPos, serialWidth, rowHeight, serial);
      drawCell(margin + descWidth + serialWidth, yPos, installedWidth, rowHeight, installed);
      yPos += rowHeight;
    });

    yPos += 3;

    // Note section
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Note:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    const noteText = 'Henceforth, the equipment shall be in the custody of concerned Driver and Flying squad team members. They shall ensure no damage is done to the equipment';
    const noteLines = pdf.splitTextToSize(noteText, pageWidth - 2 * margin - 10);
    pdf.text(noteLines, margin + 10, yPos);
    yPos += noteLines.length * 4 + 5;

    // Photos Section (New Page)
    pdf.addPage();
    yPos = 20;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Installation Photos', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Add photos in grid (2 columns)
    const photoLabels = {
      vehiclePhoto: 'Vehicle Photo',
      driverPhoto: 'Driver Photo',
      serviceProviderPhoto: 'Service Provider Photo'
    };

    const imgWidth = 80;
    const imgHeight = 60;
    const imgSpacing = 10;
    let xPos = margin;
    let photoCount = 0;

    for (const [key, label] of Object.entries(photoLabels)) {
      if (photos[key]) {
        if (yPos > pageHeight - imgHeight - 20) {
          pdf.addPage();
          yPos = 20;
          xPos = margin;
          photoCount = 0;
        }

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, xPos, yPos);

        try {
          const imgData = await fileToBase64(photos[key]);
          pdf.addImage(imgData, 'JPEG', xPos, yPos + 3, imgWidth, imgHeight);
        } catch (error) {
          console.error(`Error adding ${label}:`, error);
        }

        photoCount++;
        if (photoCount % 2 === 0) {
          yPos += imgHeight + imgSpacing + 5;
          xPos = margin;
        } else {
          xPos = margin + imgWidth + imgSpacing;
        }
      }
    }

    // Add stream screenshot
    if (streamScreenshot) {
      if (photoCount % 2 !== 0 || yPos > pageHeight - imgHeight - 20) {
        yPos += imgHeight + imgSpacing + 5;
        xPos = margin;
      }

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Stream Screenshot', xPos, yPos);

      try {
        const imgData = await fileToBase64(streamScreenshot);
        pdf.addImage(imgData, 'JPEG', xPos, yPos + 3, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error adding stream screenshot:', error);
      }
    }

    // Save PDF with driver name and vehicle number
    const fileName = `${formData?.driverName?.replace(/\s+/g, '_') || 'Driver'}_${formData?.vehicleNo?.replace(/\s+/g, '_') || 'Vehicle'}_FSV_Report.pdf`;
    pdf.save(fileName);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const uploadPhotos = async () => {
    if (!vehicleId) {
        toast({ title: "Error", description: "Vehicle ID missing", status: "error" });
        return;
    }
    
    setIsUploading(true);
    const data = new FormData();
    let hasFiles = false;
    Object.keys(photos).forEach(key => {
      if (photos[key]) {
        data.append(key, photos[key]);
        hasFiles = true;
      }
    });

    if (!hasFiles) {
        toast({ title: "No photos captured", status: "warning" });
        setIsUploading(false);
        return;
    }

    try {
      // Generate and download PDF
      await generatePDF();
      
      // Upload photos to backend
      const response = await uploadFsvPhotos(vehicleId, data);
      if (response.success) {
        toast({ title: "Photos Uploaded & PDF Downloaded Successfully", status: "success" });
        if (onUploadComplete) onUploadComplete();
        window.location.href = '/';
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
          <FormLabel>{label}</FormLabel>
          <Box 
            border="2px dashed #ccc" 
            borderRadius="md" 
            p={4} 
            textAlign="center" 
            cursor="pointer"
            onClick={() => openCamera(name)}
            bg={photos[name] ? "green.50" : "gray.50"}
            _hover={{ bg: "gray.100" }}
          >
              {photos[name] ? (
                  <VStack>
                      <Image src={URL.createObjectURL(photos[name])} alt={label} boxSize="100px" objectFit="cover" borderRadius="md" />
                      <Button size="xs" leftIcon={<FaRedo />} colorScheme="blue" variant="outline">Retake</Button>
                  </VStack>
              ) : (
                  <VStack>
                      <FaCamera size={24} color="#718096" />
                      <Box fontSize="sm" color="gray.500">Tap to Capture</Box>
                  </VStack>
              )}
          </Box>
      </FormControl>
  );

  if (showPreview) {
    return (
      <Box mt={8} p={5} borderWidth="1px" borderRadius="lg" bg="white" ref={previewRef}>
        <Heading size="lg" mb={6} textAlign="center">FSV Installation Report Preview</Heading>
        
        {/* Form Data Preview */}
        <Box mb={6}>
          <Heading size="md" mb={4} color="blue.600">Vehicle & Installation Details</Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            <GridItem><Text><strong>District:</strong> {formData?.districtName}</Text></GridItem>
            <GridItem><Text><strong>AC Name:</strong> {formData?.acName}</Text></GridItem>
            <GridItem><Text><strong>Vehicle No:</strong> {formData?.vehicleNo}</Text></GridItem>
            <GridItem><Text><strong>Installation Date:</strong> {formData?.installationDate}</Text></GridItem>
            <GridItem><Text><strong>Site Address:</strong> {formData?.installationSiteAddress}</Text></GridItem>
            <GridItem><Text><strong>Driver Name:</strong> {formData?.driverName}</Text></GridItem>
            <GridItem><Text><strong>Driver Mobile:</strong> {formData?.driverMobileNo}</Text></GridItem>
            <GridItem><Text><strong>FST Name:</strong> {formData?.fstName}</Text></GridItem>
            <GridItem><Text><strong>FST Mobile:</strong> {formData?.fstMobileNo}</Text></GridItem>
            <GridItem><Text><strong>Vehicle Type:</strong> {formData?.typeOfVehicle}</Text></GridItem>
          </Grid>
        </Box>

        <Divider my={6} />

        <Box mb={6}>
          <Heading size="md" mb={4} color="blue.600">Equipment Details</Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            <GridItem><Text><strong>PTZ Model:</strong> {formData?.ptzCameraModelNumber}</Text></GridItem>
            <GridItem><Text><strong>PTZ Serial:</strong> {formData?.ptzCameraSerialNumber}</Text></GridItem>
            <GridItem><Text><strong>PTZ Installed:</strong> {formData?.ptzCameraInstalledOnVehicle}</Text></GridItem>
            <GridItem><Text><strong>NVR Model:</strong> {formData?.nvrModelNo}</Text></GridItem>
            <GridItem><Text><strong>NVR Installed:</strong> {formData?.nvrInstalled}</Text></GridItem>
            <GridItem><Text><strong>Battery Serial:</strong> {formData?.batterySerialNo}</Text></GridItem>
            <GridItem><Text><strong>GPS Serial:</strong> {formData?.gpsDeviceSerialNo}</Text></GridItem>
            <GridItem><Text><strong>Router SIM:</strong> {formData?.internet4GRouterSimNo}</Text></GridItem>
          </Grid>
        </Box>

        <Divider my={6} />

        {/* Photos Preview */}
        <Box mb={6}>
          <Heading size="md" mb={4} color="blue.600">Installation Photos</Heading>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
            {photos.vehiclePhoto && (
              <Box>
                <Text fontWeight="bold" mb={2}>Vehicle Photo</Text>
                <Image src={URL.createObjectURL(photos.vehiclePhoto)} alt="Vehicle" borderRadius="md" />
              </Box>
            )}
            {photos.driverPhoto && (
              <Box>
                <Text fontWeight="bold" mb={2}>Driver Photo</Text>
                <Image src={URL.createObjectURL(photos.driverPhoto)} alt="Driver" borderRadius="md" />
              </Box>
            )}
            {photos.serviceProviderPhoto && (
              <Box>
                <Text fontWeight="bold" mb={2}>Service Provider Photo</Text>
                <Image src={URL.createObjectURL(photos.serviceProviderPhoto)} alt="Service Provider" borderRadius="md" />
              </Box>
            )}
            {streamScreenshot && (
              <Box>
                <Text fontWeight="bold" mb={2}>Stream Screenshot</Text>
                <Image src={URL.createObjectURL(streamScreenshot)} alt="Stream" borderRadius="md" />
              </Box>
            )}
          </SimpleGrid>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={4} justifyContent="center" mt={8}>
          <Button colorScheme="gray" onClick={() => setShowPreview(false)}>Back to Edit</Button>
          <Button 
            colorScheme="green" 
            size="lg" 
            leftIcon={<FaFilePdf />}
            isLoading={isUploading} 
            onClick={uploadPhotos}
          >
            Submit & Download PDF
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box mt={8} p={5} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={4}>FSV Photo Upload</Heading>
      <Stack spacing={4}>
        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
          {renderPhotoField("Vehicle Photo", "vehiclePhoto")}
          {renderPhotoField("Driver Photo", "driverPhoto")}
          {renderPhotoField("Service Provider Photo", "serviceProviderPhoto")}
        </SimpleGrid>
        <Button colorScheme="blue" size="lg" onClick={showPreviewScreen}>Preview & Continue</Button>
      </Stack>

      {/* Camera Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent bg="black">
          <ModalCloseButton color="white" zIndex={10} />
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
                border="4px solid #ccc"
                onClick={capture}
                _hover={{ bg: "gray.200" }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FsvPhotoUpload;
