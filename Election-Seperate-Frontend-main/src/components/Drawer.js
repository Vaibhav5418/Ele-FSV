import React, { useState } from 'react';
import { Button, Drawer, DrawerBody, DrawerCloseButton, IconButton, Menu, MenuButton, MenuItem, MenuList, useBreakpointValue, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { MdAccountCircle, MdAdd, MdBuild, MdDashboard, MdTableRows } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import logo1 from './images/logo/logo1.png';

const DrawerButton = ({ drawerContent }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const role = localStorage.getItem('role');

    console.log('Current user role:', role); // Debug log

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const navigate = useNavigate();

    const handleRedirect = (path) => {
        navigate(path);
        toggleDrawer();
    };

    const location = useLocation();

    const fontSize = useBreakpointValue({ base: '0.5rem', md: 'large', lg: 'xx-large' });

    // Define menu items based on the user's role
    let menuItems = [];

    if (role === "admin") {
        menuItems.push(
            { path: "/head", label: "District Manager", icon: MdAccountCircle },
            { path: "/installer", label: "Installer", icon: MdBuild },
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild },
            { path: "/eleuser", label: "User Analytics", icon: MdBuild },
            { path: "/master-dashboard", label: "Master Dashboard", icon: MdDashboard },
            { path: "/installation-report", label: "Download Report", icon: MdTableRows },
            { path: "/users-installation-report", label: "Users Installation Report", icon: MdTableRows },
        );
    } else if (role === "master") {
        menuItems.push(
            { path: "/master-dashboard", label: "Dashboard", icon: MdDashboard },
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild },
            { path: "/my-installations", label: "My Installations", icon: MdTableRows },
            { path: "/installation-report", label: "Download Report", icon: MdTableRows },
            { path: "/users-installation-report", label: "Users Installation Report", icon: MdTableRows },
        );
    } else if (role === "district") {
        menuItems.push(
            { path: "/head", label: "District Manager", icon: MdAccountCircle },
            { path: "/installer", label: "Installer", icon: MdBuild },
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild },
            { path: "/installation-report", label: "Download Report", icon: MdTableRows },
        );
    } else if (role === "installer" || role === "autoinstaller") {
        menuItems.push(
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild },
            { path: "/my-installations", label: "My Installations", icon: MdTableRows },
            { path: "/installation-report", label: "Download Report", icon: MdTableRows },
        );
    } else {
        // Fallback for other roles
        menuItems.push(
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild },
            { path: "/my-installations", label: "My Installations", icon: MdTableRows },
            { path: "/installation-report", label: "Download Report", icon: MdTableRows },
        );
    }

    return (
        <>
            {location.pathname === '/eci' || location.pathname === '/' ? (
                <div>
                    <Menu>
                        <MenuButton fontSize={fontSize} as={IconButton} aria-label="Profile" backgroundColor='#fff'><img width='80%' src={logo1} /></MenuButton>
                        <MenuList>
                            {/* Display name and mobile */}
                            <MenuItem>
                                <Button variant="outline"><img width='10%' src={logo1} />VMUKTI ELECTION APP</Button> {/* Add your button here */}
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </div>
            ) : (
                <div>
                    <Button onClick={toggleDrawer} zIndex="999" variant="ghost">
                        <MdTableRows size={24} />
                    </Button>
                    <Drawer placement="left" onClose={toggleDrawer} isOpen={isDrawerOpen} size="xs">
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader borderBottomWidth="1px" display='flex' alignItems="center">
                                <img style={{ objectFit: 'contain' }} width='30px' src='./logo.png' alt="logo" />
                                <Text ml={3} fontSize="lg" fontWeight="bold">VMUKTI - ELE</Text>
                            </DrawerHeader>
                            <DrawerBody py={6}>
                                <VStack spacing={2} align="stretch">
                                    {menuItems.map((item, index) => (
                                        <Flex
                                            key={index}
                                            onClick={() => handleRedirect(item.path)}
                                            p={3}
                                            borderRadius="md"
                                            cursor="pointer"
                                            _hover={{ bg: "blue.50", color: "blue.600" }}
                                            align="center"
                                            transition="all 0.2s"
                                        >
                                            <Icon as={item.icon} boxSize={5} mr={4} color="gray.500" />
                                            <Text fontWeight="medium" color="gray.700">{item.label}</Text>
                                        </Flex>
                                    ))}
                                </VStack>
                            </DrawerBody>
                            <DrawerFooter borderTopWidth="1px">
                                <Text fontSize="xs" color="gray.400">© 2025 VMukti Solutions</Text>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                </div>
            )}
        </>
    );
};

export default DrawerButton;