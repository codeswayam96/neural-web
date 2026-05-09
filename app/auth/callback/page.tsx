"use client";

import { useEffect } from "react";
import { useSSOCallback } from "@codeswayam/auth";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    const { status, error } = useSSOCallback();

    useEffect(() => {
        if (status === "success") {
            const params = new URLSearchParams(window.location.search);
            const destination = params.get("redirect") || "/dashboard";
            window.location.href = destination;
        }
    }, [status]);

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold mb-2">Authentication Failed</h1>
                    <p className="text-sm opacity-80">{error || "An unknown error occurred during sign-in."}</p>
                    <button 
                        onClick={() => window.location.href = "/"}
                        className="mt-6 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Finalizing Sign-in</h2>
                    <p className="text-sm text-muted-foreground mt-1">Securely connecting to CodeSwayam SSO...</p>
                </div>
            </div>
        </div>
    );
}
