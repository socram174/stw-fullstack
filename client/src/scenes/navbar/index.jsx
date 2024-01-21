
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import Typography from '@mui/material/Typography';

import Container from '@mui/material/Container';

import { useNavigate } from 'react-router-dom';



function NavBar() {

  const navigate = useNavigate();

  return (
    <AppBar position="fixed">
      <Container maxWidth="false" sx={{bgcolor: "#4c5c68",backgroundImage: "linear-gradient(#56ab2f,#a8e063)"}}>
        <Toolbar disableGutters>
          
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <img src='/Icon_VBucks.webp' width={"30px"} style={{marginRight:"5px"}}/> STW Alerts
          </Typography>
          
          <Typography           sx={{
            "&:hover": {
              cursor: "pointer",
            },
          }} onClick={()=>{
            navigate('/history');
          }}>Alert History</Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}></Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            onClick={()=>{
              navigate('/');
            }}
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <img src='/Icon_VBucks.webp' width={"50px"}/>
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default NavBar;