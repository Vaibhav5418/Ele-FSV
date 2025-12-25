# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


<!-- FOR MY INFO -->

useEffect(() => {
    const initMap = () => {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5
      });

      cameraa.forEach(point => {
        const latitude = parseFloat(point.latitude);
        const longitude = parseFloat(point.longitude);
        const position = { lat: latitude, lng: longitude };

        const markerIcon = {
          url: point.status === 'RUNNING' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32) // Adjust the size as needed
        };

        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          icon: markerIcon
        });

        // Add click event listener to the marker
        marker.addListener('click', function () {
          console.log('Marker status:', openModal(point.deviceId, point.flvUrl, point.status));
        });

        marker.addListener('mouseover', function () {
          handleMarkerMouseOver(point.deviceId);
          console.log('Hovered over marker with deviceId:', point.deviceId);
        });

        // Add mouseout event listener to the marker
        marker.addListener('mouseout', function () {
          handleMarkerMouseOut()
          console.log('Mouseout of marker with deviceId:', point.deviceId);
        });

      });
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Google Maps API script not loaded yet
      // Load it dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBNBVfpAQqikexY-8J0QDyBR4bWKiKe&callback=initMap`;
      script.defer = true;
      script.async = true;

      script.onerror = () => {
        console.error('Error loading Google Maps API script');
        // Handle the error, e.g., display a message to the user
      };
      document.head.appendChild(script);
      // window.initMap = initMap;
    }
  }, [cameraa]);,



  <!-- changed drawer code -->

  import React, { useState } from 'react';
import { Button, Drawer, DrawerBody, DrawerCloseButton, IconButton, Menu, MenuButton, MenuItem, MenuList, useBreakpointValue, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { MdAccountCircle, MdAdd, MdBuild, MdDashboard, MdTableRows } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import logo1 from './images/logo/logo1.png';

const DrawerButton = ({ drawerContent }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const navigate = useNavigate();

  const handleRedirect = (path) => {
    navigate(path);
    toggleDrawer();
    // onClose(); // Close the drawer after redirection
  };

  const location = useLocation();

  const fontSize = useBreakpointValue({ base: '0.5rem', md: 'large', lg: 'xx-large' });

    return (
        <>

            {/* Button for opening the drawer */}
            {location.pathname === '/eci' || location.pathname === '/' ? 
            <div>
            {/* <Button  variant=""><img width='100%' src={logo1} /></Button> */}

            <Menu>
              <MenuButton fontSize={fontSize} as={IconButton} aria-label="Profile" backgroundColor='#fff'><img width='80%' src={logo1} /></MenuButton>
              <MenuList>
                  {/* Display name and mobile */}
                  <MenuItem>
                  <Button  variant="outline"><img width='10%' src={logo1} />VMUKTI ELECTION APP</Button> {/* Add your button here */}
                  </MenuItem>
              </MenuList>
            </Menu>
            </div>
             :
            <div>
            <Button onClick={toggleDrawer} zIndex="999"> {/* position="fixed" top="4" left="4" */}
                <MdTableRows />
            </Button>

            {/* Drawer */}
            {/* <Drawer placement="left" onClose={toggleDrawer} isOpen={isDrawerOpen}> */}
            <Drawer placement="left" onClose={toggleDrawer} isOpen={isDrawerOpen}>
                <DrawerOverlay>
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader display='flex'><img style={{objectFit:'contain'}} width='8%' src='./logo.png'></img> &nbsp; VMUKTI - ELE</DrawerHeader>
                        {/* <DrawerBody> */}
                        <DrawerBody>
                            <VStack spacing={4} align="start">
                                <Text onClick={() => handleRedirect("/dashboard")} display='flex' justifyContent='center' alignItems='center' cursor='pointer'>
                                    <Icon as={MdDashboard} boxSize={5} color="gray.500" />&nbsp;
                                    Dashboard
                                </Text>
                                <Text onClick={() => handleRedirect("/head")} display='flex' justifyContent='center' alignItems='center' cursor='pointer'>
                                    <Icon as={MdAccountCircle} boxSize={5} color="gray.500" />&nbsp;
                                    District Manager
                                </Text>
                                <Text onClick={() => handleRedirect("/installer")} display='flex' justifyContent='center' alignItems='center' cursor='pointer'>
                                    <Icon as={MdBuild} boxSize={5} color="gray.500" />&nbsp;
                                    Installer
                                </Text>
                                <Text onClick={() => handleRedirect("/autoinstaller")} display='flex' justifyContent='center' alignItems='center' cursor='pointer'>
                                    <Icon as={MdBuild} boxSize={5} color="gray.500" />&nbsp;
                                    Auto Installer
                                </Text>
                            </VStack>
                        </DrawerBody>
                        {/* </DrawerBody> */}
                        <DrawerFooter>
                            {/* Footer content goes here */}
                        </DrawerFooter>
                    </DrawerContent>
                </DrawerOverlay>
            </Drawer>
            </div> }
        </>
    );
};

export default DrawerButton;
