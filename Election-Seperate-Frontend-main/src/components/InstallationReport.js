import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Stack,
    Text,
    Input,
    Button,
    SimpleGrid,
    Flex,
    useToast,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    VStack,
} from '@chakra-ui/react';
import { FaFileExcel } from 'react-icons/fa';
import { getUserInstallations } from '../actions/userActions';
import withAuth from './withAuth';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

const InstallationReport = () => {
    const [installations, setInstallations] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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

    const getFilteredData = () => {
        return installations.filter((installation) => {
            if (!startDate && !endDate) return true;

            const instDate = new Date(installation.createdAt || installation.installationDate);
            instDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (instDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (instDate > end) return false;
            }
            return true;
        });
    };

    const handleDownloadExcel = () => {
        const filtered = getFilteredData();

        if (filtered.length === 0) {
            toast({
                title: "No data found for selected range",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            return;
        }

        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const formattedData = filtered.map(inst => ({
            "Vehicle No": inst.vehicleNo,
            "District": inst.districtName,
            "AC Name": inst.acName,
            "Driver Name": inst.driverName,
            "Driver Mobile": inst.driverMobileNo,
            "PTZ Camera ID": inst.ptzCameraSerialNumber || '—',
            "GPS No.": inst.gpsDeviceSerialNo || '—',
            "Router No.": inst.internet4GRouterSimNo || '—',
            "Installation Date": inst.installationDate,
            "Submission Time": new Date(inst.createdAt).toLocaleString(),
            "Site Address": inst.installationSiteAddress,
            "Status": inst.vehiclePhotoUrl ? 'Completed' : 'Pending'
        }));

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, `My_Installations_Report_${new Date().toLocaleDateString()}${fileExtension}`);

        toast({
            title: "Report Downloaded",
            description: `${filtered.length} records exported successfully.`,
            status: "success",
            duration: 3000
        });
    };

    const filteredCount = getFilteredData().length;

    return (
        <Container maxW="container.md" py={10}>
            <Box
                bg="white"
                p={8}
                borderRadius="2xl"
                boxShadow="xl"
                borderWidth="1px"
                borderColor="gray.100"
            >
                <VStack spacing={6} align="stretch">
                    <Box textAlign="center">
                        <Heading size="lg" color="gray.700">Download Installation Report</Heading>
                        <Text color="gray.500" mt={2}>Select a date range to generate your Excel report</Text>
                    </Box>

                    <Divider />

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <Box>
                            <Text fontWeight="bold" mb={2} fontSize="sm" color="gray.600">Start Date</Text>
                            <Input
                                type="date"
                                size="lg"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                borderRadius="xl"
                            />
                        </Box>
                        <Box>
                            <Text fontWeight="bold" mb={2} fontSize="sm" color="gray.600">End Date</Text>
                            <Input
                                type="date"
                                size="lg"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                borderRadius="xl"
                            />
                        </Box>
                    </SimpleGrid>

                    <Box bg="blue.50" p={4} borderRadius="xl" borderLeft="4px solid" borderColor="blue.400">
                        <StatGroup>
                            <Stat>
                                <StatLabel color="blue.700">Total Installations in Range</StatLabel>
                                <StatNumber color="blue.800">{isLoading ? '...' : filteredCount}</StatNumber>
                            </Stat>
                        </StatGroup>
                    </Box>

                    <Button
                        leftIcon={<FaFileExcel />}
                        colorScheme="green"
                        size="lg"
                        h="60px"
                        fontSize="md"
                        borderRadius="xl"
                        onClick={handleDownloadExcel}
                        isLoading={isLoading}
                        isDisabled={installations.length === 0}
                        shadow="lg"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                    >
                        Download Excel Report
                    </Button>

                    {installations.length === 0 && !isLoading && (
                        <Text textAlign="center" color="orange.500" fontSize="sm">
                            No installations found for your account.
                        </Text>
                    )}
                </VStack>
            </Box>
        </Container>
    );
};

export default withAuth(InstallationReport);
