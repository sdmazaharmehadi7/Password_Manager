import React, { useState } from 'react';
import copy from "../assets/copygreen.svg";
import check from "../assets/check.png";
import eye from "../assets/eye.gif";
import eyecross from "../assets/eyecross.png";
import { toast } from 'react-toastify';

const VaultAuth = ({ onVaultAccess }) => {
    const [existingKey, setExistingKey] = useState('');
    const [createdKey, setCreatedKey] = useState('');
    const [showExistingKey, setShowExistingKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [loadingAccess, setLoadingAccess] = useState(false);

    // Create a new vault and receive generated key from backend
    const handleCreateKey = async () => {
        setLoadingCreate(true);
        try {
            const res = await fetch("http://localhost:3000/api/vault/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.success && data.secretKey) {
                setCreatedKey(data.secretKey);
                toast.success("Secret key generated successfully!");
            } else {
                toast.error(data.message || "Failed to create vault. Please try again.");
            }
        } catch (err) {
            console.error("Vault creation error:", err);
            toast.error("Could not connect to server. Please check backend.");
        } finally {
            setLoadingCreate(false);
        }
    };

    // Access an existing vault with supplied secret key
    const handleAccessVault = async (e) => {
        if (e) e.preventDefault();
        const trimmedKey = existingKey.trim();
        if (!trimmedKey) {
            toast.error("Please enter your secret key");
            return;
        }

        setLoadingAccess(true);
        try {
            const res = await fetch("http://localhost:3000/api/vault/access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secretKey: trimmedKey })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Vault accessed successfully!");
                onVaultAccess(trimmedKey);
            } else {
                toast.error(data.message || "Invalid secret key. Vault not found.");
            }
        } catch (err) {
            console.error("Vault access error:", err);
            toast.error("Could not connect to server. Please check backend.");
        } finally {
            setLoadingAccess(false);
        }
    };

    // Copy key to clipboard
    const copyKeyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.info("Secret Key copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-8 md:py-12 max-w-4xl">
            {/* Header / Logo */}
            <h1 className="text-4xl font-bold text-center">
                <span className="text-green-700">&lt;</span>
                <span>Pass</span>
                <span className="text-green-700">Op/&gt;</span>
            </h1>
            <p className="text-green-700 text-lg text-center mb-8">Your Own Password Manager</p>

            {createdKey ? (
                /* Generated Secret Key Card */
                <div className="bg-white border-2 border-green-500 rounded-2xl p-6 sm:p-8 shadow-lg max-w-xl mx-auto animate-fade-in text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
                        <span className="text-3xl">🔑</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Secret Key</h2>
                    <p className="text-slate-600 text-sm mb-4">
                        Save this key safely. You need this key to access your vault again.
                    </p>

                    <div className="flex items-center justify-between bg-slate-900 text-green-400 p-3 px-4 rounded-xl font-mono text-sm sm:text-base border border-green-600 break-all select-all mb-4">
                        <span className="tracking-wider">{createdKey}</span>
                        <button
                            onClick={() => copyKeyToClipboard(createdKey)}
                            title="Copy Secret Key"
                            className="ml-3 p-1.5 hover:bg-slate-800 rounded-lg shrink-0 transition"
                        >
                            {copied ? (
                                <img className="w-6 h-6" src={check} alt="Copied" />
                            ) : (
                                <img className="w-6 h-6 filter invert" src={copy} alt="Copy" />
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-800 mb-6 text-left">
                        <span className="font-bold">⚠️ Important:</span> We never store your raw secret key on our servers—only a secure one-way hash. If you lose this key, your passwords cannot be recovered.
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => copyKeyToClipboard(createdKey)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-green-600 text-green-700 font-semibold hover:bg-green-50 transition"
                        >
                            {copied ? "Copied!" : "Copy Key"}
                        </button>
                        <button
                            onClick={() => onVaultAccess(createdKey)}
                            className="flex items-center justify-center gap-2 bg-green-500 text-slate-900 font-bold px-6 py-2.5 rounded-full hover:bg-green-400 border border-green-600 shadow-md transition"
                        >
                            Enter My Vault &rarr;
                        </button>
                    </div>
                </div>
            ) : (
                /* Landing Cards: Create or Enter Key */
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* First visit: Create Secret Key */}
                    <div className="bg-white border-2 border-green-400 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-lg transition">
                        <div>
                            <div className="text-3xl mb-3">🛡️</div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome to PassOp</h2>
                            <p className="text-slate-600 text-sm mb-6">
                                Create your private password vault. No email, signup, or password required. An anonymous secret key protects your data.
                            </p>
                        </div>
                        <button
                            onClick={handleCreateKey}
                            disabled={loadingCreate}
                            className="w-full flex items-center justify-center gap-2 bg-green-400 hover:bg-green-300 text-slate-900 font-bold py-3 px-6 rounded-full border border-green-600 transition shadow disabled:opacity-50"
                        >
                            {loadingCreate ? "Generating..." : "Create Secret Key"}
                        </button>
                    </div>

                    {/* Returning user: Enter Secret Key */}
                    <div className="bg-white border-2 border-slate-300 hover:border-green-400 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-lg transition">
                        <div>
                            <div className="text-3xl mb-3">🔓</div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">Already have a Secret Key?</h2>
                            <p className="text-slate-600 text-sm mb-4">
                                Enter your existing secret key to unlock your personal vault.
                            </p>
                            <div className="relative mb-4">
                                <input
                                    type={showExistingKey ? "text" : "password"}
                                    value={existingKey}
                                    onChange={(e) => setExistingKey(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAccessVault(e)}
                                    placeholder="Enter Secret Key"
                                    className="w-full rounded-full border border-green-500 py-2.5 pl-4 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 font-mono text-sm"
                                />
                                <span
                                    onClick={() => setShowExistingKey(!showExistingKey)}
                                    className="absolute right-3 top-2.5 cursor-pointer"
                                    title={showExistingKey ? "Hide key" : "Show key"}
                                >
                                    <img
                                        src={showExistingKey ? eyecross : eye}
                                        alt="toggle view"
                                        className="w-5 h-5 opacity-70 hover:opacity-100"
                                    />
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleAccessVault}
                            disabled={loadingAccess || !existingKey.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-full border border-slate-900 transition shadow disabled:opacity-50"
                        >
                            {loadingAccess ? "Verifying..." : "Access Vault"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VaultAuth;
