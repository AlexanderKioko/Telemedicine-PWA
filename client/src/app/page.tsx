"use client";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Avatar,
  Rating,
} from "@mui/material";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login"); // Always go to login page
  };

  const testimonials = [
    {
      name: "Sarah Kamau",
      location: "Nyeri County",
      avatar: "/avatars/avatar1.jpg",
      rating: 5,
      text: "MediReach has been a lifesaver for my family. Living 40km from the nearest hospital, we now can get medical advice without the long journey. The low-bandwidth option works perfectly with our limited internet connection."
    },
    {
      name: "Dr. James Omondi",
      location: "Nairobi",
      avatar: "/avatars/avatar2.jpg",
      rating: 5,
      text: "As a doctor, I'm passionate about reaching patients in underserved areas. MediReach's platform is intuitive and reliable, allowing me to provide quality care to patients I could never reach before."
    },
    {
      name: "Elizabeth Wanjiku",
      location: "Marsabit",
      avatar: "/avatars/avatar3.jpg",
      rating: 4,
      text: "When my son developed a high fever, I was able to consult with a pediatrician within an hour through MediReach. The doctor provided treatment advice that worked, saving us a 3-hour trip to the clinic."
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #e0f7fa 0%, #bbdefb 100%)",
          padding: { xs: 4, md: 8 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "80vh",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "30%",
            background: "linear-gradient(to top, rgba(255,255,255,0.8), transparent)",
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#1976D2",
                fontSize: { xs: "2rem", md: "3.75rem" },
                mb: 3,
                textShadow: "0 2px 10px rgba(25, 118, 210, 0.2)"
              }}
            >
              Empowering Healthcare Access in Rural Areas
            </Typography>
            <Typography
              variant="h5"
              component="p"
              sx={{
                color: "#424242",
                mb: 5,
                maxWidth: "800px",
                mx: "auto",
                fontSize: { xs: "1.2rem", md: "1.5rem" },
                lineHeight: 1.6
              }}
            >
              MediReach connects you with healthcare professionals through secure, low-bandwidth video consultations designed specifically for rural communities.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                backgroundColor: "#1976D2",
                fontSize: "1.1rem",
                px: 5,
                py: 1.5,
                borderRadius: "30px",
                boxShadow: "0 4px 20px rgba(25, 118, 210, 0.3)",
                "&:hover": {
                  backgroundColor: "#1565C0",
                  boxShadow: "0 6px 25px rgba(25, 118, 210, 0.4)",
                  transform: "translateY(-3px)"
                },
                transition: "all 0.3s ease"
              }}
            >
              Get Started Now
            </Button>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
        >
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#1976D2",
                fontSize: { xs: "2rem", md: "2.75rem" },
                position: "relative",
                display: "inline-block",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: "60%",
                  height: "4px",
                  background: "linear-gradient(90deg, transparent, #1976D2, transparent)",
                  bottom: "-10px",
                  left: "20%"
                }
              }}
            >
              About MediReach
            </Typography>
            <Typography
              variant="body1"
              sx={{
                maxWidth: "850px",
                mx: "auto",
                fontSize: "1.2rem",
                color: "#424242",
                lineHeight: 1.8,
                mt: 5
              }}
            >
              MediReach is a specialized telemedicine platform designed to overcome connectivity challenges in rural areas. Through our optimized low-bandwidth video consultations, we ensure that quality healthcare services reach even the most remote communities. Our goal is to bridge the gap between patients and healthcare professionals, ensuring accessible, affordable, and timely medical care for all.
            </Typography>
          </Box>
        </motion.div>
      </Container>

      <Box
        sx={{
          backgroundColor: "#f8f9fa",
          py: { xs: 6, md: 10 },
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "15px",
            background: "linear-gradient(90deg, #bbdefb, #e0f7fa, #bbdefb)"
          }
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#1976D2",
              fontSize: { xs: "2rem", md: "2.75rem" },
              textAlign: "center",
              mb: 6,
              position: "relative",
              display: "inline-block",
              width: "100%",
              "&::after": {
                content: '""',
                position: "absolute",
                width: "100px",
                height: "4px",
                background: "#1976D2",
                bottom: "-10px",
                left: "calc(50% - 50px)"
              }
            }}
          >
            How It Works
          </Typography>

          <Grid container spacing={5} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    transition: "transform 0.4s, box-shadow 0.4s",
                    "&:hover": {
                      transform: "translateY(-12px)",
                      boxShadow: "0 15px 35px rgba(25, 118, 210, 0.15)",
                    },
                  }}
                >
                  <Box sx={{
                    backgroundColor: "#e3f2fd",
                    p: 2,
                    display: "flex",
                    justifyContent: "center"
                  }}>
                    <LooksOneIcon
                      sx={{ fontSize: 70, color: "#1976D2" }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 4, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      Create Your Account
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
                      Sign up for a free account in minutes. Provide basic information to get started with personalized healthcare.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                transition={{ delay: 0.2 }}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    transition: "transform 0.4s, box-shadow 0.4s",
                    "&:hover": {
                      transform: "translateY(-12px)",
                      boxShadow: "0 15px 35px rgba(25, 118, 210, 0.15)",
                    },
                  }}
                >
                  <Box sx={{
                    backgroundColor: "#e3f2fd",
                    p: 2,
                    display: "flex",
                    justifyContent: "center"
                  }}>
                    <LooksTwoIcon
                      sx={{ fontSize: 70, color: "#1976D2" }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 4, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      Book Your Consultation
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
                      Browse available doctors by specialty, check their schedules, and book an appointment at your convenient time.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                transition={{ delay: 0.4 }}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    transition: "transform 0.4s, box-shadow 0.4s",
                    "&:hover": {
                      transform: "translateY(-12px)",
                      boxShadow: "0 15px 35px rgba(25, 118, 210, 0.15)",
                    },
                  }}
                >
                  <Box sx={{
                    backgroundColor: "#e3f2fd",
                    p: 2,
                    display: "flex",
                    justifyContent: "center"
                  }}>
                    <Looks3Icon
                      sx={{ fontSize: 70, color: "#1976D2" }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 4, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      Meet Your Doctor
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
                      Join your video consultation from anywhere. Our low-bandwidth system works even in areas with limited connectivity.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "white" }}>
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#1976D2",
                fontSize: { xs: "2rem", md: "2.75rem" },
                textAlign: "center",
                mb: 6,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: "80px",
                  height: "4px",
                  background: "#1976D2",
                  bottom: "-15px",
                  left: "calc(50% - 40px)"
                }
              }}
            >
              Success Stories
            </Typography>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            <Grid container spacing={4}>
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div variants={fadeIn} transition={{ delay: index * 0.2 }}>
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: "16px",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                        overflow: "visible",
                        position: "relative",
                        "&:hover": {
                          boxShadow: "0 15px 40px rgba(25, 118, 210, 0.15)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: "-25px",
                          left: "20px",
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          backgroundColor: "#e3f2fd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
                        }}
                      >
                        <FormatQuoteIcon sx={{ color: "#1976D2", fontSize: 28 }} />
                      </Box>
                      <CardContent sx={{ p: 4, pt: 5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                          <Avatar
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            sx={{ width: 60, height: 60, mr: 2, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}
                          />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                              {testimonial.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {testimonial.location}
                            </Typography>
                            <Rating
                              value={testimonial.rating}
                              readOnly
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ fontSize: "1rem", lineHeight: 1.7, mt: 2 }}>
                          &quot;{testimonial.text}&quot;
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      <Box
        sx={{
          backgroundColor: "#1976D2",
          py: { xs: 5, md: 8 },
          color: "white",
          textAlign: "center"
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                mb: 3,
                fontSize: { xs: "1.75rem", md: "2.5rem" }
              }}
            >
              Ready to experience healthcare without barriers?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                fontSize: "1.1rem",
                opacity: 0.9,
                maxWidth: "700px",
                mx: "auto"
              }}
            >
              Join thousands of patients and healthcare providers who are transforming rural healthcare access with MediReach.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                backgroundColor: "white",
                color: "#1976D2",
                fontSize: "1.1rem",
                px: 4,
                py: 1.5,
                borderRadius: "30px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  boxShadow: "0 6px 25px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              Get Started Today
            </Button>
          </motion.div>
        </Container>
      </Box>

      <Box sx={{ mt: "auto" }}>
        <Footer />
      </Box>
    </Box>
  );
}