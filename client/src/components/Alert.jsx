import { useState, useEffect } from "react";
import {Bolt} from '@mui/icons-material';
import { Box, Card,Typography} from "@mui/material";
import CardContent from '@mui/material/CardContent';

const AlertComp = ({ alert }) => {

  return (
    <Box className="Alerta">
      <Card
            variant="outlined"
            sx={{
              borderRadius: '6px',
              mb: '5px',
              height: '5rem',
            }}
          >
                <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
      {alert.zone.mission}
      </Typography>
      <Typography variant="h5" component="div">
        {alert.vbucks}
      </Typography>
    </CardContent>
          </Card>
    </Box>
  );
}

export default AlertComp;