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

  React.useEffect(() => {
    if (initialData) {
      const cleanData = {};
      Object.keys(initialData).forEach(key => {
        cleanData[key.trim()] = initialData[key];
      });

      setFormData(prev => ({
        ...prev,
        districtName: cleanData.districtName || prev.districtName,
        acName: cleanData.acName || prev.acName,
        vehicleNo: cleanData.vehicleNo || prev.vehicleNo,
        driverName: cleanData.driverName || prev.driverName,
        driverMobileNo: cleanData.driverMobileNo ? String(cleanData.driverMobileNo) : prev.driverMobileNo,
        ptzCameraModelNumber: cleanData.ptzCameraModelNumber || prev.ptzCameraModelNumber,
        ptzCameraSerialNumber: cleanData.ptzCameraSerialNumber || prev.ptzCameraSerialNumber,
        state: cleanData.state || prev.state
      }));
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'driverMobileNo') {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    if (name === 'driverName') {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitForm = async () => {
    const requiredFields = [
      { key: 'districtName', label: 'District Name' },
      { key: 'acName', label: 'AC Name' },
      { key: 'vehicleNo', label: 'Vehicle No' },
      { key: 'installationSiteAddress', label: 'Site Address' },
      { key: 'driverName', label: 'Driver Name' },
      { key: 'driverMobileNo', label: 'Driver Mobile' },
      { key: 'typeOfVehicle', label: 'Vehicle Type' },
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

    try {
      const response = await createFsvReport(formData);
      if (response.success) {
        toast({ title: "Form Submitted", status: "success" });
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
    <Box minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" py={{ base: 6, md: 12 }}>
      <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
        {/* Header Section */}
        <Box
          bg="white"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          mb={6}
          boxShadow="2xl"
          textAlign="center"
        >
          <Heading
            size={{ base: "lg", md: "2xl" }}
            bgGradient="linear(to-r, teal.500, purple.600)"
            bgClip="text"
            fontWeight="extrabold"
            mb={2}
          >
            FSV Installation Form
          </Heading>
          <Box fontSize={{ base: "sm", md: "md" }} color="gray.600" fontWeight="medium">
            Field Surveillance Vehicle Registration
          </Box>
        </Box>

        {/* Vehicle & Driver Details Section */}
        <Box
          bg="white"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          mb={6}
          boxShadow="xl"
          _hover={{ boxShadow: "2xl" }}
          transition="all 0.3s"
        >
          <Heading
            size={{ base: "md", md: "lg" }}
            mb={6}
            color="teal.600"
            borderBottom="3px solid"
            borderColor="teal.500"
            pb={3}
            display="inline-block"
          >
            🚗 Vehicle & Driver Details
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mt={6}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">District Name</FormLabel>
              <Input
                name="districtName"
                value={formData.districtName}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">AC Name</FormLabel>
              <Input
                name="acName"
                value={formData.acName}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Vehicle No</FormLabel>
              <InputGroup size="md">
                <Input
                  name="vehicleNo"
                  value={formData.vehicleNo}
                  onChange={handleInputChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "teal.400" }}
                  _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Scan QR"
                    icon={<MdQrCodeScanner />}
                    onClick={() => handleScanClick('vehicleNo')}
                    size="sm"
                    colorScheme="teal"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Installation Date</FormLabel>
              <Input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Site Address</FormLabel>
              <Input
                name="installationSiteAddress"
                value={formData.installationSiteAddress}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Driver Name</FormLabel>
              <Input
                name="driverName"
                value={formData.driverName}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Driver Mobile</FormLabel>
              <Input
                name="driverMobileNo"
                value={formData.driverMobileNo}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Vehicle Type</FormLabel>
              <Input
                name="typeOfVehicle"
                value={formData.typeOfVehicle}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "teal.400" }}
                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                borderRadius="lg"
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Equipment Details Section */}
        <Box
          bg="white"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          mb={6}
          boxShadow="xl"
          _hover={{ boxShadow: "2xl" }}
          transition="all 0.3s"
        >
          <Heading
            size={{ base: "md", md: "lg" }}
            mb={6}
            color="purple.600"
            borderBottom="3px solid"
            borderColor="purple.500"
            pb={3}
            display="inline-block"
          >
            🔧 Equipment Details
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mt={6}>
            {/* PTZ Camera - Ask if installed first */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">PTZ Installed?</FormLabel>
              <RadioGroup
                name="ptzCameraInstalledOnVehicle"
                value={formData.ptzCameraInstalledOnVehicle}
                onChange={(val) => handleRadioChange('ptzCameraInstalledOnVehicle', val)}
              >
                <HStack spacing={6}>
                  <Radio value="Yes" size="md" colorScheme="green" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">Yes</Box>
                  </Radio>
                  <Radio value="No" size="md" colorScheme="red" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">No</Box>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">PTZ Model No</FormLabel>
              <InputGroup size="md">
                <Input
                  name="ptzCameraModelNumber"
                  value={formData.ptzCameraModelNumber}
                  onChange={handleInputChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "purple.400" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Scan QR"
                    icon={<MdQrCodeScanner />}
                    onClick={() => handleScanClick('ptzCameraModelNumber')}
                    size="sm"
                    colorScheme="purple"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">PTZ Camera ID</FormLabel>
              <InputGroup size="md">
                <Input
                  name="ptzCameraSerialNumber"
                  value={formData.ptzCameraSerialNumber}
                  onChange={handleInputChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "purple.400" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Scan QR"
                    icon={<MdQrCodeScanner />}
                    onClick={() => handleScanClick('ptzCameraSerialNumber')}
                    size="sm"
                    colorScheme="purple"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* NVR - Ask if installed first */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">NVR Installed?</FormLabel>
              <RadioGroup
                name="nvrInstalled"
                value={formData.nvrInstalled}
                onChange={(val) => handleRadioChange('nvrInstalled', val)}
              >
                <HStack spacing={6}>
                  <Radio value="Yes" size="md" colorScheme="green" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">Yes</Box>
                  </Radio>
                  <Radio value="No" size="md" colorScheme="red" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">No</Box>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">NVR Model No</FormLabel>
              <Input
                name="nvrModelNo"
                value={formData.nvrModelNo}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "purple.400" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                borderRadius="lg"
              />
            </FormControl>

            {/* Battery - Ask if installed first */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Battery Installed?</FormLabel>
              <RadioGroup
                name="batteryInstalledAtVehicle"
                value={formData.batteryInstalledAtVehicle}
                onChange={(val) => handleRadioChange('batteryInstalledAtVehicle', val)}
              >
                <HStack spacing={6}>
                  <Radio value="Yes" size="md" colorScheme="green" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">Yes</Box>
                  </Radio>
                  <Radio value="No" size="md" colorScheme="red" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">No</Box>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Battery Serial No</FormLabel>
              <InputGroup size="md">
                <Input
                  name="batterySerialNo"
                  value={formData.batterySerialNo}
                  onChange={handleInputChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "purple.400" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Scan QR"
                    icon={<MdQrCodeScanner />}
                    onClick={() => handleScanClick('batterySerialNo')}
                    size="sm"
                    colorScheme="purple"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* GPS - Ask if installed first */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">GPS Installed?</FormLabel>
              <RadioGroup
                name="gpsDeviceInstalled"
                value={formData.gpsDeviceInstalled}
                onChange={(val) => handleRadioChange('gpsDeviceInstalled', val)}
              >
                <HStack spacing={6}>
                  <Radio value="Yes" size="md" colorScheme="green" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">Yes</Box>
                  </Radio>
                  <Radio value="No" size="md" colorScheme="red" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">No</Box>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">GPS Serial No</FormLabel>
              <InputGroup size="md">
                <Input
                  name="gpsDeviceSerialNo"
                  value={formData.gpsDeviceSerialNo}
                  onChange={handleInputChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "purple.400" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Scan QR"
                    icon={<MdQrCodeScanner />}
                    onClick={() => handleScanClick('gpsDeviceSerialNo')}
                    size="sm"
                    colorScheme="purple"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Router - Ask if installed first */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Router Installed?</FormLabel>
              <RadioGroup
                name="internet4GRouterInstalledBackSite"
                value={formData.internet4GRouterInstalledBackSite}
                onChange={(val) => handleRadioChange('internet4GRouterInstalledBackSite', val)}
              >
                <HStack spacing={6}>
                  <Radio value="Yes" size="md" colorScheme="green" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">Yes</Box>
                  </Radio>
                  <Radio value="No" size="md" colorScheme="red" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">No</Box>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Router No</FormLabel>
              <Input
                name="internet4GRouterSimNo"
                value={formData.internet4GRouterSimNo}
                onChange={handleInputChange}
                size="md"
                borderColor="gray.300"
                _hover={{ borderColor: "purple.400" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">Camera View Visible?</FormLabel>
              <RadioGroup
                name="successfulTestWebStreaming"
                value={formData.successfulTestWebStreaming}
                onChange={(val) => handleRadioChange('successfulTestWebStreaming', val)}
              >
                <HStack spacing={6}>
                  <Radio value="Yes" size="md" colorScheme="green" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">Yes</Box>
                  </Radio>
                  <Radio value="No" size="md" colorScheme="red" borderColor="gray.400">
                    <Box fontWeight="medium" color="gray.700">No</Box>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Submit Button */}
        <Button
          onClick={submitForm}
          size="lg"
          w="full"
          h="60px"
          bgGradient="linear(to-r, teal.400, purple.500)"
          color="white"
          _hover={{
            bgGradient: "linear(to-r, teal.500, purple.600)",
            transform: "translateY(-2px)",
            boxShadow: "2xl"
          }}
          _active={{
            transform: "translateY(0)",
            boxShadow: "lg"
          }}
          borderRadius="xl"
          fontSize="lg"
          fontWeight="bold"
          boxShadow="xl"
          transition="all 0.3s"
        >
          Submit Form ✓
        </Button>
      </Container>

      {/* QR Scanner Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader
            bgGradient="linear(to-r, teal.500, purple.600)"
            color="white"
            fontSize="xl"
            fontWeight="bold"
          >
            Scan QR Code
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            {isOpen && <QRCodeScanner onScanSuccess={handleScanSuccess} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FsvInstallationForm;
