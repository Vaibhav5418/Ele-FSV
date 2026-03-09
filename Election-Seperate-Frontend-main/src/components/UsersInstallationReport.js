import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Heading, Table, Thead, Tbody, Tr, Th, Td, Select, HStack, Input, Text, useToast, VStack, Divider, Flex, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, TableContainer } from '@chakra-ui/react';
import { getUsersInstallationReport } from '../actions/userActions';
import withAuth from './withAuth';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'react-datepicker/dist/react-datepicker.css';

const UsersInstallationReport = () => {
    const [reportData, setReportData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [installerSearch, setInstallerSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Check master role (assuming role is saved in localStorage during login)
    const userRole = localStorage.getItem('role');
    const isMaster = userRole === 'master'; // Adjust according to exact role keywords

    useEffect(() => {
        if (isMaster) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMaster, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getUsersInstallationReport(startDate, endDate);
            if (data && data.success) {
                setReportData(data.data);
            } else {
                toast({
                    title: 'Error fetching report',
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
                description: 'Failed to fetch the report.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
        setLoading(false);
    };

    const handleFilter = () => {
        fetchData();
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setInstallerSearch('');
        // We will call fetchData again in a fresh state, but state updates are async, 
        // so we call the action directly without params for the reset.
        fetchResetData();
    };

    const fetchResetData = async () => {
        setLoading(true);
        try {
            const data = await getUsersInstallationReport('', '');
            if (data && data.success) {
                setReportData(data.data);
            }
        } catch (error) {
            console.error('Fetch reset error:', error);
        }
        setLoading(false);
    };

    const filteredReportData = reportData.filter(userGroup =>
        installerSearch === '' || String(userGroup.user.mobile) === installerSearch
    );

    const getFileName = (extension) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

        let prefix = "users_installation_report";

        if (installerSearch) {
            const userGroup = reportData.find(ug => String(ug.user.mobile) === installerSearch);
            if (userGroup && userGroup.user && userGroup.user.name) {
                prefix = `${userGroup.user.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_installer_report`;
            }
        } else if (filteredReportData.length === 1 && filteredReportData[0].user && filteredReportData[0].user.name) {
            prefix = `${filteredReportData[0].user.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_installer_report`;
        }

        return `${prefix}_${timestamp}.${extension}`;
    };

    const exportToExcel = () => {
        if (filteredReportData.length === 0) {
            toast({ title: "No data to export", status: "warning", duration: 3000 });
            return;
        }

        const aoaData = [];
        filteredReportData.forEach(userGroup => {
            const installerName = userGroup.user.name || 'Unknown';
            const installerMobile = userGroup.user.mobile || 'Unknown';
            const comp = userGroup.installationsCompleted || 0;
            const pend = userGroup.installationsPending || 0;

            // aoaData.push([
            //     "Installer Name", installerName,
            //     "Mobile Number", installerMobile,
            if (filteredReportData.length > 1) {
                aoaData.push([
                    "Installer Name", installerName
                ]);

                aoaData.push([
                    "Mobile Number", installerMobile
                ]);

                aoaData.push([]);
            }

            aoaData.push([
                "Vehicle No", "District", "AC Name", "Driver Name", "Driver Mobile",
                "PTZ Camera ID", "GPS No.", "Router No.", "Installation Date",
                "Submission Time", "Site Address", "Status"
            ]);

            const combinedDetails = [...(userGroup.completedDetails || []), ...(userGroup.pendingDetails || [])];

            if (combinedDetails.length > 0) {
                combinedDetails.forEach(detail => {
                    aoaData.push([
                        detail.vehicleNo || '',
                        detail.district || '',
                        detail.acName || '',
                        detail.driverName || '',
                        detail.driverMobile || '',
                        detail.ptzCameraId || '',
                        detail.gpsNo || '',
                        detail.routerNo || '',
                        detail.installationDate || '',
                        detail.submissionTime || '',
                        detail.siteAddress || '',
                        detail.status === 'Completed' ? 'Completed' : 'Pending'
                    ]);
                });
            } else {
                aoaData.push(["No details available"]);
            }

            // Add a blank row between installers
            aoaData.push([]);

        });

        // Add the system generated footer at the very end of the report
        aoaData.push([]);

        // Simulating center alignment with spaces since standard xlsx doesn't support styles
        const footerString = `This is System Generated Report on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
        const paddedFooter = "                                                                                          " + footerString;
        aoaData.push([paddedFooter]);

        const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

        // Merge the footer row across all 12 columns
        const footerRowIndex = aoaData.length - 1;
        worksheet["!merges"] = [
            { s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 11 } }
        ];

        // Autoupdate column widths optionally
        const colWidths = [
            { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 30 }, { wch: 15 }
        ];
        worksheet["!cols"] = colWidths;

        // Apply bold/italic styles to specific rows
        for (let R = 0; R < aoaData.length; R++) {
            if (aoaData[R][0] === "Vehicle No") {
                for (let C = 0; C < 12; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (worksheet[cellAddress]) {
                        worksheet[cellAddress].s = { font: { bold: true } };
                    }
                }
            } else if (aoaData[R][0] === "Installer Name" || aoaData[R][0] === "Mobile Number") {
                // Bold the first and second column for these rows
                for (let C = 0; C < 2; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (worksheet[cellAddress]) {
                        worksheet[cellAddress].s = { font: { bold: true } };
                    }
                }
            }
        }

        // Apply italic style to the footer cell
        const footerCellAddress = XLSX.utils.encode_cell({ r: footerRowIndex, c: 0 });
        if (worksheet[footerCellAddress]) {
            worksheet[footerCellAddress].s = { font: { italic: true } };
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Installations");
        XLSX.writeFile(workbook, getFileName('xlsx'));
    };

    const getImageData = (url) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve({
                    dataUrl: canvas.toDataURL('image/png'),
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = (error) => reject(error);
        });
    };

    const exportToPDF = async () => {
        if (filteredReportData.length === 0) {
            toast({ title: "No data to export", status: "warning", duration: 3000 });
            return;
        }

        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = 15;

        // Add Logo
        try {
            const logoUrl = '/screenshot-wide.png';
            const { dataUrl: logoData, width: naturalWidth, height: naturalHeight } = await getImageData(logoUrl);

            const logoWidth = 40; // wider logo width for the header
            const ratio = naturalHeight / naturalWidth;
            const logoHeight = logoWidth * ratio;

            const xPos = (pageWidth - logoWidth) / 2;

            doc.addImage(logoData, 'PNG', xPos, currentY, logoWidth, logoHeight);
            currentY += logoHeight + 5;
        } catch (error) {
            console.error("Error loading logo:", error);
            currentY += 10;
        }

        // Add Title
        doc.setFontSize(14);
        doc.text("Installation Report - FSV", pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        const tableColumn = [
            "Vehicle No", "District", "AC Name", "Driver Name", "Driver Mobile",
            "PTZ Camera ID", "GPS No.", "Router No.", "Installation Date",
            "Submission Time", "Site Address", "Status"
        ];

        filteredReportData.forEach(userGroup => {
            if (currentY > pageHeight - 30) {
                doc.addPage();
                currentY = 20;
            }

            const installerName = userGroup.user.name || 'Unknown';
            const installerMobile = userGroup.user.mobile || 'Unknown';

            autoTable(doc, {
                body: [
                    [`Installer Name: ${installerName}`, `Mobile Number: ${installerMobile}`]
                ],
                startY: currentY,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    fontStyle: 'bold',
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    cellPadding: 3
                },
                margin: { left: 14, right: 14 }
            });
            currentY = doc.lastAutoTable.finalY + 5;

            const combinedDetails = [...(userGroup.completedDetails || []), ...(userGroup.pendingDetails || [])];

            if (combinedDetails.length > 0) {
                const tableRows = combinedDetails.map(detail => [
                    detail.vehicleNo || '-',
                    detail.district || '-',
                    detail.acName || '-',
                    detail.driverName || '-',
                    detail.driverMobile || '-',
                    detail.ptzCameraId || '-',
                    detail.gpsNo || '-',
                    detail.routerNo || '-',
                    detail.installationDate || '-',
                    detail.submissionTime || '-',
                    detail.siteAddress || '-',
                    detail.status === 'Completed' ? 'Completed' : 'Pending'
                ]);

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: currentY,
                    theme: 'grid',
                    styles: {
                        fontSize: 8,
                        overflow: 'linebreak',
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1,
                        cellPadding: 2
                    },
                    headStyles: {
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold',
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1
                    },
                    margin: { left: 14, right: 14 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            } else {
                doc.setFontSize(8);
                doc.text("No details available", 14, currentY);
                currentY += 15;
            }
        });

        // Add the system generated footer
        const dateStr = new Date().toLocaleDateString();
        const timeStr = new Date().toLocaleTimeString();
        const footerText = `This is System Generated Report on ${dateStr} at ${timeStr}`;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }
        doc.text(footerText, pageWidth / 2, currentY, { align: 'center' });
        doc.setFont('helvetica', 'normal');

        doc.save(getFileName('pdf'));
    };

    if (!isMaster) {
        return (
            <Container maxW="container.xl" mt={10}>
                <Heading size="md" color="red.500">Access Denied: You do not have permission to view this report.</Heading>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" mt={8} mb={20}>
            <Heading size="lg" mb={6}>Users Installation Report</Heading>

            {/* Action Bar Section */}
            <Box p={4} borderWidth="1px" borderRadius="lg" mb={6} bg="white">
                <Flex direction={{ base: 'column', xl: 'row' }} justify="space-between" alignItems={{ base: 'stretch', xl: 'flex-end' }} gap={4}>
                    <Flex direction={{ base: 'column', md: 'row' }} gap={4} alignItems={{ base: 'stretch', md: 'flex-end' }} flexWrap="wrap" flex="1">
                        <Box flex={{ base: "1", md: "auto" }}>
                            <Text mb={2} fontWeight="bold" fontSize="sm">Start Date</Text>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                width="full"
                            />
                        </Box>
                        <Box flex={{ base: "1", md: "auto" }}>
                            <Text mb={2} fontWeight="bold" fontSize="sm">End Date</Text>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                width="full"
                            />
                        </Box>
                        <Box flex={{ base: "1", md: "auto" }} minW={{ md: "250px" }}>
                            <Text mb={2} fontWeight="bold" fontSize="sm">Installer Name</Text>
                            <Select
                                placeholder="Select installer..."
                                value={installerSearch}
                                onChange={(e) => setInstallerSearch(e.target.value)}
                                width="full"
                            >
                                {Array.from(new Map(reportData.map(ug => [ug.user.mobile, ug.user])).values())
                                    .sort((a, b) => (a.name || 'Unknown').localeCompare(b.name || 'Unknown'))
                                    .map((user, index) => (
                                        <option key={index} value={user.mobile}>
                                            {user.name || 'Unknown'} ({user.mobile || 'N/A'})
                                        </option>
                                    ))}
                            </Select>
                        </Box>
                        <HStack width={{ base: 'full', md: 'auto' }}>
                            <Button colorScheme="blue" onClick={handleFilter} isLoading={loading} flex={1}>Filter</Button>
                            <Button variant="outline" onClick={handleClearFilter} isDisabled={loading} flex={1}>Clear</Button>
                        </HStack>
                    </Flex>

                    {/* Export Section */}
                    <HStack width={{ base: 'full', xl: 'auto' }}>
                        <Button colorScheme="green" onClick={exportToExcel} isDisabled={filteredReportData.length === 0} flex={1}>Export to Excel</Button>
                        <Button colorScheme="red" onClick={exportToPDF} isDisabled={filteredReportData.length === 0} flex={1}>Export to PDF</Button>
                    </HStack>
                </Flex>
            </Box>

            {/* Data Display */}
            {loading ? (
                <Text>Loading report data...</Text>
            ) : filteredReportData.length === 0 ? (
                <Text>No installations found for the selected criteria.</Text>
            ) : (
                <VStack spacing={8} align="stretch" pb={10}>
                    <Accordion allowMultiple>
                        {filteredReportData.map((userGroup, index) => {
                            const combinedDetails = [...(userGroup.completedDetails || []), ...(userGroup.pendingDetails || [])];

                            return (
                                <AccordionItem key={index} borderWidth="1px" borderRadius="lg" bg="gray.50" mb={4}>
                                    <h2>
                                        <AccordionButton p={4} _expanded={{ bg: 'blue.50' }}>
                                            <Box flex="1" textAlign="left">
                                                <Heading size="md" color="blue.700" mb={2}>
                                                    {userGroup.user.name || 'Unknown User'} ({userGroup.user.mobile})
                                                </Heading>
                                                <HStack spacing={6}>
                                                    <Text fontWeight="bold" color="green.600">Completed: {userGroup.installationsCompleted}</Text>
                                                    <Text fontWeight="bold" color="orange.500">Pending: {userGroup.installationsPending}</Text>
                                                </HStack>
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                    </h2>
                                    <AccordionPanel pb={4} bg="white" overflowX="auto">
                                        <TableContainer>
                                            <Table size="sm" variant="simple">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Vehicle No</Th>
                                                        <Th>District</Th>
                                                        <Th>AC Name</Th>
                                                        <Th>Driver Name</Th>
                                                        <Th>Driver Mobile</Th>
                                                        <Th>PTZ Camera ID</Th>
                                                        <Th>GPS No.</Th>
                                                        <Th>Router No.</Th>
                                                        <Th>Installation Date</Th>
                                                        <Th>Submission Time</Th>
                                                        <Th>Site Address</Th>
                                                        <Th>Status</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {combinedDetails.map((detail, idx) => (
                                                        <Tr key={idx}>
                                                            <Td>{detail.vehicleNo || '-'}</Td>
                                                            <Td>{detail.district || '-'}</Td>
                                                            <Td>{detail.acName || '-'}</Td>
                                                            <Td>{detail.driverName || '-'}</Td>
                                                            <Td>{detail.driverMobile || '-'}</Td>
                                                            <Td>{detail.ptzCameraId || '-'}</Td>
                                                            <Td>{detail.gpsNo || '-'}</Td>
                                                            <Td>{detail.routerNo || '-'}</Td>
                                                            <Td>{detail.installationDate || '-'}</Td>
                                                            <Td>{detail.submissionTime || '-'}</Td>
                                                            <Td whiteSpace="normal" minWidth="200px">{detail.siteAddress || '-'}</Td>
                                                            <Td fontWeight="bold" color={detail.status === 'Completed' ? 'green.500' : 'orange.500'}>
                                                                {detail.status === 'Completed' ? 'Completed' : 'Pending'}
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                    {combinedDetails.length === 0 && (
                                                        <Tr>
                                                            <Td colSpan={12} textAlign="center">No details available</Td>
                                                        </Tr>
                                                    )}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
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

export default withAuth(UsersInstallationReport);
