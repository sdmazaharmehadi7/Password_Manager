import React, { useEffect, useRef, useState } from 'react';
import button from "../assets/button.gif";
import eye from "../assets/eye.gif";
import eyecross from "../assets/eyecross.png";
import copy from "../assets/copygreen.svg";
import check from "../assets/check.png";
import edit from "../assets/edit.gif";
import del from "../assets/delete.gif";
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from "uuid";

const Manager = ({ secretKey, onExitVault }) => {
    const ref = useRef();
    const passwordRef = useRef();
    const [form, setForm] = useState({ site: "", username: "", password: "" });
    const [passwordArray, setPasswordArray] = useState([]);
    const [copied, setCopied] = useState("");
    const [showKeyDetails, setShowKeyDetails] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    // Fetch passwords strictly belonging to this authenticated vault
    const getPasswords = async () => {
        try {
            const req = await fetch("http://localhost:3000/api/vault/passwords", {
                headers: {
                    "x-secret-key": secretKey
                }
            });

            if (req.status === 401) {
                toast.error("Vault session unauthorized or expired.");
                if (onExitVault) onExitVault();
                return;
            }

            const passwords = await req.json();
            if (Array.isArray(passwords)) {
                setPasswordArray(passwords);
            }
        } catch (err) {
            console.error("Failed to fetch passwords:", err);
            toast.error("Could not fetch passwords from server.");
        }
    };

    useEffect(() => {
        if (secretKey) {
            getPasswords();
        }
    }, [secretKey]);

    const showPassword = () => {
        passwordRef.current.type = "text";
        if (ref.current.src.includes(eyecross)) {
            ref.current.src = eye;
            passwordRef.current.type = "password";
        } else {
            ref.current.src = eyecross;
            passwordRef.current.type = "text";
        }
    };

    const savePassword = async () => {
        if (
            form.site.length > 3 &&
            form.username.length > 3 &&
            form.password.length > 3
        ) {
            const id = form.id || uuidv4();
            const passwordData = {
                ...form,
                id
            };

            // Update frontend state immediately
            setPasswordArray([
                ...passwordArray.filter(item => item.id !== id),
                passwordData
            ]);

            try {
                // Save to MongoDB scoped strictly to this secret-key vault
                const res = await fetch("http://localhost:3000/api/vault/passwords", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-secret-key": secretKey
                    },
                    body: JSON.stringify(passwordData)
                });

                if (!res.ok) {
                    toast.error("Failed to save password to vault.");
                    return;
                }

                // Clear form
                setForm({
                    site: "",
                    username: "",
                    password: ""
                });

                toast("Password saved!", {
                    position: "top-right",
                    autoClose: 5000,
                    theme: "dark",
                });
            } catch (err) {
                console.error("Error saving password:", err);
                toast.error("Error saving password to server.");
            }
        } else {
            toast("Error: Password not saved! Fields must be > 3 characters.");
        }
    };

    const deletePassword = async (id) => {
        let c = confirm("Do you really want to delete this password?");
        if (c) {
            setPasswordArray(passwordArray.filter(item => item.id !== id));

            try {
                const res = await fetch(`http://localhost:3000/api/vault/passwords/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "x-secret-key": secretKey
                    },
                    body: JSON.stringify({ id })
                });

                if (!res.ok) {
                    toast.error("Failed to delete password on server.");
                    return;
                }

                toast('Password Deleted!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
            } catch (err) {
                console.error("Error deleting password:", err);
                toast.error("Failed to delete password.");
            }
        }
    };

    const editPassword = (id) => {
        const target = passwordArray.find(item => item.id === id);
        if (target) {
            setForm(target);
            setPasswordArray(passwordArray.filter(item => item.id !== id));
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const copyText = (text, id) => {
        toast('Copied To Clipboard!');
        navigator.clipboard.writeText(text);
        setCopied(id);

        setTimeout(() => {
            setCopied("");
        }, 1500);
    };

    const copySecretKey = () => {
        navigator.clipboard.writeText(secretKey);
        setCopiedKey(true);
        toast.info("Secret Key copied to clipboard!");
        setTimeout(() => setCopiedKey(false), 2000);
    };

    return (
        <div className="mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-6 md:py-10">
            {/* Vault Status Header Bar */}
            <div className="bg-slate-900 border border-green-500/40 rounded-2xl p-3 sm:p-4 mb-6 shadow-md flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs sm:text-sm font-semibold text-green-400 uppercase tracking-wider">
                        Private Vault Active
                    </span>
                    <span className="text-xs text-slate-400 ml-1 hidden sm:inline">|</span>
                    <span className="text-xs font-mono text-slate-300">
                        {showKeyDetails
                            ? secretKey
                            : `Key: ${secretKey ? secretKey.slice(0, 6) + '...' + secretKey.slice(-4) : ''}`}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowKeyDetails(!showKeyDetails)}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                        {showKeyDetails ? "Mask Key" : "Reveal Key"}
                    </button>
                    <button
                        onClick={copySecretKey}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-green-400 border border-slate-700 transition"
                    >
                        {copiedKey ? "Copied!" : "Copy Key"}
                    </button>
                    <button
                        onClick={onExitVault}
                        className="text-xs px-3 py-1 rounded-md bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 transition font-medium"
                    >
                        Exit Vault
                    </button>
                </div>
            </div>

            {/* Title */}
            <h1 className='text-4xl text font-bold text-center'>
                <span className='text-green-700'>&lt;</span>
                <span>Pass</span>
                <span className='text-green-700'>Op/&gt;</span>
            </h1>
            <p className='text-green-700 text-lg text-center'>Your Own Password Manager</p>

            {/* Input Form */}
            <div className='flex flex-col p-4 text-black gap-5 items-center'>
                {/* Input 1 */}
                <input
                    value={form.site}
                    onChange={handleChange}
                    placeholder='Enter website url'
                    className='rounded-full border border-green-500 w-full p-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400'
                    type="text"
                    name='site'
                    required
                />
                <div className='flex flex-col md:flex-row w-full gap-5 md:gap-8'>
                    {/* input 2 */}
                    <input
                        value={form.username}
                        onChange={handleChange}
                        placeholder='Enter Username'
                        className='rounded-full border border-green-500 w-full p-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400'
                        type="text"
                        name='username'
                        required
                    />
                    <div className='relative w-full'>
                        {/* input 3 */}
                        <input
                            ref={passwordRef}
                            value={form.password}
                            onChange={handleChange}
                            placeholder='Enter Password'
                            className='rounded-full border border-green-500 w-full p-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400'
                            type="password"
                            name='password'
                            required
                        />
                        <span onClick={showPassword} className='absolute right-3 top-2.5 cursor-pointer'>
                            <img ref={ref} src={eye} alt="eye" className="w-5 h-5" />
                        </span>
                    </div>
                </div>
                <button
                    onClick={savePassword}
                    className="flex items-center gap-2 justify-center bg-green-400 rounded-full px-5 py-2 w-fit hover:bg-green-300 border border-green-600 font-semibold shadow transition"
                >
                    <img src={button} alt="Add" className="w-7 h-7" />
                    Save
                </button>
            </div>

            {/* Passwords Table */}
            <div className="passwords">
                <h2 className='font-bold text-2xl py-4'>Your Passwords</h2>
                {passwordArray.length === 0 && (
                    <div className="text-slate-500 italic py-4">No Passwords To Show in this Vault</div>
                )}
                {passwordArray.length !== 0 && (
                    <div className="overflow-x-auto rounded-md border border-green-600">
                        <table className="table-auto w-full">
                            <thead className='bg-green-800 text-white'>
                                <tr>
                                    <th className='py-2 px-3 text-left'>Site</th>
                                    <th className='py-2 px-3 text-left'>Username</th>
                                    <th className='py-2 px-3 text-left'>Password</th>
                                    <th className='py-2 px-3 text-center'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='bg-green-50'>
                                {passwordArray.map((item, index) => {
                                    return (
                                        <tr key={item.id || index} className="border-b border-green-200 hover:bg-green-100 transition">
                                            <td className='py-2 px-3 border border-white text-left relative'>
                                                <div className='flex items-center justify-between'>
                                                    <span className="truncate max-w-[200px]">
                                                        <a
                                                            href={item.site.startsWith('http') ? item.site : `https://${item.site}`}
                                                            target='_blank'
                                                            rel='noreferrer'
                                                            className="text-green-900 hover:underline"
                                                        >
                                                            {item.site}
                                                        </a>
                                                    </span>
                                                    <div
                                                        onClick={() => copyText(item.site, `site-${index}`)}
                                                        className='cursor-pointer ml-2 shrink-0'
                                                        title="Copy Site"
                                                    >
                                                        {copied === `site-${index}` ? (
                                                            <span className="text-green-600"><img className='w-5' src={check} alt="Copied" /></span>
                                                        ) : (
                                                            <img className="w-6 p-1 hover:bg-green-300 rounded" src={copy} alt="copy" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='py-2 px-3 border border-white text-left relative'>
                                                <div className='flex items-center justify-between'>
                                                    <span className="truncate max-w-[150px]">{item.username}</span>
                                                    <div
                                                        onClick={() => copyText(item.username, `username-${index}`)}
                                                        className='cursor-pointer ml-2 shrink-0'
                                                        title="Copy Username"
                                                    >
                                                        {copied === `username-${index}` ? (
                                                            <span className="text-green-600"><img className='w-5' src={check} alt="Copied" /></span>
                                                        ) : (
                                                            <img className="w-6 p-1 hover:bg-green-300 rounded" src={copy} alt="copy" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='py-2 px-3 border border-white text-left relative'>
                                                <div className='flex items-center justify-between'>
                                                    <span className="truncate max-w-[150px]">{'•'.repeat(Math.min(item.password.length, 12))}</span>
                                                    <div
                                                        onClick={() => copyText(item.password, `password-${index}`)}
                                                        className='cursor-pointer ml-2 shrink-0'
                                                        title="Copy Password"
                                                    >
                                                        {copied === `password-${index}` ? (
                                                            <span className="text-green-600"><img className='w-5' src={check} alt="Copied" /></span>
                                                        ) : (
                                                            <img className="w-6 p-1 hover:bg-green-300 rounded" src={copy} alt="copy" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='py-2 px-3 border border-white text-center'>
                                                <div className='flex justify-center items-center gap-2'>
                                                    <button
                                                        onClick={() => { editPassword(item.id); }}
                                                        className='cursor-pointer p-1 hover:bg-green-300 rounded'
                                                        title="Edit Password"
                                                    >
                                                        <img className='w-5' src={edit} alt="Edit" />
                                                    </button>
                                                    <button
                                                        onClick={() => { deletePassword(item.id); }}
                                                        className='cursor-pointer p-1 hover:bg-green-300 rounded'
                                                        title="Delete Password"
                                                    >
                                                        <img className='w-5' src={del} alt="Delete" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Manager;