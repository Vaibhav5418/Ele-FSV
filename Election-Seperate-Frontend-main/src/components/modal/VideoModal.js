import { Badge, Box, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import React from 'react';
import JessicaStreamPlayer from '../JessicaStreamPlayer';

const buildAlternateJessicaUrl = (url) => {
  const rawUrl = (url || '').toString().trim();
  if (!rawUrl) return '';

  const match = rawUrl.match(/(\/jessica\/DVR\/)([^/?]+)(\.flv(?:\?.*)?)$/i);
  if (!match) return '';

  const prefix = match[1];
  const streamId = match[2];
  const suffix = match[3];

  const toggledId = /^RTSP-/i.test(streamId)
    ? streamId.replace(/^RTSP-/i, '')
    : `RTSP-${streamId}`;

  return rawUrl.replace(`${prefix}${streamId}${suffix}`, `${prefix}${toggledId}${suffix}`);
};

const VideoModal = ({ isOpen, deviceId, flvUrl, streamCandidates = [], status, onClose, state, district, location }) => {
  const [hasPlayerError, setHasPlayerError] = React.useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = React.useState(flvUrl || '');
  const [hasTriedFallback, setHasTriedFallback] = React.useState(false);
  const [currentCandidateIndex, setCurrentCandidateIndex] = React.useState(0);

  const mergedCandidates = React.useMemo(() => {
    const list = [...(Array.isArray(streamCandidates) ? streamCandidates : [])];
    if (flvUrl) list.unshift(flvUrl);
    return [...new Set(list.filter(Boolean))];
  }, [flvUrl, streamCandidates]);

  React.useEffect(() => {
    setCurrentCandidateIndex(0);
    setActiveStreamUrl((flvUrl || (mergedCandidates && mergedCandidates[0]) || ''));
    setHasTriedFallback(false);
    setHasPlayerError(false);
  }, [flvUrl, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setHasPlayerError(false);
    }
  }, [isOpen, activeStreamUrl]);

  if (!isOpen) return null;

  // const iconColor = status === 'RUNNING' ? '🟢' : '🔴';

  return (
    <div className="modal">
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'sm', md: 'lg' }}>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl" border="1px solid" borderColor="gray.100">
          <ModalHeader pb={2}>
            <HStack justify="space-between" pr={8}>
              <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="gray.800" noOfLines={1}>
                {deviceId}
              </Text>
              <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2.5} py={1}>
                LIVE
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton borderRadius="full" bg="gray.100" _hover={{ bg: 'gray.200' }} />

          <ModalBody pt={1} pb={3}>
            <Box
              borderRadius="xl"
              overflow="hidden"
              bg="gray.900"
              border="1px solid"
              borderColor="gray.200"
              h={{ base: '190px', md: '280px' }}
            >
              {!activeStreamUrl || hasPlayerError ? (
                <Box p={4}>
                  <Text color="gray.200" fontSize="sm">
                    Live stream unavailable for this camera.
                  </Text>
                </Box>
              ) : (
                <JessicaStreamPlayer
                  url={activeStreamUrl}
                  width="100%"
                  height="100%"
                  onError={() => {
                    const nextIndex = currentCandidateIndex + 1;
                    if (nextIndex < mergedCandidates.length) {
                      setCurrentCandidateIndex(nextIndex);
                      setActiveStreamUrl(mergedCandidates[nextIndex]);
                      setHasTriedFallback(true);
                      setHasPlayerError(false);
                      return;
                    }

                    if (!hasTriedFallback) {
                      const fallbackUrl = buildAlternateJessicaUrl(activeStreamUrl);
                      if (fallbackUrl && fallbackUrl !== activeStreamUrl) {
                        setHasTriedFallback(true);
                        setActiveStreamUrl(fallbackUrl);
                        setHasPlayerError(false);
                        return;
                      }
                    }

                    setHasPlayerError(true);
                  }}
                />
              )}
            </Box>
          </ModalBody>

          <ModalFooter pt={1} pb={4}>
            <Text fontSize="sm" color="gray.600" noOfLines={1}>
              {location}
            </Text>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default VideoModal;
