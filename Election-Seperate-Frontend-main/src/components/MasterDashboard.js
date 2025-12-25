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
  TabPanel
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { getAllFsvReports, updateFsvReport, getAuditLogs } from '../actions/userActions';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MasterDashboard = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({});

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole'); // Assuming role is stored here
    // If not found in localStorage, maybe check Redux or however auth is handled. 
    // For now, I'll assume localStorage based on common patterns, or I'll add a check.
    
    // Better: Check if user is allowed. 
    // Since the user asked for "if role is master", I'll enforce it here or in parent.
    // Let's fetch data first.
    fetchData();
    fetchAuditLogs();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const response = await getAllFsvReports();
    if (response.success) {
      setReports(response.data);
    } else {
      toast({ title: "Error fetching data", description: response.message, status: "error" });
    }
    setIsLoading(false);
  };

  const handleEditClick = (report) => {
    setSelectedReport(report);
    setEditFormData(report);
    onOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
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
  const districtCounts = {};
  const statusCounts = { Installed: 0, Pending: 0 }; // Example statuses

  reports.forEach(r => {
    // District Count
    const dist = r.districtName || 'Unknown';
    districtCounts[dist] = (districtCounts[dist] || 0) + 1;

    // Status Count (Inferring status from data presence, e.g., if photo exists)
    const isInstalled = r.vehiclePhotoUrl ? 'Installed' : 'Pending';
    statusCounts[isInstalled]++;
  });

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
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Master Dashboard</Heading>
        <Button onClick={() => navigate('/autoinstaller')}>Back to Installer</Button>
      </Flex>

      {/* Visualizations */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Audit Logs</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
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
            <Box p={4} bg="white" borderRadius="lg" boxShadow="sm" overflowX="auto">
              <Heading size="md" mb={4}>Vehicle Details</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Vehicle No</Th>
                    <Th>District</Th>
                    <Th>Driver Name</Th>
                    <Th>Mobile</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reports.map((report) => (
                    <Tr key={report._id}>
                      <Td>{report.vehicleNo}</Td>
                      <Td>{report.districtName}</Td>
                      <Td>{report.driverName}</Td>
                      <Td>{report.driverMobileNo}</Td>
                      <Td>
                        {report.vehiclePhotoUrl ? (
                          <Badge colorScheme="green">Installed</Badge>
                        ) : (
                          <Badge colorScheme="orange">Pending</Badge>
                        )}
                      </Td>
                      <Td>
                        <Button size="xs" colorScheme="blue" onClick={() => handleEditClick(report)}>Edit</Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
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
            <FormControl mb={3}>
              <FormLabel>Driver Mobile</FormLabel>
              <Input name="driverMobileNo" value={editFormData.driverMobileNo || ''} onChange={handleInputChange} />
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
