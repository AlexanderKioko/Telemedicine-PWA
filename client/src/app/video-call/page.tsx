'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import VideoCall from '@/components/VideoCall';

export default function VideoCallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading } = useAuth();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!loading) {
      const roomToken = searchParams.get('roomToken');
      if (!roomToken) {
        router.push('/dashboard?error=missing_token');
        return;
      }

      const verifyToken = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/verify-room-token`, // Use full URL
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ roomToken }),
              credentials: 'include' // Crucial for cookies
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Verification error details:', errorData);
            throw new Error(errorData.error || 'Verification failed');
          }

          const { valid, userId } = await response.json();

          if (!valid || !isAuthenticated || user?.id !== userId) {
            throw new Error('Unauthorized access');
          }

          setIsValid(true);
        } catch (error) {
          console.error("Verification failed:", error);
          router.push(`/dashboard?error=video_call_failed`);
        }
      };

      verifyToken();
    }
  }, [loading, searchParams, router, isAuthenticated, user]);

  if (loading || !isValid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verifying call...</h1>
          <p>Please wait while we validate your video session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <VideoCall /> {/* No need to pass roomId as a prop */}
    </div>
  );
}