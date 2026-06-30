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
    VStack,
    useToast,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
} from '@chakra-ui/react';
import { FaFileExcel } from 'react-icons/fa';
import { getUserInstallations } from '../actions/userActions';
import withAuth from './withAuth';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

const InstallationReport = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const toast = useToast();

    // Fetch the count of matching records whenever the dates change
    useEffect(() => {
        fetchCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    const fetchCount = async () => {
        setIsLoading(true);
        try {
            // limit: 1 ensures we just get totalCount quickly without transferring data
            const result = await getUserInstallations({ startDate, endDate, limit: 1 });
            if (result.success) {
                setTotalCount(result.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching count:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (totalCount === 0) {
            toast({
                title: "No data found for selected range",
                status: "warning",
                duration: 3000,
                isClosable: true
            });
            return;
        }

        setIsDownloading(true);
        try {
            // isExport=true bypasses the 100-limit cap on the backend
            const result = await getUserInstallations({ startDate, endDate, isExport: true });
            
            if (result.success && result.data.length > 0) {
                const filtered = result.data;
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
            } else {
                toast({
                    title: "Export Failed",
                    description: result.message || "Failed to fetch data for export",
                    status: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: "Export Failed",
                description: "An error occurred during export",
                status: "error",
                duration: 3000
            });
        } finally {
            setIsDownloading(false);
        }
    };

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
                                <StatNumber color="blue.800">{isLoading ? '...' : totalCount}</StatNumber>
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
                        isLoading={isDownloading}
                        isDisabled={totalCount === 0 || isLoading}
                        shadow="lg"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                    >
                        Download Excel Report
                    </Button>

                    {totalCount === 0 && !isLoading && (
                        <Text textAlign="center" color="orange.500" fontSize="sm">
                            No installations found for selected date range.
                        </Text>
                    )}
                </VStack>
            </Box>
        </Container>
    );
};

export default withAuth(InstallationReport);
