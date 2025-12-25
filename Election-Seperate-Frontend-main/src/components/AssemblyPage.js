import { Box, Button, Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { getAssemblyData, getCameraByLocation, getDashboardDetails, getDistrictData, getStateData } from '../actions/userActions';
import ReactPlayer from 'react-player';
import { LuFlipVertical2 } from 'react-icons/lu';

const AssemblyPage = () => {

    const { state, district, assemblyName } = useParams();

    const [stateData, setStateData] = useState([]);
    const [totalCameras, setTotalCameras] = useState([]);
    const [installedCameras, setInstalledCameras] = useState([]);
    const [liveCameras, setLiveCameras] = useState([]);
    const [offlineCameras, setOfflineCameras] = useState([]);
    const dashboard = async () => {   // currentPage in () after async
        //   currentPage = null ? 1 : currentPage;
        try {
            const mobile = localStorage.getItem('mobile');
            const result = await getAssemblyData(state, district, assemblyName);
            // console.log("sureshot",result)
            console.log("result", result)
            // console.log("result state district", state/district);
            setTotalCameras(result.data.totalCameras);
            setInstalledCameras(result.data.installedCameras);
            setLiveCameras(result.data.totalLiveCamera);
            setOfflineCameras(result.data.totalOfflineCamera);
            setStateData(result.data.dataByAssembly);
            console.log("setState", result.data.dataByAssembly);
            // setTotalPages(result.pagination.totalPages)

        } catch (error) {
            toast.warning('This is a warning message.');
            // Handle error
            // alert("rekjha");
        }
        finally {

        }
    };

    useEffect(() => {
        console.log("Calling dashboard...");
        dashboard();   //currentPage
    }, []);

    const handleCloseModal = () => {
        setShowModal(false);
    };
    const [showModal, setShowModal] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const handleDetails = async (location) => {
        try {
            const mobile = localStorage.getItem('mobile');
            const result = await getCameraByLocation(location);
            // console.log("sureshot",result)
            console.log("result", result)
            setSelectedCamera(result.data[0]);
            setShowModal(true);
            // console.log("result state district", state/district);
            // setTotalCameras(result.data.totalCameras);
            // setInstalledCameras(result.data.installedCameras);
            // setLiveCameras(result.data.totalLiveCamera);
            // setOfflineCameras(result.data.totalOfflineCamera);
            // setStateData(result.data.dataByAssembly);
            // console.log("setState", result.data.dataByAssembly);
            // setTotalPages(result.pagination.totalPages)

        } catch (error) {
            toast.warning('This is a warning message.');
            // Handle error
            // alert("rekjha");
        }
        finally {

        }
    }

    // Fetch data specific to the selected state or use the state parameter as needed

    return (
        <div>
            <h1>{state}&nbsp;{district}&nbsp;{assemblyName} Dashboard</h1>
            <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(6, 1fr)' }} gridGap="2">
                <Box></Box>
                <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
                    <Text fontWeight="bold" mb="2">Total</Text>
                    <Box bg='rgba(35,106,141,0.8)' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
                        {totalCameras}
                    </Box>
                </Box>


                <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
                    <Text fontWeight="bold" mb="2">Installed</Text>
                    <Box bg='#db7a39' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
                        {installedCameras}
                    </Box>
                </Box>

                <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
                    <Text fontWeight="bold" mb="2">Live</Text>
                    <Box bg='#68B187' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
                        {liveCameras}
                    </Box>
                </Box>

                <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
                    <Text fontWeight="bold" mb="2">Offline</Text>
                    <Box bg='#D54D4D' w='100%' p={2} color='white' display='flex' alignItems='center' justifyContent='center'>
                        {offlineCameras}
                    </Box>
                </Box>

                <Box ></Box>


            </Box>

            <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gridGap="2" mt={8}>

                {stateData.map((state, index) => (
                    // <Box key={index} stateData={state}>{state.state}</Box>
                    <Box p={2} borderWidth="1px" borderRadius="lg" key={index} display='flex' flexWrap='wrap' flexDirection='column' alignItems='center' justifyContent='center'>
                        {/* <Text fontWeight="bold" mb="2">{state.state}</Text> */}
                        {/* <Link to={`/state/${state.state}`}> */}
                        <Text textAlign='center' display='flex' fontWeight="bold" cursor="pointer">{state.location}</Text>
                        {/* </Link> */}
                        <Box display='flex' w='100%' alignItems='center' justifyContent='center'>
                            <Box bg='rgba(35,106,141,0.8)' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalCameras}
                            </Box>
                            <Box bg='#db7a39' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.installedCameras}
                            </Box>
                            <Box bg='#68B187' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalLiveCamera}
                            </Box>
                            <Box bg='#D54D4D' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalOfflineCamera}
                            </Box>
                        </Box>
                        <Button onClick={() => handleDetails(state.location)}>View</Button>
                    </Box>
                ))}
            </Box>

            <Modal isOpen={showModal} onClose={handleCloseModal}>
                <ModalOverlay />
                <ModalContent>
                    {/* <ModalHeader>View Camera</ModalHeader> */}
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedCamera && (
                            <>
                                <ModalHeader>{selectedCamera.deviceId}</ModalHeader>
                                <ReactPlayer
                                    url={selectedCamera.flvUrl}
                                    playing={true}
                                    controls={true}
                                    width="100%"
                                    height="400px"
                                />
                                {/* <Flex justifyContent="space-between" mt={4} mb={4}>
                       <Button colorScheme="blue" mt={4} onClick={() => handleGetData(selectedCamera.deviceId, 'flip')}>
                         Flip &nbsp;<LuFlipVertical2 />
                       </Button>
                       <Button colorScheme="blue" mt={4} onClick={() => handleGetData(selectedCamera.deviceId, 'mirror')}>
                         Mirror &nbsp;<LuFlipHorizontal2 />
                       </Button>
                     </Flex> */}
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleCloseModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* Display dynamic content based on the selected state */}
        </div>
    );
};

export default AssemblyPage;
