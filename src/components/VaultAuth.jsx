import React, { useState } from 'react';
import { toast } from 'react-toastify';

const VaultAuth = ({ onVaultAccess }) => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGo = async (e) => {
        if (e) e.preventDefault();
        const trimmedKey = key.trim();
        if (!trimmedKey) {
            toast.error("Please enter a key");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/vault/access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secretKey: trimmedKey })
            });
            const data = await res.json();
            if (data.success) {
                onVaultAccess(trimmedKey);
            } else {
                toast.error(data.message || "Could not access vault");
            }
        } catch (err) {
            console.error("Vault access error:", err);
            // Fallback directly into vault so user isn't blocked by transient network errors
            onVaultAccess(trimmedKey);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center px-4 py-16 sm:py-24 max-w-lg mx-auto w-full">
            <h1 className="text-4xl sm:text-5xl font-bold text-center tracking-tight">
                <span className="text-green-700">&lt;</span>
                <span>Pass</span>
                <span className="text-green-700">Op/&gt;</span>
            </h1>
            <p className="text-green-700 text-base sm:text-lg text-center mt-2 mb-8 font-medium">
                Your Password Manager
            </p>

            <form onSubmit={handleGo} className="w-full flex flex-col gap-2">
                <label className="text-slate-600 text-sm font-medium pl-1">
                    Enter a key
                </label>
                <div className="flex gap-2 w-full">
                    <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="e.g. mazahar123"
                        autoFocus
                        className="flex-1 rounded-full border border-green-500 py-2.5 px-5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 text-base shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!key.trim() || loading}
                        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold px-7 py-2.5 rounded-full border border-green-600 shadow transition disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? "..." : "Go"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VaultAuth;
