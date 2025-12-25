import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React from 'react';
import ReactPlayer from 'react-player';

const VideoModal = ({ isOpen, deviceId, flvUrl, status, onClose, state, district, location }) => {
  if (!isOpen) return null;

  // const iconColor = status === 'RUNNING' ? '🟢' : '🔴';

  return (
    <div className="modal">
      <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              {/* <ModalHeader>{deviceId}</ModalHeader> */}
              <ModalCloseButton />
              <ModalBody>
                {/* {selectedCamera && ( */}
                  <>
                    <ModalHeader>{deviceId}</ModalHeader>  {/* &nbsp;{iconColor} */}
                    <ReactPlayer
                      url={flvUrl}
                      playing={true}
                      controls={true}
                      width="100%"
                      height="100%"
                    />
                    {/* <Flex justifyContent="space-between" mt={4} mb={4}>
                      <Button colorScheme="blue" mt={4} onClick={() => handleGetData(deviceId, 'flip')}>
                        Flip &nbsp;<LuFlipVertical2 />
                      </Button>
                      <Button colorScheme="blue" mt={4} onClick={() => handleGetData(deviceId, 'mirror')}>
                        Mirror &nbsp;<LuFlipHorizontal2 />
                      </Button>
                    </Flex> */}
                  </>
                {/* )} */}
              </ModalBody>
              <ModalFooter fontSize={'small'} display='flex' justifyContent='flex-start' pt={1}>
                {location}
                {/* <Button colorScheme="blue" mr={3}>
                  Close
                </Button> */}
              </ModalFooter>
            </ModalContent>
          </Modal>
    </div>
  );
};

export default VideoModal;
