import React, { useEffect } from 'react';

const TawkToWidget = () => {
  useEffect(() => {
    const s0 = document.getElementsByTagName('script')[0];
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = process.env.REACT_APP_TAWK_TO_URL;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);

    return () => {
      // Clean up the Tawk.to script when component unmounts
      s1.parentNode.removeChild(s1);
    };
  }, []);

  return null; // Tawk.to script is loaded asynchronously, so no need to render anything
};

export default TawkToWidget;
