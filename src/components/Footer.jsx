import React from 'react'
import heart from "../assets/heart.png"

const Footer = () => {
    return (
        <div className='bg-slate-800 text-white flex flex-col justify-center items-center '>
            <div className='logo font-bold text-white text-2xl'>
                <span className='text-green-700'>&lt;</span>
                <span>Pass</span>
                <span className='text-green-700'>Op/&gt;</span>

            </div>
            <div className='flex gap-1 text-xs'>Created with<img className='w-6' src={heart} alt="" />By MAZ</div>
        </div>
    )
}

export default Footer