import React from 'react';
import git from "../assets/github.svg";

const Navbar = ({ secretKey, onExitVault }) => {
    return (
        <nav className='bg-slate-800 text-white'>
            <div className='flex justify-between items-center px-4 sm:px-6 md:px-8 py-3.5 h-14 max-w-7xl mx-auto'>
                <div className='logo font-bold text-white text-xl sm:text-2xl cursor-pointer flex items-center gap-0.5'>
                    <span className='text-green-500'>&lt;</span>
                    <span>Pass</span>
                    <span className='text-green-500'>Op/&gt;</span>
                </div>

                <div className='flex items-center gap-3 sm:gap-4'>
                    {secretKey && (
                        <div className='flex items-center gap-2 text-xs sm:text-sm'>
                            <span className='text-slate-400'>Key:</span>
                            <span className='font-mono font-medium text-green-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700 max-w-[140px] sm:max-w-[220px] truncate'>
                                {secretKey}
                            </span>
                            <button
                                onClick={onExitVault}
                                title="Exit vault"
                                className='px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 transition cursor-pointer'
                            >
                                Exit
                            </button>
                        </div>
                    )}

                    <a
                        href="https://github.com/sdmazaharmehadi7/Password_Manager"
                        target="_blank"
                        rel="noreferrer"
                        className='flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-700 transition text-xs sm:text-sm text-slate-300'
                    >
                        <img className='invert w-4 h-4' src={git} alt="GitHub" />
                        <span className="hidden sm:inline">GitHub</span>
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;