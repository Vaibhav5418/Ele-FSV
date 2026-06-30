import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Box,
  Text,
  Grid,
  GridItem,
  Heading,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Image,
  SimpleGrid,
  Button,
  useToast
} from '@chakra-ui/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FaDownload } from 'react-icons/fa';

const InstallationListModal = ({ isOpen, onClose, installation }) => {
  const toast = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!installation) return null;
  const qrtVehicleValue = installation?.isQrtVehicle || installation?.isQRTVehicle || 'N/A';
  const backsideLCDInstalledValue = installation?.backsideLCDInstalled || 'Yes';
  const dcAcConverterInstalledValue = installation?.dcAcConverterInstalled || 'Yes';
  const electricalPowerStripInstalledValue = installation?.electricalPowerStripInstalled || 'Yes';
  const trainingToDriverAndFSTMemberValue = installation?.trainingToDriverAndFSTMember || 'Yes';

  // Helper function to load image and convert to base64
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

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const sanitizeForFileName = (value, fallback) => {
        const cleaned = String(value || '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, '');
        return cleaned || fallback;
      };
      const createdAtSource = installation?.createdAt || installation?.updatedAt || new Date().toISOString();
      const createdAtText = new Date(createdAtSource).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const formatDateTime = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value);
        return parsed
          .toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
          .replace(',', '');
      };

      const installationDateValue = installation?.installationDate;
      const hasDateOnlyValue =
        typeof installationDateValue === 'string' &&
        (
          /^\d{4}-\d{2}-\d{2}$/.test(installationDateValue) ||
          /T00:00:00(\.000)?Z$/i.test(installationDateValue)
        );
      const installationDateSource =
        (hasDateOnlyValue ? (installation?.createdAt || installation?.updatedAt) : installationDateValue) ||
        installation?.createdAt ||
        installation?.updatedAt;
      const installationDateText = formatDateTime(installationDateSource);
      let yPos = 20;

      // Helper function to draw table cell
      const drawCell = (x, y, width, height, text, isBold = false) => {
        pdf.rect(x, y, width, height);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(text, width - 4);
        pdf.text(lines, x + 2, y + 5);
      };

      // VMukti Logo/Header
      try {
        const logoUrl = '/vmlogo.png';
        const { dataUrl: logoData, width: naturalWidth, height: naturalHeight } = await getImageData(logoUrl);

        const logoWidth = 40;
        const ratio = naturalHeight / naturalWidth;
        const logoHeight = logoWidth * ratio;

        const xPos = (pageWidth - logoWidth) / 2;

        pdf.addImage(logoData, 'PNG', xPos, 10, logoWidth, logoHeight);
        yPos = 10 + logoHeight + 5;
      } catch (error) {
        console.error("Error loading logo:", error);
        yPos += 10;
      }

      // Title
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('West Bengal Assembly Election 2026', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      pdf.text('INSTALLATION REPORT OF FLYING SQUAD VEHICLE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Basic Information Section (2 columns)
      const col1Width = (pageWidth - 2 * margin) / 2;
      const col2Width = (pageWidth - 2 * margin) / 2;
      const rowHeight = 8;

      // Row 1: District Name | AC Name
      drawCell(margin, yPos, col1Width, rowHeight, `District Name: ${installation?.districtName || ''}`, true);
      drawCell(margin + col1Width, yPos, col2Width, rowHeight, `AC Name: ${installation?.acName || ''}`, true);
      yPos += rowHeight;

      // Row 2: Vehicle No | Installation Date
      drawCell(margin, yPos, col1Width, rowHeight, `Vehicle No: ${installation?.vehicleNo || ''}`, true);
      drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Installation Date: ${installationDateText}`, true);
      yPos += rowHeight;

      // Row 3: Driver Name | Installation Site & Address
      drawCell(margin, yPos, col1Width, rowHeight, `Driver Name: ${installation?.driverName || ''}`, true);
      drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Installation Site & Address: ${installation?.installationSiteAddress || ''}`, true);
      yPos += rowHeight;

      // Row 4: Driver Mobile No | Type of Vehicle
      drawCell(margin, yPos, col1Width, rowHeight, `Driver Mobile No: ${installation?.driverMobileNo || ''}`, true);
      drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Type of Vehicle: ${installation?.typeOfVehicle || ''}`, true);
      yPos += rowHeight;

      // Row 6: Installer Name | Installer Mobile
      drawCell(margin, yPos, col1Width, rowHeight, `Installer Name: ${installation?.installerName || ''}`, true);
      drawCell(margin + col1Width, yPos, col2Width, rowHeight, `Installer Mobile: ${installation?.installerMobile || installation?.createdByMobile || ''}`, true);
      yPos += rowHeight;

      // Row 6: Is QRT vehicle?
      drawCell(margin, yPos, pageWidth - 2 * margin, rowHeight, `Is QRT vehicle?: ${qrtVehicleValue}`, true);
      yPos += rowHeight;

      // Row 7: Created At timestamp
      drawCell(margin, yPos, pageWidth - 2 * margin, rowHeight, `Created At: ${createdAtText}`, true);
      yPos += rowHeight;

      yPos += 3;

      // Equipment Table Header
      const descWidth = (pageWidth - 2 * margin) * 0.5;
      const serialWidth = (pageWidth - 2 * margin) * 0.3;
      const installedWidth = (pageWidth - 2 * margin) * 0.2;

      drawCell(margin, yPos, descWidth, rowHeight, 'DESCRIPTION', true);
      drawCell(margin + descWidth, yPos, serialWidth, rowHeight, 'SERIAL NO', true);
      drawCell(margin + descWidth + serialWidth, yPos, installedWidth, rowHeight, 'INSTALLED YES/NO', true);
      yPos += rowHeight;

      // Equipment rows
      const equipment = [
        ['PTZ Camera Model number', installation?.ptzCameraModelNumber || '', ''],
        ['PTZ Camera ID', installation?.ptzCameraSerialNumber || '', ''],
        ['PTZ Camera installed on the vehicle', '', installation?.ptzCameraInstalledOnVehicle || 'No'],
        ['NVR Model No', installation?.nvrModelNo || '', ''],
        ['NVR Installed', '', installation?.nvrInstalled || 'No'],
        ['Battery Serial No.', installation?.batterySerialNo || '', ''],
        ['Battery installed at Vehicle', '', installation?.batteryInstalledAtVehicle || 'No'],
        ['Backside LCD Installed', '', backsideLCDInstalledValue],
        ['GPS Device Serial No', installation?.gpsDeviceSerialNo || '', ''],
        ['GPS Device installed', '', installation?.gpsDeviceInstalled || 'No'],
        ['DC/AC Converter Installed', '', dcAcConverterInstalledValue],
        ['Internet 4G Router installed back site', '', installation?.internet4GRouterInstalledBackSite || 'No'],
        ['Router No.', installation?.internet4GRouterSimNo || '', ''],
        ['Electrical Power strip Installed', '', electricalPowerStripInstalledValue],
        ['Training to Driver & FST Incharge', '', trainingToDriverAndFSTMemberValue],
        ['Camera View Visible', '', installation?.successfulTestWebStreaming || 'No']
      ];

      equipment.forEach(([desc, serial, installed]) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        drawCell(margin, yPos, descWidth, rowHeight, desc);
        drawCell(margin + descWidth, yPos, serialWidth, rowHeight, serial);
        drawCell(margin + descWidth + serialWidth, yPos, installedWidth, rowHeight, installed);
        yPos += rowHeight;
      });

      yPos += 3;

      // Note section
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Note:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      const noteText = 'Henceforth, the equipment shall be in the custody of concerned Driver and Flying squad team Incharge. They shall ensure no damage is done to the equipment';
      const noteLines = pdf.splitTextToSize(noteText, pageWidth - 2 * margin - 10);
      pdf.text(noteLines, margin + 10, yPos);
      yPos += noteLines.length * 4 + 5;

      // Photos Section (if available)
      if (installation.vehiclePhotoUrl || installation.driverPhotoUrl || installation.serviceProviderPhotoUrl || installation.localScreenPhotoUrl) {
        pdf.addPage();
        yPos = 20;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Installation Photos', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        const imgSpacing = 10;
        const cellWidth = (pageWidth - 2 * margin - imgSpacing) / 2;
        const labelHeight = 8;
        const photoBoxHeight = 65;
        const rowSpacing = 10;

        let xPos = margin;
        let photoIndex = 0;

        // Helper to draw a photo cell
        const drawPhotoCell = async (label, url, x, y) => {
          // Draw label box
          pdf.setDrawColor(200);
          pdf.setFillColor(245, 245, 245);
          pdf.rect(x, y, cellWidth, labelHeight, 'FD');

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(50);
          pdf.text(label, x + cellWidth / 2, y + 5, { align: 'center' });

          // Draw image box
          pdf.setDrawColor(200);
          pdf.rect(x, y + labelHeight, cellWidth, photoBoxHeight);

          try {
            const { dataUrl: photoData } = await getImageData(url);
            const padding = 2;
            const drawWidth = cellWidth - 2 * padding;
            const drawHeight = photoBoxHeight - 2 * padding;
            pdf.addImage(photoData, 'JPEG', x + padding, y + labelHeight + padding, drawWidth, drawHeight, undefined, 'FAST');
          } catch (error) {
            console.error(`Error loading ${label}:`, error);
            pdf.setFontSize(8);
            pdf.text('Image not available', x + cellWidth / 2, y + labelHeight + photoBoxHeight / 2, { align: 'center' });
          }
        };

        const photos = [
          { url: installation.vehiclePhotoUrl, label: 'Vehicle with Driver Photo' },
          { url: installation.localScreenPhotoUrl, label: 'Local Screen Viewing' },
          { url: installation.streamScreenshotUrl, label: 'Portal Stream Screenshot' }
        ];

        for (const photo of photos) {
          if (photo.url) {
            if (yPos > pageHeight - labelHeight - photoBoxHeight - 20) {
              pdf.addPage();
              yPos = 20;
              xPos = margin;
              photoIndex = 0;
            }

            await drawPhotoCell(photo.label, photo.url, xPos, yPos);

            photoIndex++;
            if (photoIndex % 2 === 0) {
              yPos += labelHeight + photoBoxHeight + rowSpacing;
              xPos = margin;
            } else {
              xPos = margin + cellWidth + imgSpacing;
            }
          }
        }
        pdf.setTextColor(0); // Reset text color
      }

      const vehicleNoPart = sanitizeForFileName(installation?.vehicleNo, 'Vehicle');
      const acNamePart = sanitizeForFileName(installation?.acName, 'AC');
      const districtPart = sanitizeForFileName(installation?.districtName, 'District');
      const fileName = `${vehicleNoPart}-${acNamePart}-${districtPart}.pdf`;

      const isNative = window.Capacitor?.isNativePlatform?.();

      if (isNative) {
        const pdfOutput = pdf.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];

        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
          });

          toast({
            title: "PDF Saved Successfully",
            description: `File saved to Documents: ${fileName}`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error saving PDF:', error);
          toast({
            title: "Failed to Save PDF",
            description: error.message || "Please check app permissions and try again",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        pdf.save(fileName);
        toast({
          title: "PDF Downloaded",
          description: `${fileName} has been downloaded`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error Generating PDF",
        description: error.message || "An error occurred while generating the PDF",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader bg="blue.600" color="white">
          <Text textAlign="center">FSV Installation Report</Text>
          <Text textAlign="center" fontSize="md" fontWeight="normal">
            West Bengal Assembly Election 2026
          </Text>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody p={6}>
          {/* Vehicle & Driver Details */}
          <Box mb={6}>
            <Heading size="md" mb={4} color="blue.600">Vehicle & Installation Details</Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
              <GridItem><Text><strong>District Name:</strong> {installation.districtName}</Text></GridItem>
              <GridItem><Text><strong>AC Name:</strong> {installation.acName}</Text></GridItem>
              <GridItem><Text><strong>Vehicle No:</strong> {installation.vehicleNo}</Text></GridItem>
              <GridItem><Text><strong>Installation Date:</strong> {installation.installationDate}</Text></GridItem>
              <GridItem><Text><strong>Driver Name:</strong> {installation.driverName}</Text></GridItem>
              <GridItem><Text><strong>Installation Site:</strong> {installation.installationSiteAddress}</Text></GridItem>
              <GridItem><Text><strong>Driver Mobile:</strong> {installation.driverMobileNo}</Text></GridItem>
              <GridItem><Text><strong>Type of Vehicle:</strong> {installation.typeOfVehicle}</Text></GridItem>
              <GridItem><Text><strong>Is QRT vehicle?:</strong> {qrtVehicleValue}</Text></GridItem>
              <GridItem><Text><strong>Installer Name:</strong> {installation.installerName || 'N/A'}</Text></GridItem>
              <GridItem><Text><strong>Installer Mobile:</strong> {installation.installerMobile || installation.createdByMobile || 'N/A'}</Text></GridItem>
            </Grid>
          </Box>

          <Divider my={6} />

          {/* Equipment Details Table */}
          <Box mb={6}>
            <Heading size="md" mb={4} color="blue.600">Equipment Details</Heading>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Description</Th>
                  <Th>Serial No</Th>
                  <Th>Installed</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>PTZ Camera Model number</Td>
                  <Td>{installation.ptzCameraModelNumber}</Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td>PTZ Camera ID</Td>
                  <Td>{installation.ptzCameraSerialNumber}</Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td>PTZ Camera installed on the vehicle</Td>
                  <Td></Td>
                  <Td><Badge colorScheme={installation.ptzCameraInstalledOnVehicle === 'Yes' ? 'green' : 'red'}>{installation.ptzCameraInstalledOnVehicle}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>NVR Model No</Td>
                  <Td>{installation.nvrModelNo}</Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td>NVR Installed</Td>
                  <Td></Td>
                  <Td><Badge colorScheme={installation.nvrInstalled === 'Yes' ? 'green' : 'red'}>{installation.nvrInstalled}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>Battery Serial No.</Td>
                  <Td>{installation.batterySerialNo}</Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td>Battery installed at Vehicle</Td>
                  <Td></Td>
                  <Td><Badge colorScheme={installation.batteryInstalledAtVehicle === 'Yes' ? 'green' : 'red'}>{installation.batteryInstalledAtVehicle}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>GPS Device Serial No</Td>
                  <Td>{installation.gpsDeviceSerialNo}</Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td>GPS Device installed</Td>
                  <Td></Td>
                  <Td><Badge colorScheme={installation.gpsDeviceInstalled === 'Yes' ? 'green' : 'red'}>{installation.gpsDeviceInstalled}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>Backside LCD Installed</Td>
                  <Td></Td>
                  <Td><Badge colorScheme="green">{backsideLCDInstalledValue}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>DC/AC Converter Installed</Td>
                  <Td></Td>
                  <Td><Badge colorScheme="green">{dcAcConverterInstalledValue}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>Electrical Power strip Installed</Td>
                  <Td></Td>
                  <Td><Badge colorScheme="green">{electricalPowerStripInstalledValue}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>Training to Driver & FST Incharge</Td>
                  <Td></Td>
                  <Td><Badge colorScheme="green">{trainingToDriverAndFSTMemberValue}</Badge></Td>
                </Tr>
                <Tr>
                  <Td>Router No.</Td>
                  <Td>{installation.internet4GRouterSimNo}</Td>
                  <Td></Td>
                </Tr>
                <Tr>
                  <Td>Camera View Visible</Td>
                  <Td></Td>
                  <Td><Badge colorScheme={installation.successfulTestWebStreaming === 'Yes' ? 'green' : 'red'}>{installation.successfulTestWebStreaming}</Badge></Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>

          <Divider my={6} />

          {/* Installation Photos */}
          {(installation.vehiclePhotoUrl || installation.driverPhotoUrl || installation.serviceProviderPhotoUrl || installation.localScreenPhotoUrl || installation.streamScreenshotUrl) && (
            <Box mb={6}>
              <Heading size="md" mb={4} color="blue.600">Installation Photos</Heading>
              <SimpleGrid columns={{ base: 2, md: 2 }} spacing={4}>
                {installation.vehiclePhotoUrl && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Vehicle with Driver Photo</Text>
                    <Image src={installation.vehiclePhotoUrl} alt="Vehicle with Driver" borderRadius="md" boxShadow="md" />
                  </Box>
                )}
                {installation.localScreenPhotoUrl && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Local Screen Viewing</Text>
                    <Image src={installation.localScreenPhotoUrl} alt="Local Screen Viewing" borderRadius="md" boxShadow="md" />
                  </Box>
                )}
                {installation.streamScreenshotUrl && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Portal Stream Screenshot</Text>
                    <Image src={installation.streamScreenshotUrl} alt="Portal Stream Screenshot" borderRadius="md" boxShadow="md" />
                  </Box>
                )}
              </SimpleGrid>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="gray.200">
          <Button
            aria-label="Download PDF"
            bgGradient="linear(to-r, purple.500, blue.500)"
            color="white"
            _hover={{
              bgGradient: "linear(to-r, purple.600, blue.600)",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            _active={{
              transform: "translateY(0)",
              boxShadow: "md"
            }}
            onClick={generatePDF}
            isLoading={isGeneratingPdf}
            size="md"
            mr={3}
          >
            <FaDownload />
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InstallationListModal;
