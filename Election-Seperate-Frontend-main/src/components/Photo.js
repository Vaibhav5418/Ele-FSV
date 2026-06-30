import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Container, 
    Heading, 
    Select, 
    Input, 
    Table, 
    Thead, 
    Tbody, 
    Tr, 
    Th, 
    Td, 
    Image, 
    useToast, 
    Flex, 
    Text, 
    HStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton
} from '@chakra-ui/react';
import { getAllFsvReports } from '../actions/userActions';
import withAuth from './withAuth';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';

// Helper function to clean image URLs from query strings (like Azure SAS tokens)
const cleanImageUrl = (url) => {
    if (!url) return '';
    const lowercaseUrl = url.toLowerCase();
    const extensions = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
    for (const ext of extensions) {
        const index = lowercaseUrl.indexOf(ext);
        if (index !== -1) {
            return url.substring(0, index + ext.length);
        }
    }
    return url.split('?')[0];
};

// Helper function to gather all available images for a vehicle report
const getAvailableImages = (item) => {
    const images = [];
    if (item.vehiclePhotoUrl) images.push({ url: cleanImageUrl(item.vehiclePhotoUrl), label: 'Vehicle' });
    if (item.driverPhotoUrl) images.push({ url: cleanImageUrl(item.driverPhotoUrl), label: 'Driver' });
    if (item.fstMemberPhotoUrl) images.push({ url: cleanImageUrl(item.fstMemberPhotoUrl), label: 'FST Member' });
    if (item.serviceProviderPhotoUrl) images.push({ url: cleanImageUrl(item.serviceProviderPhotoUrl), label: 'Service Provider' });
    if (item.pilPhotoUrl) images.push({ url: cleanImageUrl(item.pilPhotoUrl), label: 'PIL' });
    if (item.localScreenPhotoUrl) images.push({ url: cleanImageUrl(item.localScreenPhotoUrl), label: 'Local Screen' });
    if (item.streamScreenshotUrl) images.push({ url: cleanImageUrl(item.streamScreenshotUrl), label: 'Portal Screen' });
    return images;
};

const Photo = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getAllFsvReports();
            if (response && response.success) {
                // Keep records that have at least one photo/screenshot
                const withPhotos = (response.data || []).filter(item => 
                    item.vehiclePhotoUrl || 
                    item.driverPhotoUrl || 
                    item.fstMemberPhotoUrl || 
                    item.serviceProviderPhotoUrl || 
                    item.pilPhotoUrl || 
                    item.localScreenPhotoUrl || 
                    item.streamScreenshotUrl
                );
                setData(withPhotos);
                setFilteredData(withPhotos);
            } else {
                toast({ title: 'Error fetching data', status: 'error' });
            }
        } catch (error) {
            toast({ title: 'Error fetching data', status: 'error' });
        }
        setLoading(false);
    };

    useEffect(() => {
        let result = data;

        if (startDate) {
            result = result.filter(item => {
                const date = item.installationDate || item.createdAt;
                return date && date.split('T')[0] >= startDate;
            });
        }
        if (endDate) {
            result = result.filter(item => {
                const date = item.installationDate || item.createdAt;
                return date && date.split('T')[0] <= endDate;
            });
        }
        if (districtSearch) {
            result = result.filter(item => (item.districtName || '').toLowerCase() === districtSearch.toLowerCase());
        }

        setFilteredData(result);
    }, [startDate, endDate, districtSearch, data]);

    const handleDownload = async () => {
        if (filteredData.length === 0) {
            toast({ title: "No photos to download", status: "warning" });
            return;
        }

        setDownloading(true);
        toast({ title: "Downloading photos... This may take a while.", status: "info", duration: 5000 });

        try {
            const zip = new JSZip();
            const grouped = {};
            
            // Group by date
            filteredData.forEach(item => {
                const d = item.installationDate || item.createdAt;
                const dateStr = d ? d.split('T')[0] : 'UnknownDate';
                if (!grouped[dateStr]) grouped[dateStr] = [];
                grouped[dateStr].push(item);
            });

            for (const [date, items] of Object.entries(grouped)) {
                const folder = zip.folder(date);
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const imgs = getAvailableImages(item);
                    
                    for (const img of imgs) {
                        try {
                            const response = await axios.get(img.url, { responseType: 'blob' });
                            
                            // Extract extension from clean URL
                            let ext = 'jpg';
                            const urlParts = img.url.split('.');
                            if(urlParts.length > 1) {
                                const lastPart = urlParts.pop();
                                if(lastPart.length <= 4) ext = lastPart.split('?')[0];
                            }
                            
                            // Descriptive filename: VehicleNo_CameraID_Label.ext
                            const labelSanitized = img.label.toLowerCase().replace(/\s+/g, '_');
                            const fileName = `${item.vehicleNo || 'Unknown'}_${item.ptzCameraSerialNumber || 'Unknown'}_${labelSanitized}.${ext}`;
                            
                            folder.file(fileName, response.data);
                        } catch (e) {
                            console.error("Failed to load image", img.url, e);
                        }
                    }
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'Vehicle_Photos.zip');
            toast({ title: "Download complete", status: "success" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error creating zip. Note: Make sure CORS is allowed to download images.", status: "error" });
        }
        setDownloading(false);
    };

    const uniqueDistricts = Array.from(new Set(data.map(item => item.districtName).filter(Boolean))).sort();

    return (
        <Container maxW="container.xl" mt={8} mb={20}>
            <Heading size="lg" mb={6}>Vehicle Photos</Heading>
            
            <Box mb={6} p={6} bg="white" boxShadow="md" borderRadius="xl">
                <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
                    <Box flex="1">
                        <Text mb={2} fontWeight="bold" fontSize="sm">Start Date</Text>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </Box>
                    <Box flex="1">
                        <Text mb={2} fontWeight="bold" fontSize="sm">End Date</Text>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </Box>
                    <Box flex="1">
                        <Text mb={2} fontWeight="bold" fontSize="sm">District</Text>
                        <Select
                            placeholder="All Districts"
                            value={districtSearch}
                            onChange={(e) => setDistrictSearch(e.target.value)}
                        >
                            {uniqueDistricts.map((d, i) => <option key={i} value={d}>{d}</option>)}
                        </Select>
                    </Box>
                </Flex>
                
                <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Total Records: {filteredData.length}</Text>
                    <HStack>
                        <Button colorScheme="blue" onClick={fetchData} isLoading={loading}>Refresh Data</Button>
                        <Button colorScheme="green" onClick={handleDownload} isLoading={downloading}>Download Photos</Button>
                    </HStack>
                </Flex>
            </Box>

            <Box bg="white" borderRadius="xl" boxShadow="md" overflowX="auto" p={4}>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Date</Th>
                            <Th>Vehicle No</Th>
                            <Th>Camera ID</Th>
                            <Th>Photos</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredData.map((item, idx) => {
                            const date = item.installationDate || item.createdAt;
                            const displayDate = date ? date.split('T')[0] : 'N/A';
                            const availableImages = getAvailableImages(item);
                            return (
                                <Tr key={idx}>
                                    <Td>{displayDate}</Td>
                                    <Td>{item.vehicleNo || 'N/A'}</Td>
                                    <Td>{item.ptzCameraSerialNumber || 'N/A'}</Td>
                                    <Td>
                                        {availableImages.length > 0 ? (
                                            <HStack spacing={4} wrap="wrap">
                                                {availableImages.map((img, i) => (
                                                    <Box 
                                                        key={i} 
                                                        textAlign="center" 
                                                        cursor="pointer" 
                                                        onClick={() => setPreviewImage(img)}
                                                    >
                                                        <Image 
                                                            src={img.url} 
                                                            boxSize="70px" 
                                                            objectFit="cover" 
                                                            borderRadius="md" 
                                                            border="1px solid"
                                                            borderColor="gray.200"
                                                            _hover={{ transform: 'scale(1.05)', transition: '0.2s', boxShadow: 'md' }}
                                                        />
                                                        <Text fontSize="10px" color="gray.500" mt={1} maxW="70px" isTruncated>
                                                            {img.label}
                                                        </Text>
                                                    </Box>
                                                ))}
                                            </HStack>
                                        ) : (
                                            'No Photos'
                                        )}
                                    </Td>
                                </Tr>
                            );
                        })}
                        {filteredData.length === 0 && (
                            <Tr>
                                <Td colSpan={4} textAlign="center" py={4}>No photos found.</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>

            {previewImage && (
                <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} size="xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>{previewImage.label}</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6} display="flex" justifyContent="center" alignItems="center">
                            <Image src={previewImage.url} maxH="500px" objectFit="contain" borderRadius="md" />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </Container>
    );
};

export default withAuth(Photo);
