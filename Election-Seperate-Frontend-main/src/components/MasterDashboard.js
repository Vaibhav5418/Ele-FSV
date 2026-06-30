import React, { useEffect, useState } from 'react';
import withAuth from './withAuth';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  useToast,
  Flex,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { getAllFsvReports, updateFsvReport, getAuditLogs, getDashboardStats, getDashboardInstallers } from '../actions/userActions';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FaDownload, FaFilter } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MasterDashboard = () => {
  const [selectedInstaller, setSelectedInstaller] = useState('');
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Stats and Installers State
  const [districtCounts, setDistrictCounts] = useState({});
  const [statusCounts, setStatusCounts] = useState({ Installed: 0, Pending: 0 });
  const [dailyCounts, setDailyCounts] = useState({});
  const [uniqueInstallers, setUniqueInstallers] = useState([]);

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({});

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);

  useEffect(() => {
    fetchInstallers();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, startDate, endDate, selectedInstaller]);

  const fetchInstallers = async () => {
    const response = await getDashboardInstallers();
    if (response.success) {
      setUniqueInstallers(response.data || []);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (selectedInstaller) filters.installerMobile = selectedInstaller;
      
      const statsPromise = getDashboardStats(filters);
      const reportsPromise = getAllFsvReports({ ...filters, page: currentPage, limit: itemsPerPage });
      
      const [statsRes, reportsRes] = await Promise.all([statsPromise, reportsPromise]);
      
      if (statsRes.success) {
        setDistrictCounts(statsRes.data.districtCounts);
        setStatusCounts(statsRes.data.statusCounts);
        setDailyCounts(statsRes.data.dailyCounts);
      }
      
      if (reportsRes.success) {
        setReports(reportsRes.data);
        setTotalCount(reportsRes.totalCount);
        setTotalPages(reportsRes.totalPages);
      } else {
        toast({ title: "Error fetching data", description: reportsRes.message, status: "error" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to fetch dashboard data", status: "error" });
    }
    setIsLoading(false);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedInstaller('');
    setCurrentPage(1);
  };

  // Helper to safely extract a readable string for the installer name
  const getInstallerName = (r) => {
    return r.personName || r.userName || r.installedBy || r.installerName || 'Unknown';
  };

  const downloadReport = async () => {
    setIsLoading(true);
    let allData = [];
    try {
        const filters = { isExport: true };
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (selectedInstaller) filters.installerMobile = selectedInstaller;

        const response = await getAllFsvReports(filters);
        if (response.success) {
            allData = response.data;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        setIsLoading(false);
        toast({ title: "Export Failed", description: error.message, status: "error" });
        return;
    }
    setIsLoading(false);

    if (allData.length === 0) {
        toast({ title: "No data", description: "No records found to export.", status: "warning" });
        return;
    }

    const exportData = allData.map(r => ({
      'Vehicle No': r.vehicleNo,
      'District': r.districtName,
      'AC Name': r.acName,
      'Driver Name': r.driverName,
      'Driver Mobile': r.driverMobileNo,
      'FST Name': r.fstName,
      'FST Mobile': r.fstMobileNo,
      'Installation Date': r.installationDate,
      'PTZ Serial': r.ptzCameraSerialNumber,
      'Status': r.vehiclePhotoUrl ? 'Installed' : 'Pending',
      'Installed By (Name)': getInstallerName(r),
      'Created At': new Date(r.createdAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FSV Reports');
    const filename = `FSV_Report_${selectedInstaller || 'AllInstallers'}_${startDate || 'AllDates'}_to_${endDate || 'AllDates'}_${Date.now()}.xlsx`;

    // Detect if running inside Capacitor native app
    const isNative = window.Capacitor?.isNativePlatform?.();

    if (isNative) {
      // Native mobile: Save file in app's Documents directory
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: wbout,
          directory: Directory.Documents,
        });
        console.log('✅ Excel report saved to:', result.uri);
        toast({
          title: "Report Saved Successfully",
          description: `File saved to Documents: ${filename}`,
          status: "success",
          duration: 5000,
          isClosable: true
        });
      } catch (error) {
        console.error('❌ Error saving Excel file:', error);
        toast({ title: "Failed to Save Report", description: error.message, status: "error" });
      }
    } else {
      // Web browser: trigger normal file download
      XLSX.writeFile(wb, filename);
      toast({ title: "Report Downloaded", description: `${allData.length} records exported`, status: "success" });
    }
  };

  const handleEditClick = (report) => {
    setSelectedReport(report);
    setEditFormData(report);
    onOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'driverMobileNo') {
      if (!/^\d{0,10}$/.test(value)) return;
    }
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (editFormData.driverMobileNo && editFormData.driverMobileNo.length !== 10) {
      toast({ title: "Invalid Mobile", description: "Driver mobile must be exactly 10 digits.", status: "error" });
      return;
    }
    const response = await updateFsvReport(selectedReport._id, editFormData);
    if (response.success) {
      toast({ title: "Updated Successfully", status: "success" });
      fetchData(); // Refresh data
      onClose();
    } else {
      toast({ title: "Update Failed", description: response.message, status: "error" });
    }
  };

  const fetchAuditLogs = async () => {
    const response = await getAuditLogs(auditLogsPage, 50);
    if (response.success) {
      setAuditLogs(response.data);
      setAuditLogsTotal(response.total);
    } else {
      toast({ title: "Error fetching audit logs", description: response.message, status: "error" });
    }
  };

  // --- Visualization Data Preparation ---
  // The state variables districtCounts, statusCounts, and dailyCounts are already populated via API


  // Sort daily counts by date
  const sortedDates = Object.keys(dailyCounts).sort((a, b) => new Date(a) - new Date(b));
  const dailyData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Daily Installations',
        data: sortedDates.map(date => dailyCounts[date]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
    ],
  };

  const barData = {
    labels: Object.keys(districtCounts),
    datasets: [
      {
        label: 'Vehicles per District',
        data: Object.values(districtCounts),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: '# of Votes',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(255, 99, 132, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container maxW="100vw" p={4} bg="#F4F4F5" minH="100vh">
      <Flex direction={{ base: "column", md: "row" }} justifyContent="space-between" alignItems={{ base: "flex-start", md: "center" }} mb={6} gap={4}>
        <Heading size={{ base: "md", md: "lg" }}>Master Dashboard</Heading>
        <Flex gap={2} wrap="wrap">
          <IconButton
            icon={<FaFilter />}
            onClick={() => setShowFilters(!showFilters)}
            colorScheme={startDate || endDate || selectedInstaller ? "blue" : "gray"}
            aria-label="Toggle Filters"
            size={{ base: "sm", md: "md" }}
          />
          <Button size={{ base: "sm", md: "md" }} leftIcon={<FaDownload />} colorScheme="green" onClick={downloadReport} isDisabled={totalCount === 0 || isLoading}>
            Download Report
          </Button>
          <Button size={{ base: "sm", md: "md" }} onClick={() => navigate('/autoinstaller')}>Back to Installer</Button>
        </Flex>
      </Flex>

      {/* Date & Installer Filters */}
      {showFilters && (
        <Box p={4} bg="white" borderRadius="lg" boxShadow="sm" mb={4}>
          <Heading size="sm" mb={3}>Dashboard Filters</Heading>
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} alignItems="end">
            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Installer</FormLabel>
              <Box as="select"
                value={selectedInstaller}
                onChange={(e) => setSelectedInstaller(e.target.value)}
                w="100%" h="40px" px={3} borderRadius="md" border="1px" borderColor="inherit">
                <option value="">All Installers</option>
                {uniqueInstallers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Box>
            </FormControl>
            <Button colorScheme="blue" onClick={handleFilterApply}>Apply Dates</Button>
            <Button variant="outline" onClick={handleClearFilters}>Clear All</Button>
          </SimpleGrid>
        </Box>
      )}

      {/* Summary Statistics */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
        <Stat p={4} bg="white" borderRadius="lg" boxShadow="sm">
          <StatLabel>Total Installations</StatLabel>
          <StatNumber>{totalCount}</StatNumber>
          <StatHelpText>{startDate || endDate || selectedInstaller ? 'Filtered' : 'All Time'}</StatHelpText>
        </Stat>
        <Stat p={4} bg="white" borderRadius="lg" boxShadow="sm">
          <StatLabel>Installed</StatLabel>
          <StatNumber>{statusCounts.Installed}</StatNumber>
          <StatHelpText>{((statusCounts.Installed / totalCount) * 100 || 0).toFixed(1)}%</StatHelpText>
        </Stat>
        <Stat p={4} bg="white" borderRadius="lg" boxShadow="sm">
          <StatLabel>Pending</StatLabel>
          <StatNumber>{statusCounts.Pending}</StatNumber>
          <StatHelpText>{((statusCounts.Pending / totalCount) * 100 || 0).toFixed(1)}%</StatHelpText>
        </Stat>
        <Stat p={4} bg="white" borderRadius="lg" boxShadow="sm">
          <StatLabel>Avg Per Day</StatLabel>
          <StatNumber>{Object.keys(dailyCounts).length > 0 ? (totalCount / Object.keys(dailyCounts).length).toFixed(1) : 0}</StatNumber>
          <StatHelpText>Based on active days</StatHelpText>
        </Stat>
      </SimpleGrid>


      {/* Visualizations */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Audit Logs</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {/* Daily Trend Chart */}
            <Box p={4} bg="white" borderRadius="lg" boxShadow="sm" mb={8}>
              <Heading size="md" mb={4}>Daily Installation Trend</Heading>
              <Line data={dailyData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
              <Box p={4} bg="white" borderRadius="lg" boxShadow="sm">
                <Heading size="md" mb={4}>District-wise Installation</Heading>
                <Bar data={barData} />
              </Box>
              <Box p={4} bg="white" borderRadius="lg" boxShadow="sm">
                <Heading size="md" mb={4}>Installation Status</Heading>
                <Box h="300px" display="flex" justifyContent="center">
                  <Pie data={pieData} />
                </Box>
              </Box>
            </SimpleGrid>

            {/* Data Table */}
            <Box p={6} bg="white" borderRadius="xl" boxShadow="sm" border="1px" borderColor="gray.100">
              <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading size="md" color="gray.700">Vehicle Installation Details</Heading>
                <Badge colorScheme="blue" fontSize="sm" p={1} borderRadius="md">
                  Total: {totalCount}
                </Badge>
              </Flex>

              {/* Desktop View - Table */}
              <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
                <Table variant="simple" size="md">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th py={4} color="gray.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Vehicle No</Th>
                      <Th py={4} color="gray.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">District</Th>
                      <Th py={4} color="gray.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Installer</Th>
                      <Th py={4} color="gray.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Mobile</Th>
                      <Th py={4} color="gray.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Status</Th>
                      <Th py={4} color="gray.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reports.map((report) => (
                        <Tr key={report._id} _hover={{ bg: "gray.50", transition: "all 0.2s" }}>
                          <Td fontWeight="medium" color="gray.700">{report.vehicleNo}</Td>
                          <Td color="gray.600">{report.districtName}</Td>
                          <Td color="gray.600">{getInstallerName(report)}</Td>
                          <Td color="gray.600">{report.personMobile || report.mobile || 'Unknown'}</Td>
                          <Td>
                            {report.vehiclePhotoUrl ? (
                              <Badge colorScheme="green" variant="subtle" px={2} py={1} borderRadius="full">
                                Installed
                              </Badge>
                            ) : (
                              <Badge colorScheme="orange" variant="subtle" px={2} py={1} borderRadius="full">
                                Pending
                              </Badge>
                            )}
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => handleEditClick(report)}
                              _hover={{ bg: "blue.50" }}
                            >
                              Edit
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    {reports.length === 0 && (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={8} color="gray.500">
                          No records found
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>

              {/* Mobile View - Cards */}
              <Box display={{ base: 'block', md: 'none' }}>
                {reports.map((report) => (
                    <Box
                      key={report._id}
                      p={4}
                      mb={4}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      bg="white"
                      shadow="sm"
                    >
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontWeight="bold" fontSize="lg" color="gray.700">{report.vehicleNo}</Text>
                        {report.vehiclePhotoUrl ? (
                          <Badge colorScheme="green" px={2} py={1} borderRadius="full">Installed</Badge>
                        ) : (
                          <Badge colorScheme="orange" px={2} py={1} borderRadius="full">Pending</Badge>
                        )}
                      </Flex>

                      <SimpleGrid columns={2} spacing={3} mb={4}>
                        <Box>
                          <Text fontSize="xs" color="gray.500" textTransform="uppercase">District</Text>
                          <Text fontSize="sm" fontWeight="medium">{report.districtName}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500" textTransform="uppercase">Installer</Text>
                          <Text fontSize="sm" fontWeight="medium">{getInstallerName(report)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500" textTransform="uppercase">Mobile</Text>
                          <Text fontSize="sm" fontWeight="medium">{report.personMobile || report.mobile || 'Unknown'}</Text>
                        </Box>
                      </SimpleGrid>

                      <Button
                        size="sm"
                        width="full"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => handleEditClick(report)}
                      >
                        Edit Details
                      </Button>
                    </Box>
                  ))}
                {reports.length === 0 && (
                  <Box textAlign="center" py={8} color="gray.500">
                    No records found
                  </Box>
                )}
              </Box>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems="center"
                  mt={6}
                  pt={4}
                  borderTop="1px"
                  borderColor="gray.100"
                  gap={4}
                >
                  <Text fontSize="sm" color="gray.500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                  </Text>
                  <Flex gap={2}>
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      isDisabled={currentPage === 1}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    {/* Hide page numbers on mobile to save space, show simple Prev/Next */}
                    <Box display={{ base: 'none', md: 'flex' }} gap={2}>
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;

                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }

                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            colorScheme={currentPage === pageNum ? "blue" : "gray"}
                            variant={currentPage === pageNum ? "solid" : "ghost"}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </Box>
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      isDisabled={currentPage >= totalPages}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </Flex>
                </Flex>
              )}
            </Box>
          </TabPanel>

          <TabPanel>
            {/* Audit Logs Table */}
            <Box p={4} bg="white" borderRadius="lg" boxShadow="sm" overflowX="auto">
              <Heading size="md" mb={4}>Audit Logs ({auditLogsTotal} total)</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Timestamp</Th>
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Action</Th>
                    <Th>Resource</Th>
                    <Th>Changes</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {auditLogs.map((log) => (
                    <Tr key={log._id}>
                      <Td>{new Date(log.timestamp).toLocaleString()}</Td>
                      <Td>{log.userName} ({log.userMobile})</Td>
                      <Td><Badge>{log.userRole}</Badge></Td>
                      <Td><Badge colorScheme={log.action === 'CREATE' ? 'green' : log.action === 'UPDATE' ? 'blue' : 'red'}>{log.action}</Badge></Td>
                      <Td>{log.resourceType}</Td>
                      <Td>
                        {log.changes && (
                          <Text fontSize="xs" noOfLines={2}>
                            {JSON.stringify(log.changes)}
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Vehicle Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={3}>
              <FormLabel>Vehicle No</FormLabel>
              <Input name="vehicleNo" value={editFormData.vehicleNo || ''} onChange={handleInputChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Driver Name</FormLabel>
              <Input name="driverName" value={editFormData.driverName || ''} onChange={handleInputChange} />
            </FormControl>
            <FormControl mb={3} isInvalid={editFormData.driverMobileNo && editFormData.driverMobileNo.length > 0 && editFormData.driverMobileNo.length !== 10}>
              <FormLabel>Driver Mobile</FormLabel>
              <Input name="driverMobileNo" type="tel" value={editFormData.driverMobileNo || ''} onChange={handleInputChange} />
              <Text color="red.500" fontSize="xs" mt={1.5} fontWeight="semibold" display={editFormData.driverMobileNo && editFormData.driverMobileNo.length > 0 && editFormData.driverMobileNo.length !== 10 ? "block" : "none"}>
                Driver mobile must be exactly 10 digits.
              </Text>
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>District</FormLabel>
              <Input name="districtName" value={editFormData.districtName || ''} onChange={handleInputChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Assembly Name</FormLabel>
              <Input name="acName" value={editFormData.acName || ''} onChange={handleInputChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Camera Serial Number</FormLabel>
              <Input name="ptzCameraSerialNumber" value={editFormData.ptzCameraSerialNumber || ''} onChange={handleInputChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>State</FormLabel>
              <Input name="state" value={editFormData.state || ''} onChange={handleInputChange} />
            </FormControl>
            <Button colorScheme="blue" mr={3} onClick={handleUpdate}>
              Update
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default withAuth(MasterDashboard, ['master']);
