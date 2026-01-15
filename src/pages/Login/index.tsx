import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { userState } from '../../common/user';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  if (!clientId) {
    return <div>Error: Google Client ID is not configured.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div>
        <h1>Taxipot</h1>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              const decoded = jwtDecode<{ email: string }>(
                credentialResponse.credential
              );
              if (decoded.email && decoded.email.endsWith('@snu.ac.kr')) {
                userState.isLoggedIn = true;
                userState.email = decoded.email;
                // Redirect to create-room page
                window.location.href = '/create-room';
              } else {
                alert('Please log in with a SNU email.');
              }
            }
          }}
          onError={() => {
            console.error('Google Login Failed');
          }}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
