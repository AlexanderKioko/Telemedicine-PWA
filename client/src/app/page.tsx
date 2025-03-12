"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchTestMessage, TestMessageResponse } from "@/lib/api";

export default function Home() {
  const { data, error, isLoading } = useQuery<TestMessageResponse>({
    queryKey: ["testMessage"],
    queryFn: fetchTestMessage,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error connecting to backend</p>;

  return (
    <div>
      <h1>MediReach</h1>
      <p>Backend Message: {data?.message}</p>
    </div>
  );
}