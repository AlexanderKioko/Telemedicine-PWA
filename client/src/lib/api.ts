export type TestMessageResponse = {
    message: string;
  };
  
  export const fetchTestMessage = async (): Promise<TestMessageResponse> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test`);
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
  };  