"use client";
import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { useAuth } from '@/context/AuthContext';
import { IconButton, Button, Box, Typography, Card, CardContent } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff, CallEnd } from '@mui/icons-material';
import io from 'socket.io-client';
import { useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

const VideoCall = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const roomToken = searchParams.get('roomToken');
  const decoded = jwtDecode(roomToken); // Safe client-side decoding
  const roomId = decoded?.roomId;

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [socket] = useState(io(process.env.NEXT_PUBLIC_API_URL));
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const peerRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const getMediaConstraints = () => ({
    video: {
      width: { ideal: 320 },
      height: { ideal: 240 },
      frameRate: { max: 15 },
    },
    audio: {
      sampleSize: 16,
      channelCount: 1,
      echoCancellation: true
    }
  });

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        socket.emit('join-room', roomId);

        peerRef.current = new Peer({
          initiator: user.role === 'DOCTOR',
          trickle: false,
          stream,
          config: {
            iceServers: JSON.parse(process.env.NEXT_PUBLIC_ICE_SERVERS),
          }
        });

        peerRef.current.on('signal', data => {
          socket.emit('signal', { roomId, signal: data });
        });

        peerRef.current.on('stream', stream => {
          setRemoteStream(stream);
          remoteVideoRef.current.srcObject = stream;
          setConnectionStatus('Connected');
        });

        peerRef.current.on('error', err => {
          console.error('Peer error:', err);
          setConnectionStatus('Error: ' + err.message);
        });

        socket.on('signal', signal => {
          if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.signal(signal);
          }
        });

        setInterval(() => {
          if (peerRef.current) {
            peerRef.current._pc.getStats().then(stats => {
              stats.forEach(report => {
                if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
                  const packetLoss = (report.packetsLost / report.packetsReceived) * 100;
                  adjustQuality(packetLoss > 5 ? 'low' : packetLoss > 2 ? 'medium' : 'high');
                }
              });
            });
          }
        }, 5000);

      } catch (err) {
        console.error('Media error:', err);
        setConnectionStatus('Error: ' + err.message);
      }
    };

    init();

    return () => {
      if (peerRef.current) peerRef.current.destroy();
      if (localStream) localStream.getTracks().forEach(track => track.stop());
      socket.disconnect();
    };
  }, []);

  const adjustQuality = (quality) => {
    const senders = peerRef.current?._pc?.getSenders();
    if (!senders) return;

    senders.forEach(sender => {
      if (sender.track?.kind === 'video') {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];

        switch(quality) {
          case 'low':
            params.encodings[0] = {
              ...params.encodings[0],
              scaleResolutionDownBy: 2,
              maxBitrate: 150000,
              maxFramerate: 10
            };
            break;
          case 'medium':
            params.encodings[0] = {
              ...params.encodings[0],
              scaleResolutionDownBy: 1.5,
              maxBitrate: 300000,
              maxFramerate: 15
            };
            break;
          default:
            params.encodings[0] = {
              ...params.encodings[0],
              scaleResolutionDownBy: 1,
              maxBitrate: 500000,
              maxFramerate: 25
            };
        }

        sender.setParameters(params)
          .catch(err => console.error('Error adjusting quality:', err));
      }
    });
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(!videoTrack.enabled);
    }
  };

  const endCall = () => {
    if (peerRef.current) peerRef.current.destroy();
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    window.location.href = '/dashboard';
  };

  return (
    <Card sx={{ p: 2, borderRadius: 4, height: '95vh' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Status Bar */}
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="body2" color={
            connectionStatus.includes('Error') ? 'error' :
            connectionStatus === 'Connected' ? 'success.main' : 'text.secondary'
          }>
            {connectionStatus}
          </Typography>
        </Box>

        {/* Video Container */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: 'grey.800',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          {/* Remote Video */}
          <video
            autoPlay
            ref={remoteVideoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          {/* Local Video */}
          <video
            autoPlay
            muted
            ref={localVideoRef}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              width: '20%',
              minWidth: 200,
              maxWidth: 300,
              borderRadius: 8,
              boxShadow: 3
            }}
          />
        </Box>

        {/* Controls */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mt: 2
        }}>
          <IconButton
            onClick={toggleMic}
            color={isMuted ? "error" : "primary"}
            sx={{ backgroundColor: 'background.paper' }}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </IconButton>

          <IconButton
            onClick={toggleVideo}
            color={isVideoOn ? "primary" : "error"}
            sx={{ backgroundColor: 'background.paper' }}
          >
            {isVideoOn ? <VideocamOff /> : <Videocam />}
          </IconButton>

          <Button
            variant="contained"
            color="error"
            startIcon={<CallEnd />}
            onClick={endCall}
            sx={{ px: 4 }}
          >
            End Call
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VideoCall;