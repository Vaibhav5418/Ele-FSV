import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { LuMaximize, LuMinimize } from "react-icons/lu";
import flvjs from "flv.js";
import ReactPlayer from "react-player";

const getJessicaConstructor = () => {
  if (typeof window === "undefined") return null;
  return window.JessibucaPro || window.Jessibuca || null;
};

const JessicaStreamPlayer = ({
  url,
  width = "100%",
  height = "100%",
  controls = true,
  onError,
}) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const jessibucaRef = useRef(null);
  const flvPlayerRef = useRef(null);

  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const decodedUrl = useMemo(() => {
    try {
      return decodeURIComponent(url || "");
    } catch (_err) {
      return url || "";
    }
  }, [url]);

  const isJessicaStream = useMemo(
    () => /^wss?:\/\/.*\/jessica\//i.test(decodedUrl),
    [decodedUrl]
  );

  const isFlvStream = useMemo(
    () => /\.flv(\?|$)/i.test(decodedUrl) && !/^wss?:\/\/.*\/jessica\//i.test(decodedUrl),
    [decodedUrl]
  );

  const destroyFlv = () => {
    if (!flvPlayerRef.current) return;
    try {
      flvPlayerRef.current.pause();
      flvPlayerRef.current.unload();
      flvPlayerRef.current.detachMediaElement();
      flvPlayerRef.current.destroy();
    } catch (_err) { }
    flvPlayerRef.current = null;
  };

  const destroyJessica = async () => {
    if (!jessibucaRef.current) return;

    const player = jessibucaRef.current;
    jessibucaRef.current = null;

    try {
      await Promise.resolve(player.destroy()).catch(() => { });
    } catch (_err) { }

    if (containerRef.current) {
      try {
        containerRef.current.removeAttribute("data-jbprov");
        containerRef.current.classList.remove("jessibuca-container");
        setTimeout(() => {
          if (containerRef.current && !jessibucaRef.current) {
            containerRef.current.innerHTML = "";
          }
        }, 100);
      } catch (_err) { }
    }
  };

  const destroyAll = async () => {
    destroyFlv();
    await destroyJessica();
  };

  const createJessica = async () => {
    if (!containerRef.current) return;

    await destroyJessica();

    try {
      const JessibucaConstructor = getJessicaConstructor();
      if (!JessibucaConstructor) {
        const msg = "Jessibuca library not loaded";
        setError(msg);
        onError?.(new Error(msg));
        return;
      }

      const container = containerRef.current;
      container.removeAttribute("data-jbprov");
      container.classList.remove("jessibuca-container");
      container.innerHTML = "";

      const originalRemoveChild = container.removeChild;
      container.removeChild = function safeRemoveChild(child) {
        if (child && child.parentNode === this) {
          return originalRemoveChild.call(this, child);
        }
        return child;
      };

      const player = new JessibucaConstructor({
        container,
        decoder: "/js/decoder-pro.js",

        videoBuffer: 1.0,
        useMSE: false,
        useWCS: false,
        useSIMD: true,
        forceNoOffscreen: true,
        autoWasm: true,

        isResize: true,
        isFullSize: true,
        debug: false,
        loadingText: "Buffering...",
        hasAudio: false,
        isNotMute: false,
        playbackRate: 1.0,

        operateBtns: {
          fullscreen: false,
          screenshot: false,
          play: false,
          audio: false,
        },
      });

      jessibucaRef.current = player;

      player.on("error", (err) => {
        const errStr = String(err).toLowerCase();
        if (
          errStr.includes("simddecodeerror") ||
          errStr.includes("webcodecsunsupportedconfigurationerror") ||
          errStr.includes("unsupported configuration")
        ) {
          return;
        }
        const msg = typeof err === "string" ? err : JSON.stringify(err);
        setError(msg);
        onError?.(new Error(msg));
      });

      player.on("videoInfo", () => {
        setError(null);
        setTimeout(() => {
          if (jessibucaRef.current) {
            try {
              jessibucaRef.current.resize();
            } catch (_err) { }
          }
        }, 500);
      });

      player.on("play", () => {
        setError(null);
      });

      await Promise.resolve(player.play(url));

      setTimeout(() => {
        if (jessibucaRef.current) {
          try {
            jessibucaRef.current.resize();
          } catch (_err) { }
        }
      }, 500);
    } catch (e) {
      const msg = e?.message || "Jessica player init failed";
      setError(msg);
      onError?.(new Error(msg));
    }
  };

  useEffect(() => {
    return () => {
      destroyAll();
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;

    const target = wrapperRef.current || containerRef.current;
    if (!target) return;

    const observer = new ResizeObserver(() => {
      if (jessibucaRef.current) {
        try {
          jessibucaRef.current.resize();
        } catch (_err) { }
      }
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [url, isJessicaStream]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const initJessica = async () => {
      setError(null);
      await destroyAll();

      if (!isJessicaStream || !url || !containerRef.current) return;

      const checkDimensionsAndCreate = () => {
        if (cancelled || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) {
          createJessica();
        } else if (attempts < maxAttempts) {
          attempts += 1;
          setTimeout(checkDimensionsAndCreate, 200);
        } else {
          const msg = "Player container failed to resize (height=0)";
          setError(msg);
          onError?.(new Error(msg));
        }
      };

      checkDimensionsAndCreate();
    };

    const initFlv = () => {
      setError(null);
      destroyFlv();
      if (!isFlvStream || !url || !videoRef.current || !flvjs.isSupported()) return;

      const isWS = /^wss?:\/\//i.test(url);
      const player = flvjs.createPlayer(
        {
          type: "flv",
          url,
          isLive: true,
          hasAudio: false,
        },
        {
          enableWorker: false,
          stashInitialSize: isWS ? 512 : 128,
        }
      );
      flvPlayerRef.current = player;
      player.attachMediaElement(videoRef.current);
      player.load();
      Promise.resolve(player.play()).catch(() => { });
      player.on(flvjs.Events.ERROR, (type, detail) => {
        if (
          type === flvjs.ErrorTypes.MEDIA_ERROR &&
          detail === flvjs.ErrorDetails.CODEC_UNSUPPORTED
        ) {
          return;
        }
        const msg = `FLV stream error: ${type || ""} ${detail || ""}`.trim();
        setError(msg);
        onError?.(new Error(msg));
      });
    };

    if (isJessicaStream) {
      initJessica();
    } else if (isFlvStream) {
      initFlv();
    }

    return () => {
      cancelled = true;
      attempts = maxAttempts;
      destroyAll();
    };
  }, [url, isJessicaStream, isFlvStream]);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;

    if (!isFullscreen) {
      const el = wrapperRef.current;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  };

  if (!url) return null;

  if (isJessicaStream) {
    return (
      <Box
        ref={wrapperRef}
        position="relative"
        width={width}
        height={height}
        bg="black"
        overflow="hidden"
        borderRadius="inherit"
        className="jessibuca-player-outer"
      >
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            background: "black",
            position: "relative",
            minHeight: height === "100%" ? "100%" : height,
          }}
          className="jessibuca-container-inner"
        />

        <style>
          {`
            .jessibuca-container-inner,
            .jessibuca-container-inner > div,
            .jessibuca-container-inner video,
            .jessibuca-container-inner canvas {
              width: 100% !important;
              height: 100% !important;
            }

            .jessibuca-container-inner video,
            .jessibuca-container-inner canvas {
              object-fit: fill !important;
            }
          `}
        </style>

        <IconButton
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          icon={isFullscreen ? <LuMinimize /> : <LuMaximize />}
          position="absolute"
          bottom="12px"
          right="12px"
          zIndex={2147483647}
          colorScheme="whiteAlpha"
          variant="solid"
          size="sm"
          isRound
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          display="flex"
          boxShadow="lg"
          _hover={{ bg: "whiteAlpha.500", transform: "scale(1.1)" }}
          transition="all 0.2s"
        />

        {error && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            color="white"
            bg="rgba(255,0,0,0.5)"
            p={2}
            borderRadius="md"
            zIndex={110}
            maxW="90%"
          >
            <Text fontSize="sm">{error}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (isFlvStream) {
    return (
      <Box h={height} width={width} bg="black">
        {error ? (
          <Box p={4}>
            <Text color="red.300" fontSize="sm">{error}</Text>
          </Box>
        ) : (
          <video
            ref={videoRef}
            controls={controls}
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              background: "#111827",
              objectFit: "fill",
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <ReactPlayer
      key={url}
      url={url}
      playing
      controls={controls}
      width="100%"
      height="100%"
      onError={(err) => onError?.(err)}
    />
  );
};

export default JessicaStreamPlayer;
