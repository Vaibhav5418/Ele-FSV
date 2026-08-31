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
  Select,
  HStack,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { getCameraByDid, getUserInstallations, deleteFsvInstallation, getUsersInstallationReportFilters } from '../actions/userActions';
import InstallationListModal from './InstallationListModal';
import InstallationEditModal from './InstallationEditModal';
import withAuth from './withAuth';
import { FaEye, FaDownload, FaEdit, FaTrash } from 'react-icons/fa';
import { Filesystem, Directory } from '@capacitor/filesystem';
import VideoModal from './modal/VideoModal';
import { DISTRICT_DATA } from '../utils/districtData';

const MyInstallations = () => {
  const userRole = localStorage.getItem('role');
  const isMasterOrAdmin = userRole === 'master' || userRole === 'admin';

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
  const [selectedInstallationForEdit, setSelectedInstallationForEdit] = useState(null);
  const [selectedLiveInstallation, setSelectedLiveInstallation] = useState(null);
  const [liveStreamUrl, setLiveStreamUrl] = useState('');
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('vehicle');
  const [districtFilter, setDistrictFilter] = useState('');
  const [assemblyFilter, setAssemblyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qrtFilter, setQrtFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // running union of districts/assemblies seen across pages (for dropdowns)
  const allDistricts = Object.keys(DISTRICT_DATA);
  const allAssemblies = districtFilter ? DISTRICT_DATA[districtFilter] : [];

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();
  const {
    isOpen: isLiveOpen,
    onOpen: onLiveOpen,
    onClose: onLiveClose
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchInstallations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-apply filters with 400ms debounce when filter changes
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => fetchInstallations(true), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchType, districtFilter, assemblyFilter, statusFilter, qrtFilter]);

  // Re-fetch when page changes
  useEffect(() => {
    fetchInstallations(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Removed API call for filters, using static DISTRICT_DATA now
  const fetchInstallations = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const result = await getUserInstallations({
        page: currentPage,
        limit: itemsPerPage,
        searchQuery,
        searchType,
        districtFilter,
        assemblyFilter,
        statusFilter,
        qrtFilter
      });
      if (result.success) {
        setInstallations(result.data);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 1);
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

  const handleEdit = (installation) => {
    setSelectedInstallationForEdit(installation);
    onEditOpen();
  };

  const handleUpdateSuccess = (updatedInstallation) => {
    setInstallations(prev => prev.map(inst => inst._id === updatedInstallation._id ? { ...inst, ...updatedInstallation } : inst));
    if (selectedInstallation && selectedInstallation._id === updatedInstallation._id) {
        setSelectedInstallation({ ...selectedInstallation, ...updatedInstallation });
    }
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

  // Server now handles filtering — installations already contains only the current page
  const currentInstallations = installations;

  const districts = allDistricts;
  const assemblies = allAssemblies;

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

  const exportAllToPDF = async () => {
    if (currentInstallations.length === 0) {
      toast({
        title: 'No data',
        description: 'No installations to export on this page.',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    setIsExporting(true);
    const { default: jsPDF } = await import('jspdf');

    const sanitizeForFileName = (value, fallback) => {
      const cleaned = String(value || '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '');
      return cleaned || fallback;
    };

    const drawCell = (pdf, x, y, width, height, text, isBold = false) => {
      pdf.rect(x, y, width, height);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(9);
      const lines = pdf.splitTextToSize(text, width - 4);
      pdf.text(lines, x + 2, y + 5);
    };

    try {
      for (let i = 0; i < currentInstallations.length; i++) {
        const installation = currentInstallations[i];
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

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

        let yPos = 10;

        // VMukti Logo
        try {
          const logoUrl = '/vmlogo.png';
          const { dataUrl: logoData, width: naturalWidth, height: naturalHeight } = await getImageData(logoUrl);
          const logoWidth = 40;
          const logoHeight = (logoWidth * naturalHeight) / naturalWidth;
          const xPos = (pageWidth - logoWidth) / 2;
          pdf.addImage(logoData, 'PNG', xPos, yPos, logoWidth, logoHeight);
          yPos += logoHeight + 5;
        } catch (error) {
          yPos += 10;
        }

        // Titles
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('West Bengal Assembly Election 2026', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        pdf.text('INSTALLATION REPORT OF FLYING SQUAD VEHICLE', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Info Table
        const colWidth = (pageWidth - 2 * margin) / 2;
        const rowHeight = 8;
        
        drawCell(pdf, margin, yPos, colWidth, rowHeight, `District Name: ${installation.districtName || ''}`, true);
        drawCell(pdf, margin + colWidth, yPos, colWidth, rowHeight, `AC Name: ${installation.acName || ''}`, true);
        yPos += rowHeight;

        drawCell(pdf, margin, yPos, colWidth, rowHeight, `Vehicle No: ${installation.vehicleNo || ''}`, true);
        drawCell(pdf, margin + colWidth, yPos, colWidth, rowHeight, `Installation Date: ${installationDateText}`, true);
        yPos += rowHeight;

        drawCell(pdf, margin, yPos, colWidth, rowHeight, `Driver Name: ${installation.driverName || ''}`, true);
        drawCell(pdf, margin + colWidth, yPos, colWidth, rowHeight, `Installation Site & Address: ${installation.installationSiteAddress || ''}`, true);
        yPos += rowHeight;

        drawCell(pdf, margin, yPos, colWidth, rowHeight, `Driver Mobile No: ${installation.driverMobileNo || ''}`, true);
        drawCell(pdf, margin + colWidth, yPos, colWidth, rowHeight, `Type of Vehicle: ${installation.typeOfVehicle || ''}`, true);
        yPos += rowHeight;

        drawCell(pdf, margin, yPos, colWidth, rowHeight, `Installer Name: ${installation.installerName || ''}`, true);
        drawCell(pdf, margin + colWidth, yPos, colWidth, rowHeight, `Installer Mobile: ${installation.installerMobile || installation.createdByMobile || ''}`, true);
        yPos += rowHeight;

        drawCell(pdf, margin, yPos, pageWidth - 2 * margin, rowHeight, `Is QRT vehicle?: ${installation.isQrtVehicle || installation.isQRTVehicle || 'N/A'}`, true);
        yPos += rowHeight;

        drawCell(pdf, margin, yPos, pageWidth - 2 * margin, rowHeight, `Created At: ${createdAtText}`, true);
        yPos += rowHeight + 5;

        // Equipment Header
        const descW = (pageWidth - 2 * margin) * 0.5;
        const serialW = (pageWidth - 2 * margin) * 0.3;
        const instW = (pageWidth - 2 * margin) * 0.2;

        drawCell(pdf, margin, yPos, descW, rowHeight, 'DESCRIPTION', true);
        drawCell(pdf, margin + descW, yPos, serialW, rowHeight, 'SERIAL NO', true);
        drawCell(pdf, margin + descW + serialW, yPos, instW, rowHeight, 'INSTALLED YES/NO', true);
        yPos += rowHeight;

        const equipment = [
          ['PTZ Camera Model number', installation?.ptzCameraModelNumber || '', ''],
          ['PTZ Camera ID', installation?.ptzCameraSerialNumber || '', ''],
          ['PTZ Camera installed on the vehicle', '', installation?.ptzCameraInstalledOnVehicle || 'No'],
          ['NVR Model No', installation?.nvrModelNo || '', ''],
          ['NVR Installed', '', installation?.nvrInstalled || 'No'],
          ['Battery Serial No.', installation?.batterySerialNo || '', ''],
          ['Battery installed at Vehicle', '', installation?.batteryInstalledAtVehicle || 'No'],
          ['Backside LCD Installed', '', installation?.backsideLCDInstalled || 'No'],
          ['GPS Device Serial No', installation?.gpsDeviceSerialNo || '', ''],
          ['GPS Device installed', '', installation?.gpsDeviceInstalled || 'No'],
          ['DC/AC Converter Installed', '', installation?.dcAcConverterInstalled || 'No'],
          ['Internet 4G Router installed back site', '', installation?.internet4GRouterInstalledBackSite || 'No'],
          ['Router No.', installation?.internet4GRouterSimNo || '', ''],
          ['Electrical Power strip Installed', '', installation?.electricalPowerStripInstalled || 'No'],
          ['Training to Driver & FST Incharge', '', installation?.trainingToDriverAndFSTMember || 'No'],
          ['Camera View Visible', '', installation?.successfulTestWebStreaming || 'No']
        ];

        equipment.forEach(([desc, serial, inst]) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          drawCell(pdf, margin, yPos, descW, rowHeight, desc);
          drawCell(pdf, margin + descW, yPos, serialW, rowHeight, serial);
          drawCell(pdf, margin + descW + serialW, yPos, instW, rowHeight, inst);
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

        // Photos on same page if space, or next page
        yPos += 5;
        if (installation.vehiclePhotoUrl || installation.localScreenPhotoUrl || installation.streamScreenshotUrl) {
          pdf.addPage();
          yPos = 20;

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text('Installation Photos', pageWidth / 2, yPos, { align: 'center' });
          yPos += 10;

          const imgSpacing = 10;
          const cellWidth = (pageWidth - 2 * margin - imgSpacing) / 2;
          const labelHeight = 8;
          const photoBoxHeight = 65;
          const rowSpacing = 10;

          let xPos = margin;
          let photoIndex = 0;

          const photos = [
            { url: installation.vehiclePhotoUrl, label: 'Vehicle with Driver Photo' },
            { url: installation.localScreenPhotoUrl, label: 'Local Screen Viewing' },
            { url: installation.streamScreenshotUrl, label: 'Portal Stream Screenshot' }
          ].filter(p => p.url);

          for (const photo of photos) {
            if (yPos > pageHeight - labelHeight - photoBoxHeight - 20) {
              pdf.addPage();
              yPos = 20;
              xPos = margin;
              photoIndex = 0;
            }

            // Draw label box
            pdf.setDrawColor(200);
            pdf.setFillColor(245, 245, 245);
            pdf.rect(xPos, yPos, cellWidth, labelHeight, 'FD');

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(50);
            pdf.text(photo.label, xPos + cellWidth / 2, yPos + 5, { align: 'center' });

            // Draw image box
            pdf.setDrawColor(200);
            pdf.rect(xPos, yPos + labelHeight, cellWidth, photoBoxHeight);

            try {
              const { dataUrl: photoData } = await getImageData(photo.url);
              const padding = 2;
              const drawWidth = cellWidth - 2 * padding;
              const drawHeight = photoBoxHeight - 2 * padding;
              pdf.addImage(photoData, 'JPEG', xPos + padding, yPos + labelHeight + padding, drawWidth, drawHeight, undefined, 'FAST');
            } catch (error) {
              pdf.setFontSize(8);
              pdf.text('Image not available', xPos + cellWidth / 2, yPos + labelHeight + photoBoxHeight / 2, { align: 'center' });
            }

            photoIndex++;
            if (photoIndex % 2 === 0) {
              yPos += labelHeight + photoBoxHeight + rowSpacing;
              xPos = margin;
            } else {
              xPos = margin + cellWidth + imgSpacing;
            }
          }
        }

        const vnPart = sanitizeForFileName(installation.vehicleNo, 'Vehicle');
        const acPart = sanitizeForFileName(installation.acName, 'AC');
        const dPart = sanitizeForFileName(installation.districtName, 'District');
        const fileName = `${vnPart}-${acPart}-${dPart}.pdf`;

        const isNative = window.Capacitor?.isNativePlatform?.();

        if (isNative) {
          const pdfOutput = pdf.output('datauristring');
          const base64Data = pdfOutput.split(',')[1];

          try {
            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents,
            });
          } catch (error) {
            console.error('Error saving PDF:', error);
          }
        } else {
          pdf.save(fileName);
        }
        
        // Wait 600ms before next download trigger (if not last)
        if (i < currentInstallations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }

      toast({
        title: 'Success',
        description: `Exported ${currentInstallations.length} individual reports.`,
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsExporting(false);
    }
  };


  const handleDeleteClick = (installation) => {
    setDeleteTarget(installation);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const deletedId = deleteTarget._id;
      const vehicleNo = deleteTarget.vehicleNo;
      const result = await deleteFsvInstallation(deletedId);
      if (result.success) {
        toast({
          title: 'Deleted',
          description: `Installation for ${vehicleNo} has been deleted.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onDeleteClose();
        setDeleteTarget(null);
        // Optimistically remove from state immediately
        setInstallations(prev => prev.filter(inst => inst._id !== deletedId));
        setTotalCount(prev => Math.max(0, prev - 1));
        fetchInstallations(false); // refresh list silently in background
      } else {
        toast({
          title: 'Delete Failed',
          description: result.message || 'Something went wrong.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>My FSV Installations</Heading>
      <Box
        mb={5}
        p={{ base: 3, md: 5 }}
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        boxShadow="sm"
      >
        <Stack spacing={4}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box flex="2" maxW={{ base: 'full', md: isMasterOrAdmin ? 'none' : '400px' }}>
              <Text mb={2} fontWeight="bold" fontSize="xs" color="gray.600">Search By</Text>
              <RadioGroup
                onChange={(value) => {
                  setSearchType(value);
                  setSearchQuery('');
                }}
                value={searchType}
                mb={2}
              >
                <HStack spacing={6}>
                  <Radio value="vehicle" colorScheme="blue" size="sm">Vehicle No</Radio>
                  <Radio value="camera" colorScheme="blue" size="sm">Camera ID</Radio>
                </HStack>
              </RadioGroup>
              <Input
                placeholder={searchType === 'camera' ? 'Search by Camera ID...' : 'Search by Vehicle No...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="gray.50"
                borderColor="gray.200"
                _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
              />
            </Box>

            {isMasterOrAdmin && (
              <>
                <Box flex="1">
                  <Text mb={2} fontWeight="bold" fontSize="xs" color="gray.600">District</Text>
                  <Select 
                    placeholder="All Districts" 
                    value={districtFilter} 
                    onChange={(e) => {
                      setDistrictFilter(e.target.value);
                      setAssemblyFilter('');
                    }}
                    bg="gray.50"
                  >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Box>

                <Box flex="1">
                  <Text mb={2} fontWeight="bold" fontSize="xs" color="gray.600">Assembly</Text>
                  <Select 
                    placeholder="All Assemblies" 
                    value={assemblyFilter} 
                    onChange={(e) => setAssemblyFilter(e.target.value)}
                    bg="gray.50"
                    isDisabled={!districtFilter}
                  >
                    {assemblies.map(a => <option key={a} value={a}>{a}</option>)}
                  </Select>
                </Box>

                <Box flex="1">
                  <Text mb={2} fontWeight="bold" fontSize="xs" color="gray.600">Status</Text>
                  <Select 
                    placeholder="All Status" 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    bg="gray.50"
                    borderColor="gray.200"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </Select>
                </Box>

                <Box flex="1">
                  <Text mb={2} fontWeight="bold" fontSize="xs" color="gray.600">Is QRT?</Text>
                  <Select 
                    placeholder="Is QRT?" 
                    value={qrtFilter}
                    onChange={(e) => setQrtFilter(e.target.value)}
                    bg="gray.50"
                    borderColor="gray.200"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Box>
              </>
            )}
          </Flex>

          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color="gray.500">
              Found <strong>{totalCount}</strong> installations
            </Text>
            <HStack spacing={2}>
              {isMasterOrAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setDistrictFilter('');
                    setAssemblyFilter('');
                    setStatusFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
              {isMasterOrAdmin && (
                <Button
                  colorScheme="red"
                  size="sm"
                  leftIcon={isExporting ? <Spinner size="xs" /> : <FaDownload />}
                  onClick={exportAllToPDF}
                  isLoading={isExporting}
                  loadingText="Exporting..."
                >
                  Export PDF
                </Button>
              )}
            </HStack>
          </Flex>
        </Stack>
      </Box>

      {isLoading ? (
        <Text>Loading...</Text>
      ) : totalCount > 0 ? (
        <>
          {isMobile ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {currentInstallations.map((installation) => (
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
                      <Text color="gray.500">District / AC</Text>
                      <Text fontWeight="medium" isTruncated>{installation.districtName} / {installation.acName}</Text>
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
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEdit(installation)}
                    >
                      Edit
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
                    {isMasterOrAdmin && (
                      <IconButton
                        aria-label="Delete installation"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleDeleteClick(installation)}
                      />
                    )}
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
                  <Th>AC Name</Th>
                  <Th>Driver Name</Th>
                  <Th>Camera ID</Th>
                  <Th>Submitted Date & Time</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentInstallations.map((installation) => (
                  <Tr key={installation._id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="medium">{installation.vehicleNo}</Td>
                    <Td>{installation.districtName}</Td>
                    <Td>{installation.acName}</Td>
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
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleEdit(installation)}
                        >
                          Edit
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
                        {isMasterOrAdmin && (
                          <IconButton
                            aria-label="Delete installation"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteClick(installation)}
                          />
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box mt={6} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
                <Text fontSize="sm" color="gray.500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    isDisabled={currentPage === 1 || isLoading}
                  >
                    ← Previous
                  </Button>
                  <Text fontSize="sm" fontWeight="medium" mx={2}>
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    isDisabled={currentPage === totalPages || isLoading}
                  >
                    Next →
                  </Button>
                </HStack>
              </Box>
            )}
          </>
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

      <InstallationEditModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        installation={selectedInstallationForEdit}
        onUpdateSuccess={handleUpdateSuccess}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.600">🗑️ Delete Installation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>
              Are you sure you want to delete the installation for:
            </Text>
            <Box bg="red.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="red.400">
              <Text fontWeight="bold" fontSize="lg">{deleteTarget?.vehicleNo}</Text>
              <Text fontSize="sm" color="gray.600">{deleteTarget?.districtName} — {deleteTarget?.acName}</Text>
              <Text fontSize="sm" color="gray.600">Driver: {deleteTarget?.driverName}</Text>
            </Box>
            <Text mt={3} fontSize="sm" color="red.500" fontWeight="medium">
              ⚠️ This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="outline" onClick={onDeleteClose} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              loadingText="Deleting..."
            >
              Yes, Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default withAuth(MyInstallations);
