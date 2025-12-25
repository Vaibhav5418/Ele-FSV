import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Heading,
  SimpleGrid,
  useToast, // existing import
  InputGroup,
  InputRightElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure
} from '@chakra-ui/react';
import { createFsvReport } from '../actions/userActions';
import { useNavigate } from 'react-router-dom';
import { MdQrCodeScanner } from 'react-icons/md';
import QRCodeScanner from './QrCodeScanner';

const FsvInstallationForm = ({ initialData }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scanningField, setScanningField] = useState(null);

  const [formData, setFormData] = useState({
    districtName: initialData?.districtName || '',
    acName: initialData?.acName || '',
    vehicleNo: initialData?.vehicleNo || '',
    installationDate: new Date().toISOString().split('T')[0],
    installationSiteAddress: '',
    driverName: initialData?.driverName || '',
    driverMobileNo: initialData?.driverMobileNo || '',
    fstName: '',
    fstMobileNo: '',
    typeOfVehicle: '',
    ptzCameraModelNumber: initialData?.ptzCameraSerialNumber || '', // Mapping serial number
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
    successfulTestWebStreaming: 'No'
  });

  const handleScanClick = (field) => {
    setScanningField(field);
    onOpen();
  };

  const handleScanSuccess = (decodedText) => {
    if (scanningField) {
      setFormData(prev => ({ ...prev, [scanningField]: decodedText }));
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

  // Update form data if initialData changes
  React.useEffect(() => {
    console.log("FsvInstallationForm received initialData (JSON):", JSON.stringify(initialData, null, 2)); // DEBUG LOG
    if (initialData) {
      // Helper to clean keys (remove newlines/spaces)
      const cleanData = {};
      Object.keys(initialData).forEach(key => {
        cleanData[key.trim()] = initialData[key];
      });
      console.log("Cleaned Data:", cleanData); // DEBUG LOG

      setFormData(prev => {
        const newData = {
          ...prev,
          districtName: cleanData.districtName || prev.districtName,
          acName: cleanData.acName || prev.acName,
          vehicleNo: cleanData.vehicleNo || prev.vehicleNo,
          driverName: cleanData.driverName || prev.driverName,
          driverMobileNo: cleanData.driverMobileNo ? String(cleanData.driverMobileNo) : prev.driverMobileNo, // Ensure string
          ptzCameraModelNumber: cleanData.ptzCameraSerialNumber || prev.ptzCameraModelNumber,
          ptzCameraSerialNumber: cleanData.ptzCameraSerialNumber || prev.ptzCameraSerialNumber,
          state: cleanData.state || prev.state
        };
        console.log("Setting FormData to:", newData); // DEBUG LOG
        return newData;
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitForm = async () => {
    // Basic Validation
    const requiredFields = ['districtName', 'acName', 'vehicleNo', 'driverName', 'driverMobileNo', 'fstName', 'fstMobileNo'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
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

    try {
      const response = await createFsvReport(formData);
      if (response.success) {
        toast({ title: "Form Submitted", status: "success" });
        // Redirect to AutoInstaller with vehicleId and formData
        navigate('/autoinstaller', { 
          state: { 
            fsvVehicleId: response.data.vehicleId,
            fsvFormData: formData 
          } 
        });
      } else {
        toast({ title: "Submission Failed", description: response.message, status: "error" });
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, status: "error" });
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={6}>FSV Installation Form</Heading>
      
      <Stack spacing={4}>
        <Heading size="md">Vehicle & Driver Details</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired><FormLabel>District Name</FormLabel><Input name="districtName" value={formData.districtName} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>AC Name</FormLabel><Input name="acName" value={formData.acName} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired>
            <FormLabel>Vehicle No</FormLabel>
            <InputGroup>
              <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleInputChange} />
              <InputRightElement>
                <IconButton
                  aria-label="Scan QR"
                  icon={<MdQrCodeScanner />}
                  onClick={() => handleScanClick('vehicleNo')}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <FormControl isRequired><FormLabel>Installation Date</FormLabel><Input type="date" name="installationDate" value={formData.installationDate} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>Site Address</FormLabel><Input name="installationSiteAddress" value={formData.installationSiteAddress} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>Driver Name</FormLabel><Input name="driverName" value={formData.driverName} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>Driver Mobile</FormLabel><Input name="driverMobileNo" value={formData.driverMobileNo} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>FST Name</FormLabel><Input name="fstName" value={formData.fstName} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>FST Mobile</FormLabel><Input name="fstMobileNo" value={formData.fstMobileNo} onChange={handleInputChange} /></FormControl>
          <FormControl isRequired><FormLabel>Vehicle Type</FormLabel><Input name="typeOfVehicle" value={formData.typeOfVehicle} onChange={handleInputChange} /></FormControl>
        </SimpleGrid>

        <Heading size="md" mt={6}>Equipment Details</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>PTZ Model No</FormLabel>
            <InputGroup>
              <Input name="ptzCameraModelNumber" value={formData.ptzCameraModelNumber} onChange={handleInputChange} />
              <InputRightElement>
                <IconButton
                  aria-label="Scan QR"
                  icon={<MdQrCodeScanner />}
                  onClick={() => handleScanClick('ptzCameraModelNumber')}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel>PTZ Serial No</FormLabel>
            <InputGroup>
              <Input name="ptzCameraSerialNumber" value={formData.ptzCameraSerialNumber} onChange={handleInputChange} />
              <InputRightElement>
                <IconButton
                  aria-label="Scan QR"
                  icon={<MdQrCodeScanner />}
                  onClick={() => handleScanClick('ptzCameraSerialNumber')}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <FormControl><FormLabel>PTZ Installed?</FormLabel><Select name="ptzCameraInstalledOnVehicle" value={formData.ptzCameraInstalledOnVehicle} onChange={handleInputChange}><option value="No">No</option><option value="Yes">Yes</option></Select></FormControl>
          
          <FormControl><FormLabel>NVR Model No</FormLabel><Input name="nvrModelNo" value={formData.nvrModelNo} onChange={handleInputChange} /></FormControl>
          <FormControl><FormLabel>NVR Installed?</FormLabel><Select name="nvrInstalled" value={formData.nvrInstalled} onChange={handleInputChange}><option value="No">No</option><option value="Yes">Yes</option></Select></FormControl>
          
          <FormControl><FormLabel>Battery Serial No</FormLabel><Input name="batterySerialNo" value={formData.batterySerialNo} onChange={handleInputChange} /></FormControl>
          <FormControl><FormLabel>Battery Installed?</FormLabel><Select name="batteryInstalledAtVehicle" value={formData.batteryInstalledAtVehicle} onChange={handleInputChange}><option value="No">No</option><option value="Yes">Yes</option></Select></FormControl>
          
          <FormControl><FormLabel>GPS Serial No</FormLabel><Input name="gpsDeviceSerialNo" value={formData.gpsDeviceSerialNo} onChange={handleInputChange} /></FormControl>
          <FormControl><FormLabel>GPS Installed?</FormLabel><Select name="gpsDeviceInstalled" value={formData.gpsDeviceInstalled} onChange={handleInputChange}><option value="No">No</option><option value="Yes">Yes</option></Select></FormControl>
          
          <FormControl><FormLabel>Router SIM No</FormLabel><Input name="internet4GRouterSimNo" value={formData.internet4GRouterSimNo} onChange={handleInputChange} /></FormControl>
          <FormControl><FormLabel>Router Installed?</FormLabel><Select name="internet4GRouterInstalledBackSite" value={formData.internet4GRouterInstalledBackSite} onChange={handleInputChange}><option value="No">No</option><option value="Yes">Yes</option></Select></FormControl>
          
          <FormControl><FormLabel>Web Streaming Test?</FormLabel><Select name="successfulTestWebStreaming" value={formData.successfulTestWebStreaming} onChange={handleInputChange}><option value="No">No</option><option value="Yes">Yes</option></Select></FormControl>
        </SimpleGrid>

        <Button colorScheme="blue" onClick={submitForm}>Submit</Button>
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Scan QR Code</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isOpen && <QRCodeScanner onScanSuccess={handleScanSuccess} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default FsvInstallationForm;
