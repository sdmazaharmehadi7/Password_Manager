import React from 'react';
import git from "../assets/github.svg";

const Navbar = ({ secretKey, onExitVault }) => {
    return (
        <nav className='bg-slate-800 text-white'>
            <div className='flex justify-between items-center px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-4 h-16 mx-auto'>
                <div className='logo font-bold text-white text-2xl cursor-pointer flex items-center gap-1'>
                    <span className='text-green-500'>&lt;</span>
                    <span>Pass</span>
                    <span className='text-green-500'>Op/&gt;</span>
                </div>

                <div className='flex items-center gap-4'>
                    {secretKey && (
                        <button
                            onClick={onExitVault}
                            title="Exit current vault"
                            className='flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-200 transition'
                        >
                            <span>🔒</span>
                            <span>Exit Vault</span>
                        </button>
                    )}

                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                        className='flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-700 transition border border-slate-700 text-sm'
                    >
                        <img className='invert w-5 h-5' src={git} alt="GitHub" />
                        <span className="hidden sm:inline">GitHub</span>
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;