import { useEffect, useState } from 'react';
// import { CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const withAuth = (WrappedComponent, allowedRoles = []) => {
  const AuthenticatedComponent = (props) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role');

      if (!isLoggedIn || !token) {
        navigate('/'); // Redirect to login page if not authenticated
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // If roles are specified and user doesn't have permission
        navigate('/'); // Or redirect to an unauthorized page
      } else {
        setIsLoading(false); // Set loading to false when authenticated and authorized
      }
    }, [navigate]);

    if (isLoading) {
      // You can show a loading spinner while authentication is being checked
      //   return <div><CircularProgress /></div>;
      return <div><h1>
        Loading
        </h1>
        </div>;
    }

    // Render the wrapped component if authenticated
    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;