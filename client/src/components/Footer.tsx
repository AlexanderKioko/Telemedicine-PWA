"use client";
import { Box, Typography, Stack } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

export default function Footer() {
  return (
    <Box 
      sx={{ 
        width: "100%", 
        bgcolor: "#1976D2", 
        color: "white", 
        textAlign: "center", 
        py: 3,
        mt: 4
      }}
    >
      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        spacing={{ xs: 1, sm: 2 }} 
        justifyContent="center"
        alignItems="center"
        mb={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <EmailIcon fontSize="small" />
          <Typography variant="body2">medireach254@gmail.com</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PhoneIcon fontSize="small" />
          <Typography variant="body2">+254741289114</Typography>
        </Stack>
      </Stack>
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} MediReach. All rights reserved.
      </Typography>
    </Box>
  );
}