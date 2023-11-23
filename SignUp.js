import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import IntlMessages from '@jumbo/utils/IntlMessages';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router';
import ContentLoader from '@jumbo/components/ContentLoader';
import { isPasswordValid, isValidEmail } from '@jumbo/utils/commonHelper';
import { alpha, makeStyles } from '@material-ui/core/styles';
import CmtImage from '@coremat/CmtImage';
import Typography from '@material-ui/core/Typography';
import { CurrentAuthMethod } from '@jumbo/constants/AppConstants';
import AuthWrapper from './AuthWrapper';
import { NavLink } from 'react-router-dom';
import Axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { fetchError, fetchSuccess } from '@redux/actions';
import '../../../src/css/theme.css';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import HttpsOutlinedIcon from '@mui/icons-material/HttpsOutlined';

const useStyles = makeStyles((theme) => ({
  authThumb: {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    [theme.breakpoints.up('md')]: {
      width: '50%',
      order: 2,
    },
  },
  authContent: {
    padding: 30,
    boxShadow: 10,
    [theme.breakpoints.up('md')]: {
      width: (props) => (props.variant === 'default' ? '50%' : '100%'),
      order: 1,
    },
    [theme.breakpoints.up('xl')]: {
      padding: 50,
    },
  },
  titleRoot: {
    marginBottom: 14,
    color: theme.palette.text.primary,
  },
  textFieldRoot: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.common.dark, 0.12),
    },
  },
  textCapital: {
    textTransform: 'none',
  },
  textAcc: {
    textAlign: 'center',
    '& a': {
      marginLeft: 4,
    },
  },
  alrTextRoot: {
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      textAlign: 'right',
    },
  },
}));

const initalState = {
  username: '',
  full_name: '',
  email: '',
  password: '',
};
function validateWhiteSpace(val) {
  return val.trim().length > 0;
}

const stringValueVlidation = (username, min, max) => {
  var reg = /^[a-zA-Z ]+$/;
  var len = { min, max };
  if (!reg.test(username)) {
    return { error: 'Full name is invalid', status: false };
  }
  if (username.length < len.min) {
    return { error: `Length must be greater than or equal to ${min} characters`, status: false };
  }
  if (username.length > len.max) {
    return { error: `Length must be less than or equal to ${max} characters`, status: false };
  }
  return { error: '', status: true };
};
const SignUp = ({ method = CurrentAuthMethod, variant = 'default', wrapperVariant = 'default' }) => {
  let referralParam = new URLSearchParams(window.location.search).get('referral');
  const [state, setState] = useState(initalState);
  const [referral, setReferral] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState({ full_name: false, email: false, password: false, message: '' });
  const [flashMsg, setflashMsg] = useState('');
  const [cannotType, setCannotType] = useState(false);
  const [recaptcha, setRecaptcha] = useState(false);
  const common = useSelector(({ common }) => common);
  if (common.error !== '') {
    if (error === '') {
      setError(common.error);
    }
  }
  if (referralParam && !referral) {
    setReferral(referralParam);
  }
  const verifyRef = async () => {
    try {
      setBusy(true)
      Axios.create()
        .post('/auth/ref-verify', { referral })
        .then((ans) => {
          setBusy(false)
          ans = ans.data;
          if (ans.status) {
            let { email } = ans;
            setState((prevState) => ({ ...prevState, email }));
          } else {
            setCannotType(false);
            dispatch(fetchError(ans.message));
          }
        })
        .catch((e) => {
          setBusy(false)
          setCannotType(false);
          console.log(e);
          dispatch(fetchError(e.message));
        });
    } catch (error) {
      setBusy(false)
    }
  };

  useEffect(() => {
    if (referral && !cannotType) {
      setCannotType(true);
      verifyRef();
    }
  }, []);

  const dispatch = useDispatch();
  const classes = useStyles({ variant });
  const { authUser } = useSelector(({ auth }) => auth);
  const history = useHistory();

  useEffect(() => {
    setError('');
  }, [state]);

  if (authUser) {
    var search = window.location.search;
    var params = new URLSearchParams(search);
    var redirectUrl = params.get('action_url');
    if (authUser.organizations && authUser.organizations.length < 1) {
      history.push('/app/orgs');
    } else {
      if (redirectUrl) {
        history.push(redirectUrl);
      } else {
        history.push('/app/dashboard');
      }
    }
  }

  const handleOnChangeTF = (e) => {
    var { name, value } = e.target;
    e.preventDefault();
    if (name == 'email' && cannotType) return;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const { username, full_name, email, password } = state;
    if (!validateWhiteSpace(full_name)) {
      setError({ ...error, full_name: true, message: 'This is a required field.' });
      return null;
    }
    if (!stringValueVlidation(full_name, 5, 70).status) {
      setError({ ...error, full_name: true, message: `${stringValueVlidation(full_name, 5, 70).error}` });
      return null;
    }
    if (!validateWhiteSpace(email)) {
      setError({ ...error, email: true, message: 'This is a required field.' });
      return null;
    }
    if (!isValidEmail(email)) {
      setError({ ...error, email: true, message: 'Please enter a valid email address (Ex: john@gmail.com)' });
      return null;
    }
    if (!validateWhiteSpace(password)) {
      setError({ ...error, password: true, message: 'This is a required field.' });
      return null;
    }
    if (!isPasswordValid(password)) {
      setError({ ...error, password: true, message: `Password isn't strong, 8 characters with a mix of letters, numbers and symbols` });
      return null;
    }

    try {
      setBusy(true)
      Axios.create()
        .post('/auth/signup', {
          username: `user_${Date.now()}_auton`,
          full_name,
          email,
          password,
          referral,
        }).then((response) => {
          if (response.data && response.data.status === false) {
            setflashMsg(response.data.message);
            console.log('msg:',flashMsg);
            // alert('Signup failed', response.data.message);
          } else {
            setflashMsg(response.data.message);
            console.log('msg:',flashMsg);
          }
        })
        .then((ans) => {
          setBusy(false)
          ans = ans.data;
          if (ans.status) {
            dispatch(fetchSuccess(ans.message));
            setTimeout(() => {
              history.push('/otp');
            }, 1000);
          } else {
            dispatch(fetchError(ans.message));
          }
        })
        .catch((e) => {
          setBusy(false)
          console.log(e);
          dispatch(fetchError(e.message));
        });
    } catch (error) {
      setBusy(false)
      console.log(error);
      dispatch(fetchError(error.message));
    }
  };

  const captchaOnChange = (value) => {
    if (value !== "" || value !== undefined) {
      setRecaptcha(true)
    }
  };

  return (

    <div>
      <div className='loginLeft'>
        <h1>Auton<span>8</span></h1>

        <form onSubmit={onSubmit} className='outerFormBox'>
          <h3>Create an account</h3>
          {flashMsg && (
            <Typography className='loginError'>
              {flashMsg}
            </Typography>
          )}
          <Box mb={2}>
            <label>Name</label>
            <TextField
              InputProps={{
                startAdornment: (
                  <PersonOutlineOutlinedIcon />
                ),
              }}
              fullWidth
              placeholder="John Doe"
              size="small"
              name="full_name"
              onChange={handleOnChangeTF}
              value={state.full_name}
              margin="normal"
              variant="outlined"
              disabled={common.loading}
              className="filedfocus"
            />
            {error.full_name && (
              <Typography className='loginError'>
                {error.message}
              </Typography>
            )}
          </Box>
          <Box mb={2}>
            <label>Email</label>
            <TextField
              InputProps={{
                startAdornment: (
                  <AlternateEmailOutlinedIcon />
                ),
              }}
              fullWidth
              placeholder="someone@else.com"
              size="small"
              name="email"
              type={'value'}
              onChange={handleOnChangeTF}
              value={state.email}
              margin="normal"
              variant="outlined"
              disabled={common.loading || cannotType}
              className="filedfocus"
            />
            {error.email && (
              <Typography className='loginError'>
                {error.message}
              </Typography>
            )}
          </Box>
          <Box>
            <label>Password</label>
            <TextField
              type="password"
              InputProps={{
                startAdornment: (
                  <HttpsOutlinedIcon />
                ),
              }}
              fullWidth
              placeholder="******************"
              size="small"
              name="password"
              onChange={handleOnChangeTF}
              value={state.password}
              margin="normal"
              variant="outlined"
              disabled={common.loading}
              className="filedfocus"
            />
            {error.password && (
              <Typography className='loginError'>
                {error.message}
              </Typography>
            )}
          </Box>

          {referral && (
            <Box p="15px 20px" mb={1} bgcolor="#f5f5f5" borderRadius={1}>
              <Typography variant="h6" style={{ fontSize: '10px' }}>
                this is a referral signup you will be added in invited organization after registration
              </Typography>
            </Box>
          )}

          <Box margin="5px 0px 15px 0px">
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={captchaOnChange}
            />
          </Box>

          <Box alignItems="center" mt={3} mb={3}>
            <Button type="submit"
              disabled={common.loading || busy || !recaptcha}
              variant="contained"
              color="success"
              className='loginBtn'
            >
              <IntlMessages id="appModule.regsiter" />
            </Button>
          </Box>
          <Box display={'flex'} width={'100%'}>
            <Button
              onClick={() => {
                history.push('/login');
              }}
              variant="contained"
              className='signupBtn'
              disabled={common.loading}>
              <Typography style={{ color: '#919395' }}>Have an Account?  <span>Sign In</span> </Typography>
            </Button>
          </Box>
        </form>
      </div>

      <div className='loginRight'>
        <h2>Welcome to <span>Auton <i>8</i></span></h2>
        <p>Automate your QA testing and achieve greater efficiency.</p>
        <h5>© 2023 Auton8. All rights reserved</h5>
      </div>

    </div>
  );
};

export default SignUp;
