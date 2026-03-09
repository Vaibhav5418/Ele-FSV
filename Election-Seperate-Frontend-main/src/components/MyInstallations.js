import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useDisclosure,
  Text,
  useToast,
  SimpleGrid,
  Stack,
  Flex,
  useBreakpointValue,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  HStack
} from '@chakra-ui/react';
import { getCameraByDid, getUserInstallations } from '../actions/userActions';
import InstallationListModal from './InstallationListModal';
import withAuth from './withAuth';
import { FaEye } from 'react-icons/fa';
import VideoModal from './modal/VideoModal';

const MyInstallations = () => {
  const normalizeSearchText = (value) => (value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const [liveStreamCandidates, setLiveStreamCandidates] = useState([]);
  const areSameCandidates = (a = [], b = []) =>
    a.length === b.length && a.every((item, index) => item === b[index]);

  const buildStreamCandidates = (cameraId, cameraResponse) => {
    const rawId = (cameraId || '').toString().trim();
    if (!rawId) return [];

    const normalizedId = rawId.replace(/^RTSP-/i, '');
    const candidates = [];

    const backendUrl2 = cameraResponse?.flvUrl?.url2;
    if (backendUrl2) candidates.push(backendUrl2);

    const backendUrl = cameraResponse?.flvUrl?.url;
    if (backendUrl) candidates.push(backendUrl);

    candidates.push(`wss://mediastream.vmukti.com/jessica/DVR/${normalizedId}.flv`);
    candidates.push(`wss://mediastream.vmukti.com/jessica/DVR/RTSP-${normalizedId}.flv`);

    return [...new Set(candidates.filter(Boolean))];
  };

  const buildJessicaStreamUrl = (cameraId) => {
    const rawId = (cameraId || '').toString().trim();
    if (!rawId) return '';

    const normalizedId = rawId.replace(/^RTSP-/i, '');
    return `wss://mediastream.vmukti.com/jessica/DVR/${normalizedId}.flv`;
  };

  const [installations, setInstallations] = useState([]);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [selectedLiveInstallation, setSelectedLiveInstallation] = useState(null);
  const [liveStreamUrl, setLiveStreamUrl] = useState('');
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('vehicle');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLiveOpen,
    onOpen: onLiveOpen,
    onClose: onLiveClose
  } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchInstallations();
  }, []);

  const fetchInstallations = async () => {
    setIsLoading(true);
    try {
      const result = await getUserInstallations();
      if (result.success) {
        setInstallations(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to fetch installations',
          status: 'error',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching installations:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while fetching installations',
        status: 'error',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (installation) => {
    setSelectedInstallation(installation);
    onOpen();
  };

  const handleViewLive = async (installation) => {
    const cameraId = installation?.ptzCameraSerialNumber;
    if (!cameraId) {
      toast({
        title: 'Camera ID Missing',
        description: 'PTZ Camera ID not found for this installation.',
        status: 'warning',
        duration: 2500
      });
      return;
    }

    setIsLoadingLive(true);
    const immediateCandidates = buildStreamCandidates(cameraId, null);
    const immediateStreamUrl = immediateCandidates[0] || buildJessicaStreamUrl(cameraId);

    if (!immediateStreamUrl) {
      toast({
        title: 'Live Stream Not Available',
        description: 'No stream URL found for this camera.',
        status: 'warning',
        duration: 2500
      });
      setIsLoadingLive(false);
      return;
    }

    // Open quickly using derived Jessica URL (same fast behavior as Auto Installer),
    // then enrich with backend URLs in background.
    setLiveStreamCandidates(immediateCandidates);
    setLiveStreamUrl(immediateStreamUrl);
    setSelectedLiveInstallation(installation);
    onLiveOpen();

    try {
      const cameraResponse = await getCameraByDid(cameraId);
      const enrichedCandidates = buildStreamCandidates(cameraId, cameraResponse);

      if (enrichedCandidates.length > 0) {
        if (!areSameCandidates(immediateCandidates, enrichedCandidates)) {
          setLiveStreamCandidates(enrichedCandidates);
        }
        if (enrichedCandidates[0] && enrichedCandidates[0] !== immediateStreamUrl) {
          setLiveStreamUrl(enrichedCandidates[0]);
        }
      }
    } catch (error) {
      // Keep modal open with fallback URL; backend enrichment is best-effort.
      console.error('Live stream enrichment failed:', error);
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleCloseLive = () => {
    setLiveStreamUrl('');
    setLiveStreamCandidates([]);
    setSelectedLiveInstallation(null);
    onLiveClose();
  };

  const isMobile = useBreakpointValue({ base: true, md: false });
  const filteredInstallations = installations.filter((installation) => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(searchQuery.trim());
    if (!query) return true;

    if (searchType === 'camera') {
      const cameraId = (installation?.ptzCameraSerialNumber || '').toLowerCase();
      const normalizedCameraId = normalizeSearchText(cameraId);
      return cameraId.includes(query) || normalizedCameraId.includes(normalizedQuery);
    }

    const vehicleNo = (installation?.vehicleNo || '').toLowerCase();
    const normalizedVehicleNo = normalizeSearchText(vehicleNo);
    return vehicleNo.includes(query) || normalizedVehicleNo.includes(normalizedQuery);
  });

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>My FSV Installations</Heading>
      <Box
        mb={5}
        p={{ base: 3, md: 4 }}
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        boxShadow="sm"
      >
        <Stack spacing={3}>
          <RadioGroup
            onChange={(value) => {
              setSearchType(value);
              setSearchQuery('');
            }}
            value={searchType}
          >
            <HStack spacing={6}>
              <Radio value="vehicle" colorScheme="blue">Vehicle No</Radio>
              <Radio value="camera" colorScheme="blue">Camera ID</Radio>
            </HStack>
          </RadioGroup>

          <Input
            placeholder={searchType === 'camera' ? 'Search by Camera ID' : 'Search by Vehicle No'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="gray.50"
            borderColor="gray.300"
            _hover={{ borderColor: 'blue.300' }}
            _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
          />
        </Stack>
      </Box>

      {isLoading ? (
        <Text>Loading...</Text>
      ) : filteredInstallations.length > 0 ? (
        isMobile ? (
          <SimpleGrid columns={1} spacing={4}>
            {filteredInstallations.map((installation) => (
              <Box
                key={installation._id}
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                bg="white"
                shadow="sm"
              >
                <Stack spacing={3}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold" fontSize="lg">{installation.vehicleNo}</Text>
                    <Badge colorScheme={installation.vehiclePhotoUrl ? 'green' : 'orange'}>
                      {installation.vehiclePhotoUrl ? 'Completed' : 'Pending'}
                    </Badge>
                  </Flex>

                  <SimpleGrid columns={2} spacing={2} fontSize="sm">
                    <Box>
                      <Text color="gray.500">District</Text>
                      <Text fontWeight="medium">{installation.districtName}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Driver</Text>
                      <Text fontWeight="medium">{installation.driverName}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Camera ID</Text>
                      <Text fontWeight="medium" fontSize="xs" color="blue.600">
                        {installation.ptzCameraSerialNumber || '—'}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Date & Time</Text>
                      <Text fontWeight="medium">
                        {new Date(installation.createdAt || installation.installationDate).toLocaleDateString()}
                        {' '}
                        {new Date(installation.createdAt || installation.installationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  <Flex gap={2} align="center">
                    <Button
                      flex={1}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleViewDetails(installation)}
                    >
                      View Details
                    </Button>
                    <IconButton
                      aria-label="View live stream"
                      icon={<FaEye />}
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      isLoading={isLoadingLive}
                      onClick={() => handleViewLive(installation)}
                    />
                  </Flex>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Vehicle No</Th>
                  <Th>District</Th>
                  <Th>Driver Name</Th>
                  <Th>Camera ID</Th>
                  <Th>Submitted Date & Time</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredInstallations.map((installation) => (
                  <Tr key={installation._id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="medium">{installation.vehicleNo}</Td>
                    <Td>{installation.districtName}</Td>
                    <Td>{installation.driverName}</Td>
                    <Td>
                      <Text fontSize="xs" color="blue.600" fontWeight="medium">
                        {installation.ptzCameraSerialNumber || '—'}
                      </Text>
                    </Td>
                    <Td>
                      {new Date(installation.createdAt || installation.installationDate).toLocaleDateString()}
                      {' '}
                      {new Date(installation.createdAt || installation.installationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Td>
                    <Td>
                      <Badge colorScheme={installation.vehiclePhotoUrl ? 'green' : 'orange'}>
                        {installation.vehiclePhotoUrl ? 'Completed' : 'Pending'}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleViewDetails(installation)}
                        >
                          View Details
                        </Button>
                        <IconButton
                          aria-label="View live stream"
                          icon={<FaEye />}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          isLoading={isLoadingLive}
                          onClick={() => handleViewLive(installation)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )
      ) : (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.500">
            No matching records found.
          </Text>
        </Box>
      )}

      {/* Installation Detail Modal */}
      <InstallationListModal
        isOpen={isOpen}
        onClose={onClose}
        installation={selectedInstallation}
      />

      <VideoModal
        isOpen={isLiveOpen}
        onClose={handleCloseLive}
        deviceId={selectedLiveInstallation?.vehicleNo ? `${selectedLiveInstallation.vehicleNo} (${selectedLiveInstallation?.ptzCameraSerialNumber || 'N/A'})` : (selectedLiveInstallation?.ptzCameraSerialNumber || 'Live View')}
        flvUrl={liveStreamUrl}
        streamCandidates={liveStreamCandidates}
        status={selectedLiveInstallation?.vehiclePhotoUrl ? 'RUNNING' : 'PENDING'}
        state={selectedLiveInstallation?.acName}
        district={selectedLiveInstallation?.districtName}
        location={selectedLiveInstallation?.installationSiteAddress}
      />
    </Container>
  );
};

export default withAuth(MyInstallations);
