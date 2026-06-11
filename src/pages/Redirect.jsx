import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader } from "lucide-react";

export default function Redirect() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const redirectUser = async () => {
      try {
        console.log("REDIRECT FUNCTION RUNNING");

        if (!shortCode) {
          setError("Invalid short URL");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("short_urls")
          .select("*")
          .eq("short_code", shortCode)
          .single();

        console.log("Short Code:", shortCode);
        console.log("Fetched Data:", data);
        console.log("Fetch Error:", fetchError);

        if (fetchError || !data) {
          setError("Link not found");
          setLoading(false);
          return;
        }

        // Check expiry
        if (data.is_expired) {
          setError("This link has expired");
          setLoading(false);
          return;
        }

        if (
          data.expires_at &&
          new Date(data.expires_at) < new Date()
        ) {
          setError("This link has expired");
          setLoading(false);
          return;
        }

        // Save click
        const { data: insertedData, error: clickError } =
          await supabase
            .from("clicks")
            .insert([
              {
                url_id: data.id,
              },
            ])
            .select();

        console.log("Inserted Click:", insertedData);
        console.log("Click Error:", clickError);

        if (clickError) {
          console.error("CLICK INSERT ERROR:", clickError);
        }

        // Small delay to ensure insert completes
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        // Redirect
        window.location.replace(data.original_url);
      } catch (err) {
        console.error("Redirect Error:", err);
        setError("Something went wrong");
        setLoading(false);
      }
    };

    redirectUser();
  }, [shortCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="mb-4">{error}</p>

          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}