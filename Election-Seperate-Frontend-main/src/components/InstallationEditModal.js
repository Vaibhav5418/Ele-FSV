import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Grid,
  GridItem,
  useToast,
  Box,
  Heading,
  Divider,
  VStack,
  SimpleGrid,
  RadioGroup,
  HStack,
  Radio,
  Text,
  Flex,
  Icon
} from '@chakra-ui/react';
import { MdDirectionsCar, MdVideocam } from 'react-icons/md';
import { updateFsvReport, getFsvSuggestions, checkVehicleExists, checkCameraExists } from '../actions/userActions';
import { useRef } from 'react';

import { DISTRICT_DATA } from '../utils/districtData';

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

const inputStyle = {
  size: "md",
  bg: "gray.50",
  borderColor: "gray.200",
  _hover: { borderColor: "blue.300" },
  _focus: { bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" },
  borderRadius: "md"
};

const labelStyle = {
  fontSize: "sm",
  fontWeight: "500",
  color: "gray.900",
  mb: 2
};

const InstallationEditModal = ({ isOpen, onClose, installation, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (installation) {
      const matchedDistrict = findMatchingDistrict(installation.districtName);
      const matchedAC = findMatchingAC(matchedDistrict, installation.acName);
      setFormData({
        ...installation,
        districtName: matchedDistrict,
        acName: matchedAC
      });
    }
  }, [installation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'driverMobileNo' || name === 'fstMobileNo') {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    let updatedValue = value;
    if (name === 'driverName' || name === 'fstName') {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
      updatedValue = value.toUpperCase();
    } else if (name === 'vehicleNo') {
      updatedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
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

  const onSuggestionsFetchRequested = async ({ value }) => {
    if (value.length >= 3) {
      setIsFetchingSuggestions(true);
      try {
        const response = await getFsvSuggestions(value);
        if (response && response.success) {
          setSuggestions(response.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (suggestionValue) => {
    setFormData(prev => ({ ...prev, ptzCameraSerialNumber: suggestionValue }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.driverMobileNo && formData.driverMobileNo.length !== 10) {
      toast({
        title: "Invalid Mobile",
        description: "Driver mobile must be exactly 10 digits.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      if (formData.vehicleNo && formData.vehicleNo !== installation.vehicleNo) {
        const vehicleCheck = await checkVehicleExists(formData.vehicleNo);
        if (vehicleCheck && vehicleCheck.exists) {
          toast({
            title: "Duplicate Vehicle Number",
            description: `it ${formData.vehicleNo} is already exist and please conatct backend team.`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }
      }

      if (formData.ptzCameraSerialNumber && formData.ptzCameraSerialNumber !== installation.ptzCameraSerialNumber) {
        const cameraCheck = await checkCameraExists(formData.ptzCameraSerialNumber);
        if (cameraCheck && cameraCheck.exists) {
          toast({
            title: "Duplicate Camera ID",
            description: `it ${formData.ptzCameraSerialNumber} is already exist and please conatct backend team.`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }
      }

      const response = await updateFsvReport(installation._id, formData);
      if (response && response.success) {
        toast({
          title: "Success",
          description: "Installation details updated successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onUpdateSuccess(response.data);
        onClose();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to update details.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error updating installation:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!installation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent borderRadius="xl" overflow="hidden" boxShadow="2xl" m={{ base: 2, md: 4 }}>
        <ModalHeader bg="blue.600" color="white" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" py={5}>
          Edit Installation Details
        </ModalHeader>
        <ModalCloseButton color="white" top={4} right={4} _hover={{ bg: 'blue.700' }} />
        <ModalBody p={{ base: 4, md: 8 }} bg="gray.50">
          <form id="edit-installation-form" onSubmit={handleSubmit}>
            <VStack spacing={8} align="stretch">
              
              {/* Section 1: Vehicle & Installation Details */}
              <Box bg="white" p={{ base: 4, md: 8 }} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                <Flex align="center" mb={6}>
                  <Flex bg="blue.50" p={2} borderRadius="md" mr={4}>
                    <Icon as={MdDirectionsCar} color="blue.500" boxSize={6} />
                  </Flex>
                  <Heading size="md" color="gray.800" fontWeight="700">Vehicle & Installation Details</Heading>
                </Flex>
                <Divider mb={8} borderColor="gray.100" />
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacingY={8} spacingX={6}>
                  {/* Row 1 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>District Name <Text as="span" color="red.500">*</Text></FormLabel>
                    <Select name="districtName" value={formData.districtName || ''} onChange={handleDistrictChange} placeholder="Select District" {...inputStyle} textOverflow="ellipsis" whiteSpace="nowrap" overflow="hidden" sx={{ "& > option": { whiteSpace: "normal", wordBreak: "break-word", fontSize: { base: "13px", md: "15px" } } }}>
                      {Object.keys(DISTRICT_DATA).map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>AC Name <Text as="span" color="red.500">*</Text></FormLabel>
                    <Select name="acName" value={formData.acName || ''} onChange={handleInputChange} placeholder="Select AC Name" isDisabled={!formData.districtName} {...inputStyle} textOverflow="ellipsis" whiteSpace="nowrap" overflow="hidden" sx={{ "& > option": { whiteSpace: "normal", wordBreak: "break-word", fontSize: { base: "13px", md: "15px" }, maxWidth: "100%" } }}>
                      {formData.districtName && DISTRICT_DATA[formData.districtName]?.map(ac => (
                        <option key={ac} value={ac}>{ac}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Site Address <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input name="installationSiteAddress" value={formData.installationSiteAddress || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>

                  {/* Row 2 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>Vehicle No <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input name="vehicleNo" value={formData.vehicleNo || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Vehicle Type <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input name="typeOfVehicle" value={formData.typeOfVehicle || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Is QRT vehicle? <Text as="span" color="red.500">*</Text></FormLabel>
                    <RadioGroup name="isQrtVehicle" value={formData.isQrtVehicle || formData.isQRTVehicle || ''} onChange={(val) => handleRadioChange('isQrtVehicle', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>

                  {/* Row 3 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>Driver Name <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input name="driverName" value={formData.driverName || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                  <FormControl isInvalid={formData.driverMobileNo && formData.driverMobileNo.length > 0 && formData.driverMobileNo.length !== 10}>
                    <FormLabel {...labelStyle}>Driver Mobile <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input name="driverMobileNo" type="tel" value={formData.driverMobileNo || ''} onChange={handleInputChange} {...inputStyle} />
                    <Text color="red.500" fontSize="xs" mt={1.5} fontWeight="semibold" display={formData.driverMobileNo && formData.driverMobileNo.length > 0 && formData.driverMobileNo.length !== 10 ? "block" : "none"}>
                      Driver mobile must be exactly 10 digits.
                    </Text>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Installation Date <Text as="span" color="red.500">*</Text></FormLabel>
                    <Input name="installationDate" type="date" value={formData.installationDate ? formData.installationDate.split('T')[0] : ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Section 2: Equipment Details */}
              <Box bg="white" p={{ base: 4, md: 8 }} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                <Flex align="center" mb={6}>
                  <Flex bg="blue.50" p={2} borderRadius="md" mr={4}>
                    <Icon as={MdVideocam} color="blue.500" boxSize={6} />
                  </Flex>
                  <Heading size="md" color="gray.800" fontWeight="700">Equipment Details</Heading>
                </Flex>
                <Divider mb={8} borderColor="gray.100" />
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacingY={8} spacingX={6}>
                  {/* Row 1 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>PTZ Installed?</FormLabel>
                    <RadioGroup name="ptzCameraInstalledOnVehicle" value={formData.ptzCameraInstalledOnVehicle || ''} onChange={(val) => handleRadioChange('ptzCameraInstalledOnVehicle', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>PTZ Model No</FormLabel>
                    <Input name="ptzCameraModelNumber" value={formData.ptzCameraModelNumber || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>PTZ Camera ID</FormLabel>
                    <Box position="relative" ref={suggestionsRef}>
                      <Input
                        name="ptzCameraSerialNumber"
                        value={formData.ptzCameraSerialNumber || ''}
                        placeholder="Search Camera ID..."
                        {...inputStyle}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, ptzCameraSerialNumber: val }));
                          if (val.length >= 3) {
                            setIsFetchingSuggestions(true);
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
                            } finally {
                              setIsFetchingSuggestions(false);
                            }
                          } else {
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        autoComplete="off"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <Box
                          position="absolute"
                          zIndex={10}
                          mt={1}
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          boxShadow="md"
                          w="100%"
                          maxH="200px"
                          overflowY="auto"
                        >
                          {suggestions.map((suggestion) => (
                            <Box
                              key={suggestion}
                              px={3}
                              py={2}
                              cursor="pointer"
                              fontSize="sm"
                              _hover={{ bg: 'blue.50' }}
                              onMouseDown={() => onSuggestionSelected(suggestion)}
                            >
                              {suggestion}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </FormControl>

                  {/* Row 2 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>Camera View Visible?</FormLabel>
                    <RadioGroup name="successfulTestWebStreaming" value={formData.successfulTestWebStreaming || ''} onChange={(val) => handleRadioChange('successfulTestWebStreaming', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>NVR Installed?</FormLabel>
                    <RadioGroup name="nvrInstalled" value={formData.nvrInstalled || ''} onChange={(val) => handleRadioChange('nvrInstalled', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>NVR Model No</FormLabel>
                    <Input name="nvrModelNo" value={formData.nvrModelNo || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>

                  {/* Row 3 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>Battery Installed?</FormLabel>
                    <RadioGroup name="batteryInstalledAtVehicle" value={formData.batteryInstalledAtVehicle || ''} onChange={(val) => handleRadioChange('batteryInstalledAtVehicle', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Battery Serial No</FormLabel>
                    <Input name="batterySerialNo" value={formData.batterySerialNo || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>GPS Installed?</FormLabel>
                    <RadioGroup name="gpsDeviceInstalled" value={formData.gpsDeviceInstalled || ''} onChange={(val) => handleRadioChange('gpsDeviceInstalled', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>

                  {/* Row 4 */}
                  <FormControl>
                    <FormLabel {...labelStyle}>GPS Serial No</FormLabel>
                    <Input name="gpsDeviceSerialNo" value={formData.gpsDeviceSerialNo || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Router Installed?</FormLabel>
                    <RadioGroup name="internet4GRouterInstalledBackSite" value={formData.internet4GRouterInstalledBackSite || ''} onChange={(val) => handleRadioChange('internet4GRouterInstalledBackSite', val)}>
                      <HStack spacing={6}>
                        <Radio value="Yes" colorScheme="green" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">Yes</Text>
                        </Radio>
                        <Radio value="No" colorScheme="red" borderColor="gray.300">
                          <Text fontSize="md" fontWeight="400" color="gray.900">No</Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyle}>Router No</FormLabel>
                    <Input name="internet4GRouterSimNo" value={formData.internet4GRouterSimNo || ''} onChange={handleInputChange} {...inputStyle} />
                  </FormControl>
                </SimpleGrid>
              </Box>

            </VStack>
          </form>
        </ModalBody>

        <ModalFooter bg="white" borderTop="1px solid" borderColor="gray.200" py={4} px={6} flexWrap="wrap" justifyContent="flex-end">
          <Button colorScheme="blue" mr={{ base: 0, md: 3 }} mb={{ base: 2, md: 0 }} type="submit" form="edit-installation-form" isLoading={isLoading} px={8} boxShadow="sm" _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }} transition="all 0.2s" w={{ base: "full", md: "auto" }}>
            Save Changes
          </Button>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading} _hover={{ bg: 'gray.100' }} w={{ base: "full", md: "auto" }}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InstallationEditModal;
