import {
    Box,
    Button,
    Container,
    Flex,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Stack,
    Table,
    TableCaption,
    TableContainer,
    Tbody,
    Td,
    Text,
    Tfoot,
    Th,
    Thead,
    Tr,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { getBiharReportUser, getDashboardDetails, getbiharUserData } from '../actions/userActions';

const BiharUsers = () => {

    const { state } = useParams();

    const [biharUserData, setBiharUserData] = useState([]);
    const [totalCameras, setTotalCameras] = useState([]);
    const [installedCameras, setInstalledCameras] = useState([]);
    const [liveCameras, setLiveCameras] = useState([]);
    const [offlineCameras, setOfflineCameras] = useState([]);
    const dashboard = async () => {   // currentPage in () after async
        //   currentPage = null ? 1 : currentPage;
        try {
            const mobile = localStorage.getItem('mobile');
            console.log("setState", state)
            const result = await getBiharReportUser(state);
            // console.log("sureshot",result)
            console.log("result", result)
            setTotalCameras(result.data[0].total_count);
            setBiharUserData(result.data[0].data);
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
        dashboard();   //currentPage
    }, []);

    // Fetch data specific to the selected state or use the state parameter as needed

    return (
        <div>
            <h1>{state} Dashboard</h1>
            {/* <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(6, 1fr)' }} gridGap="2">
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


            </Box> */}

            <Box borderWidth="1px" borderRadius="lg" p="4" display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(1, 1fr)' }} gridGap="2" mt={8}>

                {/* {totalCameras.map((state, index) => ( */}
                    {/* // <Box key={index} biharUserData={state}>{state.state}</Box> */}
                    <Box borderWidth="1px" borderRadius="lg" display='flex' flexWrap='wrap' flexDirection='column' alignItems='center' justifyContent='center'>
                        {/* <Text fontWeight="bold" mb="2">{state.state}</Text> */}
                        {/* <Link to={`/state/${state.state}/${state.district}`}> */}
                        <Text fontWeight="bold" cursor="pointer">Total Users</Text>
                        {/* </Link> */}
                        {/* <Box display='flex' w='100%' alignItems='center' justifyContent='center'> */}
                            <Box bg='rgba(35,106,141,0.8)' p={1} m={1} w='full' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {totalCameras}
                            </Box>
                            {/* <Box bg='#db7a39' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.installedCameras}
                            </Box>
                            <Box bg='#68B187' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalLiveCamera}
                            </Box>
                            <Box bg='#D54D4D' p={1} m={1} w='20%' color='white' display='flex' alignItems='center' justifyContent='center'>
                                {state.totalOfflineCamera}
                            </Box> */}
                        {/* </Box> */}
                    </Box>
                {/* ))} */}
            </Box>
            <TableContainer w={'full'}>
                <Table id="data-table" variant='striped' colorScheme='teal' borderWidth="1px" borderColor="gray.200">
                    <TableCaption>Your Installed Camera List</TableCaption>
                    <Thead>
                        <Tr>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Sr.No.</Th>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Name</Th>
                            {/* bgColor="blue.800" <Th borderRight="1px" borderColor="gray.300" bgColor='black' color='white'>live</Th> */}
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Mobile</Th>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Lat</Th>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Long</Th>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Formatted_Address</Th>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Date</Th>
                            <Th bgColor="blue.800" borderRight="1px" borderColor="gray.300" color='white'>Time</Th>

                        </Tr>
                    </Thead>
                    <Tbody>
                        {biharUserData.map((camera, index) => (
                            <Tr key={camera.id} bg={index % 2 === 0 ? 'gray.100' : 'white'}>
                                <Td borderRight="1px" borderColor="gray.300">{index + 1}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.name}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.mobile}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.latitude}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.longitude}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.formatted_address}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.date}</Td>
                                <Td borderRight="1px" borderColor="gray.300">{camera.time}</Td>
                            </Tr>
                        ))}

                    </Tbody>

                </Table>
                {/* <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
                    {currentPage}/{totalPages}
                    <Button onClick={handlePrevClick} hidden={currentPage === 1}>
                        Previous
                    </Button>
                    <Button onClick={handleNextClick} hidden={currentPage === totalPages}>
                        Next
                    </Button>
                </Box> */}
            </TableContainer>
            {/* Display dynamic content based on the selected state */}
        </div>
    );
};

export default BiharUsers;
