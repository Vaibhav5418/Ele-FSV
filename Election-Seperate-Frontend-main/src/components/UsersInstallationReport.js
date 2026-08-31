import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Box, Button, Container, Heading, Table, Thead, Tbody, Tr, Th, Td, Select, HStack, Input, Text, useToast, VStack, Flex, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, TableContainer, Badge, SimpleGrid, Spinner, Center, IconButton } from '@chakra-ui/react';
import { getFsvInstallationSummary, getFsvInstallationDetails, getExportDownloadUrl } from '../actions/userActions';
import withAuth from './withAuth';
import 'react-datepicker/dist/react-datepicker.css';
import { DISTRICT_DATA } from '../utils/districtData';


const UsersInstallationReport = () => {
    const [reportData, setReportData] = useState([]); // This will hold the summary array + details
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [installerSearch, setInstallerSearch] = useState('');
    const [searchType, setSearchType] = useState('vehicle');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusSearch, setStatusSearch] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');
    const [assemblySearch, setAssemblySearch] = useState('');
    const [qrtSearch, setQrtSearch] = useState('');
    const [gpsSearch, setGpsSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const ITEMS_PER_PAGE = 50;
    
    const toast = useToast();

    // Check master role (assuming role is saved in localStorage during login)
    const userRole = localStorage.getItem('role');
    const isMaster = userRole === 'master'; // Adjust according to exact role keywords

    useEffect(() => {
        if (isMaster) {
            fetchSummaryData();
            
            const intervalId = setInterval(() => {
                fetchSummaryData(false); // silent refresh
            }, 60000); 
            
            return () => clearInterval(intervalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMaster]);

    // Auto-apply filters with debounce
    useEffect(() => {
        if (!isMaster) return;
        const timer = setTimeout(() => {
            fetchSummaryData();
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, installerSearch, searchType, searchQuery, statusSearch, districtSearch, assemblySearch, qrtSearch, gpsSearch]);

    const getActiveFilters = () => ({
        startDate,
        endDate,
        installerSearch,
        searchType,
        searchQuery,
        statusSearch,
        districtSearch,
        assemblySearch,
        qrtSearch,
        gpsSearch
    });

    const fetchSummaryData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getFsvInstallationSummary(getActiveFilters());
            if (data && data.success) {
                // Initialize details as null for lazy loading
                const summaryWithDetails = data.data.map(d => ({
                    ...d,
                    detailsLoading: false,
                    details: null,
                    completedDetails: [],
                    pendingDetails: []
                }));
                setReportData(summaryWithDetails);
            } else {
                toast({
                    title: 'Error fetching summary',
                    description: data.message || 'Unknown error occurred',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch the summary.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
        setLoading(false);
    };

    const fetchDistrictDetails = async (district, page = 1) => {
        setReportData(prev => prev.map(d => d.district === district ? { ...d, detailsLoading: true } : d));
        try {
            const data = await getFsvInstallationDetails({ ...getActiveFilters(), district, page, limit: ITEMS_PER_PAGE });
            if (data && data.success) {
                const details = data.data;
                const completed = details.filter(d => d.status === 'Completed');
                const pending = details.filter(d => d.status === 'Pending');
                
                setReportData(prev => prev.map(d => d.district === district ? { 
                    ...d, 
                    detailsLoading: false,
                    details: details,
                    completedDetails: completed,
                    pendingDetails: pending,
                    currentPage: data.page || page,
                    totalPages: data.totalPages || 1,
                    totalCount: data.totalCount || details.length
                } : d));
            } else {
                toast({ title: 'Error fetching details', status: 'error', duration: 3000 });
                setReportData(prev => prev.map(d => d.district === district ? { ...d, detailsLoading: false } : d));
            }
        } catch (error) {
            console.error(error);
            setReportData(prev => prev.map(d => d.district === district ? { ...d, detailsLoading: false } : d));
        }
    };

    const handleAccordionChange = (indices) => {
        // Find newly expanded panels
        const indicesArray = Array.isArray(indices) ? indices : [indices];
        indicesArray.forEach(idx => {
            const districtGroup = reportData[idx];
            if (districtGroup && !districtGroup.details && !districtGroup.detailsLoading) {
                fetchDistrictDetails(districtGroup.district);
            }
        });
    };

    const handleFilter = () => {
        fetchSummaryData();
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setInstallerSearch('');
        setSearchQuery('');
        setStatusSearch('');
        setDistrictSearch('');
        setAssemblySearch('');
        setGpsSearch('');
        setQrtSearch('');
        // We need to wait for state to update before fetching, so we can pass empty object
        getFsvInstallationSummary({}).then(data => {
             if (data && data.success) {
                 const summaryWithDetails = data.data.map(d => ({
                     ...d,
                     detailsLoading: false,
                     details: null,
                     completedDetails: [],
                     pendingDetails: []
                 }));
                 setReportData(summaryWithDetails);
             }
        });
    };

    // Use DISTRICT_DATA to populate dropdowns
    const availableDistricts = Object.keys(DISTRICT_DATA);

    const availableAssemblies = useMemo(() => {
        if (districtSearch && DISTRICT_DATA[districtSearch]) {
            return DISTRICT_DATA[districtSearch];
        }
        return [];
    }, [districtSearch]);

    const getFileName = (extension) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

        let prefix = "installation_report";

        if (districtSearch) {
            prefix = districtSearch.trim().toUpperCase();
        }

        return `${prefix}_Installation_Report_${timestamp}.${extension}`;
    };

    // ─── Server-side streaming export (handles 300K+ records) ──────────
    // Instead of loading all records as JSON, we open a direct download URL.
    // The backend streams the file using MongoDB cursors + exceljs/pdfkit.

    const exportToExcel = () => {
        if (reportData.length === 0) {
            toast({ title: "No data to export", status: "warning", duration: 3000 });
            return;
        }
        setExportLoading(true);
        try {
            const url = getExportDownloadUrl('excel', getActiveFilters());
            window.open(url, '_blank');
            toast({
                title: "Export Started",
                description: "Your Excel file is being generated and will download automatically.",
                status: "info",
                duration: 5000,
                isClosable: true
            });
        } catch (error) {
            console.error('Excel export error:', error);
            toast({ title: 'Export Failed', description: error.message, status: 'error', duration: 5000 });
        } finally {
            // Small delay so user sees the loading state
            setTimeout(() => setExportLoading(false), 1500);
        }
    };

    const exportToPDF = () => {
        if (reportData.length === 0) {
            toast({ title: "No data to export", status: "warning", duration: 3000 });
            return;
        }
        setExportLoading(true);
        try {
            const url = getExportDownloadUrl('pdf', getActiveFilters());
            window.open(url, '_blank');
            toast({
                title: "Export Started",
                description: "Your PDF file is being generated and will download automatically.",
                status: "info",
                duration: 5000,
                isClosable: true
            });
        } catch (error) {
            console.error('PDF export error:', error);
            toast({ title: 'Export Failed', description: error.message, status: 'error', duration: 5000 });
        } finally {
            setTimeout(() => setExportLoading(false), 1500);
        }
    };

    if (!isMaster) {
        return (
            <Container maxW="container.xl" mt={10}>
                <Heading size="md" color="red.500">Access Denied: You do not have permission to view this report.</Heading>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" px={{ base: 4, md: 8 }} mt={{ base: 4, md: 8 }} mb={20}>
            <Heading size="lg" mb={6} textAlign={{ base: 'center', md: 'left' }}>FSV Installation Report</Heading>


            {/* Filter & Action Section */}
            <Box mb={6} p={{ base: 3, md: 6 }} bg="white" boxShadow="md" borderRadius="xl">
                <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                    <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 3, md: 4 }}>
                        <Box flex="1.5" minW={{ base: '100%', md: '280px' }} display="flex" flexDirection="column">
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>Search Records</Text>
                            <HStack mb={1.5} spacing={2}>
                                <Button 
                                    size="xs" 
                                    colorScheme={searchType === 'vehicle' ? 'blue' : 'gray'} 
                                    onClick={() => setSearchType('vehicle')}
                                    variant={searchType === 'vehicle' ? 'solid' : 'outline'}
                                >
                                    By Vehicle
                                </Button>
                                <Button 
                                    size="xs" 
                                    colorScheme={searchType === 'camera' ? 'blue' : 'gray'} 
                                    onClick={() => setSearchType('camera')}
                                    variant={searchType === 'camera' ? 'solid' : 'outline'}
                                >
                                    By Camera
                                </Button>
                            </HStack>
                            <Input
                                mt="auto"
                                size={{ base: 'sm', md: 'md' }}
                                placeholder={searchType === 'camera' ? 'Search by Camera ID...' : 'Search by Vehicle No...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                width="full"
                            />
                        </Box>
                        
                        <Box flex="1" minW={{ base: '100%', md: '200px' }} display="flex" flexDirection="column">
                            <Box mt="auto">
                                <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>Status</Text>
                                <Select
                                    placeholder="All Status"
                                    value={statusSearch}
                                    onChange={(e) => setStatusSearch(e.target.value)}
                                    width="full"
                                    size={{ base: 'sm', md: 'md' }}
                                >
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                </Select>
                            </Box>
                        </Box>
                    </Flex>
                    
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={{ base: 2, md: 4 }}>
                        <Box>
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>District</Text>
                            <Select
                                placeholder="All Districts"
                                value={districtSearch}
                                onChange={(e) => {
                                    setDistrictSearch(e.target.value);
                                    setAssemblySearch('');
                                }}
                                width="full"
                                size={{ base: 'sm', md: 'md' }}
                            >
                                {availableDistricts.map((d, i) => (
                                    <option key={i} value={d}>{d}</option>
                                ))}
                            </Select>
                        </Box>
                        
                        <Box>
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>Assembly</Text>
                            <Select 
                                placeholder="All Assembly" 
                                value={assemblySearch} 
                                onChange={(e) => setAssemblySearch(e.target.value)}
                                bg="white"
                                width="full"
                                size={{ base: 'sm', md: 'md' }}
                                isDisabled={!districtSearch}
                            >
                                {availableAssemblies.map((a, i) => (
                                    <option key={i} value={a}>{a}</option>
                                ))}
                            </Select>
                        </Box>

                        <Box>
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>Is QRT?</Text>
                            <Select 
                                placeholder="Is QRT?" 
                                value={qrtSearch} 
                                onChange={(e) => setQrtSearch(e.target.value)}
                                bg="white"
                                width="full"
                                size={{ base: 'sm', md: 'md' }}
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </Select>
                        </Box>

                        <Box>
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>Is GPS?</Text>
                            <Select 
                                placeholder="Is GPS?" 
                                value={gpsSearch} 
                                onChange={(e) => setGpsSearch(e.target.value)}
                                bg="white"
                                width="full"
                                size={{ base: 'sm', md: 'md' }}
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </Select>
                        </Box>

                        <Box>
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>Start Date</Text>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                width="full"
                                size={{ base: 'sm', md: 'md' }}
                            />
                        </Box>
                        <Box>
                            <Text mb={1} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>End Date</Text>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                width="full"
                                size={{ base: 'sm', md: 'md' }}
                            />
                        </Box>
                    </SimpleGrid>
                    
                    <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 3, md: 4 }} justifyContent="space-between" alignItems={{ base: 'stretch', sm: 'center' }}>
                        <Flex gap={{ base: 2, md: 4 }} direction={{ base: 'row', sm: 'row' }}>
                            <Button colorScheme="blue" onClick={handleFilter} isLoading={loading} px={{ base: 4, md: 10 }} size={{ base: 'sm', md: 'md' }} flex={{ base: 1, sm: 'initial' }}>Refresh Data</Button>
                            <Button variant="outline" onClick={handleClearFilter} isDisabled={loading || exportLoading} size={{ base: 'sm', md: 'md' }} flex={{ base: 1, sm: 'initial' }}>Clear All</Button>
                        </Flex>
                        <Flex gap={2} direction={{ base: 'row', sm: 'row' }} width={{ base: 'full', sm: 'auto' }}>
                            <Button colorScheme="green" onClick={exportToExcel} isLoading={exportLoading} isDisabled={reportData.length === 0} flex={{ base: 1, sm: 'initial' }} size={{ base: 'sm', md: 'md' }}>Export Excel</Button>
                            <Button colorScheme="red" onClick={exportToPDF} isLoading={exportLoading} isDisabled={reportData.length === 0} flex={{ base: 1, sm: 'initial' }} size={{ base: 'sm', md: 'md' }}>Export PDF</Button>
                        </Flex>
                    </Flex>
                </VStack>
            </Box>

            {/* Data Display Accordion Section */}
            {loading ? (
                <Center py={10}>
                    <VStack>
                        <Spinner size="xl" color="blue.500" thickness="4px" />
                        <Text mt={4} fontSize="lg" fontWeight="medium">Loading report summary...</Text>
                    </VStack>
                </Center>
            ) : reportData.length === 0 ? (
                <Box py={10} textAlign="center">
                    <Text fontSize="lg" color="gray.500">No matching records found for the selected criteria.</Text>
                </Box>
            ) : (
                <VStack spacing={4} align="stretch">
                    <Accordion allowMultiple onChange={handleAccordionChange}>
                        {reportData.map((districtGroup, index) => {
                            const details = [...(districtGroup.completedDetails || []), ...(districtGroup.pendingDetails || [])];

                            return (
                                <AccordionItem key={index} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm" mb={4} overflow="hidden">
                                    <h2>
                                        <AccordionButton p={4} _hover={{ bg: 'blue.50' }}>
                                            <Flex 
                                                flex="1" 
                                                textAlign="left" 
                                                justifyContent="space-between" 
                                                alignItems={{ base: 'stretch', sm: 'center' }} 
                                                direction={{ base: 'column', sm: 'row' }}
                                                gap={2}
                                                pr={4}
                                            >
                                                <Box>
                                                    <Heading size="sm" color="blue.600" mb={1}>
                                                        District: {districtGroup.district}
                                                    </Heading>
                                                    <Text fontSize="xs" color="gray.600">
                                                        Total Installations: {districtGroup.installationsCompleted + districtGroup.installationsPending}
                                                    </Text>
                                                </Box>
                                                <HStack spacing={2} fontSize="2xs" width={{ base: 'full', sm: 'auto' }} justifyContent={{ base: 'space-between', sm: 'flex-end' }}>
                                                    <Box px={2} py={1} borderRadius="md" bg="green.50" color="green.700" fontWeight="bold">
                                                        Completed: {districtGroup.installationsCompleted}
                                                    </Box>
                                                    <Box px={2} py={1} borderRadius="md" bg="orange.50" color="orange.700" fontWeight="bold">
                                                        Pending: {districtGroup.installationsPending}
                                                    </Box>
                                                </HStack>
                                            </Flex>
                                            <AccordionIcon />
                                        </AccordionButton>
                                    </h2>
                                    <AccordionPanel pb={4} pt={2} px={0}>
                                        {districtGroup.detailsLoading ? (
                                            <Center py={6}>
                                                <Spinner color="blue.500" />
                                                <Text ml={3} fontSize="sm">Loading details for {districtGroup.district}...</Text>
                                            </Center>
                                        ) : details.length === 0 ? (
                                            <Center py={6}>
                                                <Text fontSize="sm" color="gray.500">No details found.</Text>
                                            </Center>
                                        ) : (
                                            <>
                                                {/* Table view for Desktop */}
                                                <TableContainer px={0} display={{ base: 'none', lg: 'block' }}>
                                                    <Table variant="simple" size="sm">
                                                        <Thead bg="gray.50">
                                                            <Tr>
                                                                <Th>Vehicle No</Th>
                                                                <Th>District</Th>
                                                                <Th>AC Name</Th>
                                                                <Th>Installer Name</Th>
                                                                <Th>Installer Mobile</Th>
                                                                <Th>Driver Name</Th>
                                                                <Th>Driver Mobile</Th>
                                                                <Th>PTZ Camera ID</Th>
                                                                <Th>GPS No.</Th>
                                                                <Th>Router No.</Th>
                                                                <Th>Is QRT vehicle?</Th>
                                                                <Th>Installation Date</Th>
                                                                <Th>Submission Time</Th>
                                                                <Th>Site Address</Th>
                                                                <Th>Status</Th>
                                                            </Tr>
                                                        </Thead>
                                                        <Tbody>
                                                            {details.map((detail, idx) => (
                                                                <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                                                                    <Td fontWeight="bold">{detail.vehicleNo}</Td>
                                                                    <Td>{detail.district}</Td>
                                                                    <Td>{detail.acName}</Td>
                                                                    <Td>{detail.installerName}</Td>
                                                                    <Td>{detail.installerMobile}</Td>
                                                                    <Td>{detail.driverName}</Td>
                                                                    <Td>{detail.driverMobile}</Td>
                                                                    <Td color="blue.600" fontSize="xs">{detail.ptzCameraId}</Td>
                                                                    <Td fontSize="xs">{detail.gpsNo}</Td>
                                                                    <Td fontSize="xs">{detail.routerNo}</Td>
                                                                    <Td>{detail.isQrtVehicle || 'No'}</Td>
                                                                    <Td>{detail.installationDate}</Td>
                                                                    <Td>{detail.submissionTime}</Td>
                                                                    <Td whiteSpace="normal" minW="200px" fontSize="xs">{detail.siteAddress}</Td>
                                                                    <Td>
                                                                        <Box 
                                                                            fontSize="2xs" 
                                                                            fontWeight="bold" 
                                                                            px={2} py={0.5} 
                                                                            borderRadius="full" 
                                                                            display="inline-block"
                                                                            bg={detail.status === 'Completed' ? 'green.100' : 'orange.100'}
                                                                            color={detail.status === 'Completed' ? 'green.800' : 'orange.800'}
                                                                        >
                                                                            {detail.status.toUpperCase()}
                                                                        </Box>
                                                                    </Td>
                                                                </Tr>
                                                            ))}
                                                        </Tbody>
                                                    </Table>
                                                </TableContainer>

                                                {/* Card view for Mobile & Tablet */}
                                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} display={{ base: 'grid', lg: 'none' }} px={4} pb={4}>
                                                    {details.map((detail, idx) => (
                                                        <Box 
                                                            key={idx} 
                                                            borderWidth="1px" 
                                                            borderRadius="lg" 
                                                            p={4} 
                                                            bg="white" 
                                                            shadow="sm" 
                                                            position="relative"
                                                            borderColor="gray.200"
                                                            _hover={{ shadow: 'md' }}
                                                        >
                                                            <Flex justifyContent="space-between" alignItems="flex-start" mb={3}>
                                                                <VStack align="start" spacing={1}>
                                                                    <Text fontWeight="bold" fontSize="sm" color="blue.600">
                                                                        {detail.vehicleNo}
                                                                    </Text>
                                                                    <HStack spacing={1} flexWrap="wrap">
                                                                        <Badge colorScheme="blue" fontSize="3xs" px={1.5} py={0.5} borderRadius="md">{detail.acName}</Badge>
                                                                        <Badge colorScheme="purple" fontSize="3xs" px={1.5} py={0.5} borderRadius="md">{detail.district}</Badge>
                                                                    </HStack>
                                                                </VStack>
                                                                <Badge 
                                                                    colorScheme={detail.status === 'Completed' ? 'green' : 'orange'}
                                                                    px={2}
                                                                    py={0.5}
                                                                    borderRadius="full"
                                                                    fontSize="3xs"
                                                                    fontWeight="bold"
                                                                >
                                                                    {detail.status.toUpperCase()}
                                                                </Badge>
                                                            </Flex>

                                                            <SimpleGrid columns={2} gap={2} fontSize="xs" mb={3}>
                                                                <Box>
                                                                    <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">Installer</Text>
                                                                    <Text fontWeight="medium" noOfLines={1}>{detail.installerName}</Text>
                                                                    <Text color="gray.600" fontSize="2xs">{detail.installerMobile}</Text>
                                                                </Box>
                                                                <Box>
                                                                    <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">Driver</Text>
                                                                    <Text fontWeight="medium" noOfLines={1}>{detail.driverName}</Text>
                                                                    <Text color="gray.600" fontSize="2xs">{detail.driverMobile}</Text>
                                                                </Box>
                                                            </SimpleGrid>
                                                            
                                                            <Box mb={3} p={2} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.100">
                                                                <SimpleGrid columns={2} gap={2}>
                                                                    <Box>
                                                                        <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">PTZ Camera</Text>
                                                                        <Text fontSize="xs" fontWeight="medium" color="blue.700" noOfLines={1}>{detail.ptzCameraId}</Text>
                                                                    </Box>
                                                                    <Box>
                                                                        <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">GPS No</Text>
                                                                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{detail.gpsNo}</Text>
                                                                    </Box>
                                                                    <Box>
                                                                        <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">Router No</Text>
                                                                        <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{detail.routerNo}</Text>
                                                                    </Box>
                                                                    <Box>
                                                                        <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">Is QRT?</Text>
                                                                        <Text fontSize="xs" fontWeight="medium">{detail.isQrtVehicle || 'No'}</Text>
                                                                    </Box>
                                                                </SimpleGrid>
                                                            </Box>

                                                            <Flex justifyContent="space-between" alignItems="flex-end" pt={2} borderTopWidth="1px" borderColor="gray.100">
                                                                <Box>
                                                                    <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">Date & Time</Text>
                                                                    <Text fontSize="xs" fontWeight="medium">{detail.installationDate}</Text>
                                                                    <Text fontSize="2xs" color="gray.500">{detail.submissionTime}</Text>
                                                                </Box>
                                                                <Box textAlign="right" maxW="50%">
                                                                    <Text color="gray.500" fontSize="2xs" fontWeight="bold" textTransform="uppercase">Location</Text>
                                                                    <Text fontSize="xs" fontWeight="medium" noOfLines={2} title={detail.siteAddress}>
                                                                        {detail.siteAddress}
                                                                    </Text>
                                                                </Box>
                                                            </Flex>
                                                        </Box>
                                                    ))}
                                                </SimpleGrid>
                                            </>
                                        )}

                                        {/* Pagination Controls */}
                                        {districtGroup.details && districtGroup.totalPages > 1 && (
                                            <Flex 
                                                justifyContent="space-between" 
                                                alignItems="center" 
                                                px={4} py={3} mt={2}
                                                borderTopWidth="1px" 
                                                borderColor="gray.200"
                                                bg="gray.50"
                                            >
                                                <Text fontSize="sm" color="gray.600">
                                                    Showing {((districtGroup.currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(districtGroup.currentPage * ITEMS_PER_PAGE, districtGroup.totalCount)} of {districtGroup.totalCount}
                                                </Text>
                                                <HStack spacing={2}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        colorScheme="blue"
                                                        onClick={() => fetchDistrictDetails(districtGroup.district, districtGroup.currentPage - 1)}
                                                        isDisabled={districtGroup.currentPage <= 1 || districtGroup.detailsLoading}
                                                    >
                                                        ← Prev
                                                    </Button>
                                                    <Text fontSize="sm" fontWeight="bold" color="blue.600" minW="80px" textAlign="center">
                                                        Page {districtGroup.currentPage} / {districtGroup.totalPages}
                                                    </Text>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        colorScheme="blue"
                                                        onClick={() => fetchDistrictDetails(districtGroup.district, districtGroup.currentPage + 1)}
                                                        isDisabled={districtGroup.currentPage >= districtGroup.totalPages || districtGroup.detailsLoading}
                                                    >
                                                        Next →
                                                    </Button>
                                                </HStack>
                                            </Flex>
                                        )}
                                    </AccordionPanel>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </VStack>
            )}
        </Container>
    );
};

export default withAuth(UsersInstallationReport, ['master', 'admin', 'user']);
