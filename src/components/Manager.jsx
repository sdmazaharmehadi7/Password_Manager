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

    // Fetch passwords strictly belonging to this authenticated vault
    const getPasswords = async () => {
        try {
            const req = await fetch("/api/vault/passwords", {
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
                const res = await fetch("/api/vault/passwords", {
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
                    autoClose: 3000,
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
                const res = await fetch(`/api/vault/passwords/${id}`, {
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
                    autoClose: 3000,
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

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            {/* Title */}
            <h1 className='text-3xl sm:text-4xl font-bold text-center'>
                <span className='text-green-700'>&lt;</span>
                <span>Pass</span>
                <span className='text-green-700'>Op/&gt;</span>
            </h1>
            <p className='text-green-700 text-base sm:text-lg text-center mt-1 mb-6'>
                Your Own Password Manager
            </p>

            {/* Input Form */}
            <div className='flex flex-col p-4 text-black gap-4 items-center max-w-4xl mx-auto w-full'>
                <input
                    value={form.site}
                    onChange={handleChange}
                    placeholder='Enter website url'
                    className='rounded-full border border-green-500 w-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base shadow-sm'
                    type="text"
                    name='site'
                    required
                />
                <div className='flex flex-col md:flex-row w-full gap-4'>
                    <input
                        value={form.username}
                        onChange={handleChange}
                        placeholder='Enter Username'
                        className='rounded-full border border-green-500 w-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base shadow-sm'
                        type="text"
                        name='username'
                        required
                    />
                    <div className='relative w-full'>
                        <input
                            ref={passwordRef}
                            value={form.password}
                            onChange={handleChange}
                            placeholder='Enter Password'
                            className='rounded-full border border-green-500 w-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base shadow-sm'
                            type="password"
                            name='password'
                            required
                        />
                        <span onClick={showPassword} className='absolute right-3.5 top-2.5 cursor-pointer'>
                            <img ref={ref} src={eye} alt="eye" className="w-5 h-5" />
                        </span>
                    </div>
                </div>
                <button
                    onClick={savePassword}
                    className="flex items-center gap-2 justify-center bg-green-400 rounded-full px-6 py-2 w-fit hover:bg-green-300 border border-green-600 font-semibold shadow transition cursor-pointer"
                >
                    <img src={button} alt="Add" className="w-6 h-6" />
                    Save
                </button>
            </div>

            {/* Passwords Table Section - Wide and Responsive */}
            <div className="passwords w-full mt-6">
                <h2 className='font-bold text-xl sm:text-2xl py-3'>Your Passwords</h2>
                {passwordArray.length === 0 && (
                    <div className="text-slate-500 italic py-4">No Passwords To Show</div>
                )}
                {passwordArray.length !== 0 && (
                    <div className="overflow-x-auto rounded-lg border border-green-600 shadow-sm w-full">
                        <table className="table-auto w-full">
                            <thead className='bg-green-800 text-white'>
                                <tr>
                                    <th className='py-3 px-4 text-left font-semibold text-sm sm:text-base w-2/5'>Site</th>
                                    <th className='py-3 px-4 text-left font-semibold text-sm sm:text-base w-1/4'>Username</th>
                                    <th className='py-3 px-4 text-left font-semibold text-sm sm:text-base w-1/4'>Password</th>
                                    <th className='py-3 px-4 text-center font-semibold text-sm sm:text-base w-28'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='bg-green-50 divide-y divide-green-200'>
                                {passwordArray.map((item, index) => {
                                    return (
                                        <tr key={item.id || index} className="hover:bg-green-100 transition">
                                            {/* Site Column */}
                                            <td className='py-3 px-4 text-left border-r border-green-100'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <a
                                                        href={item.site.startsWith('http') ? item.site : `https://${item.site}`}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                        className="text-green-900 hover:underline break-all font-medium text-sm sm:text-base"
                                                    >
                                                        {item.site}
                                                    </a>
                                                    <div
                                                        onClick={() => copyText(item.site, `site-${index}`)}
                                                        className='cursor-pointer p-1 shrink-0'
                                                        title="Copy Site"
                                                    >
                                                        {copied === `site-${index}` ? (
                                                            <span className="text-green-600"><img className='w-4 h-4 sm:w-5 sm:h-5' src={check} alt="Copied" /></span>
                                                        ) : (
                                                            <img className="w-5 h-5 sm:w-6 sm:h-6 p-0.5 hover:bg-green-300 rounded" src={copy} alt="copy" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Username Column */}
                                            <td className='py-3 px-4 text-left border-r border-green-100'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <span className="break-all text-sm sm:text-base text-slate-800">{item.username}</span>
                                                    <div
                                                        onClick={() => copyText(item.username, `username-${index}`)}
                                                        className='cursor-pointer p-1 shrink-0'
                                                        title="Copy Username"
                                                    >
                                                        {copied === `username-${index}` ? (
                                                            <span className="text-green-600"><img className='w-4 h-4 sm:w-5 sm:h-5' src={check} alt="Copied" /></span>
                                                        ) : (
                                                            <img className="w-5 h-5 sm:w-6 sm:h-6 p-0.5 hover:bg-green-300 rounded" src={copy} alt="copy" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Password Column */}
                                            <td className='py-3 px-4 text-left border-r border-green-100'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <span className="font-mono text-sm sm:text-base text-slate-800 tracking-wider">
                                                        {'•'.repeat(Math.min(item.password.length, 12))}
                                                    </span>
                                                    <div
                                                        onClick={() => copyText(item.password, `password-${index}`)}
                                                        className='cursor-pointer p-1 shrink-0'
                                                        title="Copy Password"
                                                    >
                                                        {copied === `password-${index}` ? (
                                                            <span className="text-green-600"><img className='w-4 h-4 sm:w-5 sm:h-5' src={check} alt="Copied" /></span>
                                                        ) : (
                                                            <img className="w-5 h-5 sm:w-6 sm:h-6 p-0.5 hover:bg-green-300 rounded" src={copy} alt="copy" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Actions Column */}
                                            <td className='py-3 px-4 text-center'>
                                                <div className='flex justify-center items-center gap-2'>
                                                    <button
                                                        onClick={() => { editPassword(item.id); }}
                                                        className='cursor-pointer p-1 hover:bg-green-300 rounded transition'
                                                        title="Edit Password"
                                                    >
                                                        <img className='w-5 h-5' src={edit} alt="Edit" />
                                                    </button>
                                                    <button
                                                        onClick={() => { deletePassword(item.id); }}
                                                        className='cursor-pointer p-1 hover:bg-green-300 rounded transition'
                                                        title="Delete Password"
                                                    >
                                                        <img className='w-5 h-5' src={del} alt="Delete" />
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