import React, { useState } from 'react';
import { Button, Drawer, DrawerBody, DrawerCloseButton, IconButton, Menu, MenuButton, MenuItem, MenuList, useBreakpointValue, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { MdAccountCircle, MdAdd, MdBuild, MdDashboard, MdTableRows } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import logo1 from './images/logo/logo1.png';

const DrawerButton = ({ drawerContent }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const role = localStorage.getItem('role');

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
    let menuItems = [
        // { path: "/dashboard", label: "Dashboard", icon: MdDashboard },
    ];

    if (role === "admin") {
        menuItems.push(
            { path: "/dashboard", label: "Dashboard", icon: MdDashboard },
            { path: "/head", label: "District Manager", icon: MdAccountCircle },
            { path: "/installer", label: "Installer", icon: MdBuild },
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild },
            { path: "/eleuser", label: "User Analytics", icon: MdBuild },
        );
    } else if (role === "district") {
        menuItems.push(
            { path: "/head", label: "District Manager", icon: MdAccountCircle },
            { path: "/installer", label: "Installer", icon: MdBuild },
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild }
        );
    } else if (role === "installer") {
        menuItems.push(
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild }
        );
    } else if (role === "autoinstaller") {
        menuItems.push(
            { path: "/autoinstaller", label: "Auto Installer", icon: MdBuild }
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
                    <Button onClick={toggleDrawer} zIndex="999">
                        <MdTableRows />
                    </Button>
                    <Drawer placement="left" onClose={toggleDrawer} isOpen={isDrawerOpen}>
                        <DrawerOverlay>
                            <DrawerContent>
                                <DrawerCloseButton />
                                <DrawerHeader display='flex'><img style={{ objectFit: 'contain' }} width='8%' src='./logo.png'></img>   VMUKTI - ELE</DrawerHeader>
                                <DrawerBody>
                                    <VStack spacing={4} align="start">
                                        {menuItems.map((item, index) => (
                                            <Text key={index} onClick={() => handleRedirect(item.path)} display='flex' justifyContent='center' alignItems='center' cursor='pointer'>
                                                <Icon as={item.icon} boxSize={5} color="gray.500" /> 
                                                {item.label}
                                            </Text>
                                        ))}
                                    </VStack>
                                </DrawerBody>
                                <DrawerFooter>
                                    {/* Footer content goes here */}
                                </DrawerFooter>
                            </DrawerContent>
                        </DrawerOverlay>
                    </Drawer>
                </div>
            )}
        </>
    );
};

export default DrawerButton;